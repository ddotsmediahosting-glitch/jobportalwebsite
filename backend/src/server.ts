import { config } from './config';
import app from './app';
import prisma from './lib/prisma';
import { redis } from './lib/redis';
import { scheduleRecurringJobs } from './lib/queue';

// Import workers to register them
import './workers/email.worker';
import './workers/jobAlerts.worker';
import './workers/cleanup.worker';

async function bootstrap() {
  // Test DB connection
  await prisma.$connect();
  console.log('[DB] PostgreSQL connected');

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
