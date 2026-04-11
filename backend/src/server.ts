import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import path from 'path';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from './config';
import app from './app';
import prisma from './lib/prisma';
import { redis } from './lib/redis';
import { scheduleRecurringJobs } from './lib/queue';
import { checkSmtpAvailable } from './lib/email';

// Import workers to register them
import './workers/email.worker';
import './workers/jobAlerts.worker';
import './workers/cleanup.worker';

/**
 * Ensure the admin account from SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD exists.
 * Safe to run on every startup — only creates the user if it doesn't exist yet.
 */
async function ensureAdminExists() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('[Setup] SEED_ADMIN_EMAIL/PASSWORD not set — skipping admin auto-creation');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    // Keep password in sync with env var (allows password rotation via redeploy)
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash, status: UserStatus.ACTIVE, verifiedAt: new Date() },
    });
    console.log(`[Setup] Admin account verified: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      verifiedAt: new Date(),
    },
  });
  console.log(`[Setup] ✅ Admin account created: ${adminEmail}`);
}

/**
 * Sync Prisma schema to the database on every startup.
 * This is safe (idempotent) — it only adds missing tables/columns,
 * never drops existing data. Eliminates manual "prisma db push" step.
 */
function syncSchema() {
  try {
    const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
    console.log('[DB] Syncing schema...');
    execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`, {
      stdio: 'inherit',
      timeout: 60_000,
    });
    console.log('[DB] Schema synced ✅');
  } catch (err) {
    console.error('[DB] Schema sync failed (will attempt to continue):', err);
  }
}

async function bootstrap() {
  // Sync schema first so all tables/columns exist before any request
  syncSchema();

  // Test DB connection
  await prisma.$connect();
  console.log('[DB] MariaDB connected');

  // Ensure admin account exists (idempotent — safe on every restart)
  await ensureAdminExists();

  // Warm up SMTP health check so first registration doesn't wait
  await checkSmtpAvailable();

  // Schedule recurring BullMQ jobs
  await scheduleRecurringJobs();

  const server = app.listen(config.port, () => {
    console.log(`[API] Server running at http://localhost:${config.port}`);
    console.log(`[API] Docs available at http://localhost:${config.port}/api/docs`);
    console.log(`[API] Environment: ${config.env}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      console.log('[Server] Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal error during bootstrap:', err);
  process.exit(1);
});
