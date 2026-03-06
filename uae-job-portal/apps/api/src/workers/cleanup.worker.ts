import { Worker } from 'bullmq';
import { QUEUE_NAMES, CleanupData, bullConnection } from '../lib/queue';
import prisma from '../lib/prisma';

const worker = new Worker<CleanupData>(
  QUEUE_NAMES.CLEANUP,
  async (job) => {
    const { task } = job.data;

    if (task === 'expire-jobs') {
      const result = await prisma.job.updateMany({
        where: { status: 'PUBLISHED', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });
      console.log(`[Cleanup] Expired ${result.count} jobs`);
    }

    if (task === 'purge-tokens') {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      console.log(`[Cleanup] Purged ${result.count} expired refresh tokens`);
    }

    if (task === 'purge-notifications') {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const result = await prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff }, readAt: { not: null } },
      });
      console.log(`[Cleanup] Purged ${result.count} old notifications`);
    }
  },
  { connection: bullConnection, concurrency: 1 }
);

worker.on('failed', (job, err) => console.error(`[CleanupWorker] Failed: ${err.message}`));

export default worker;
