import { Queue, Worker, Job as BullJob, QueueEvents } from 'bullmq';
import { config } from '../config';

function parseBullConnection() {
  const url = new URL(config.redis.url);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    ...(url.password ? { password: url.password } : {}),
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}

const connection = parseBullConnection();
export const bullConnection = connection;

// ─── Queue names ───────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: 'email',
  JOB_ALERTS: 'job-alerts',
  CLEANUP: 'cleanup',
} as const;

// ─── Email queue ───────────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// ─── Job alerts queue ──────────────────────────────────────────────────────────

export interface JobAlertsData {
  alertId?: string;
  runAll?: boolean;
}

export const jobAlertsQueue = new Queue<JobAlertsData>(QUEUE_NAMES.JOB_ALERTS, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

// ─── Cleanup queue ─────────────────────────────────────────────────────────────

export interface CleanupData {
  task: 'expire-jobs' | 'purge-tokens' | 'purge-notifications' | 'purge-unverified-accounts';
}

export const cleanupQueue = new Queue<CleanupData>(QUEUE_NAMES.CLEANUP, {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 10,
    removeOnFail: 50,
  },
});

// ─── Schedule recurring jobs ───────────────────────────────────────────────────

export async function scheduleRecurringJobs(): Promise<void> {
  // Expire jobs daily at midnight
  await cleanupQueue.add('expire-jobs', { task: 'expire-jobs' }, { repeat: { pattern: '0 0 * * *' } });

  // Purge old refresh tokens daily
  await cleanupQueue.add('purge-tokens', { task: 'purge-tokens' }, { repeat: { pattern: '0 1 * * *' } });

  // Purge unverified accounts older than 24 hours — runs every 6 hours
  await cleanupQueue.add('purge-unverified-accounts', { task: 'purge-unverified-accounts' }, { repeat: { pattern: '0 */6 * * *' } });

  // Send daily job alerts
  await jobAlertsQueue.add('daily-alerts', { runAll: true }, { repeat: { pattern: '0 8 * * *' } });

  console.log('[Queue] Recurring jobs scheduled');
}

export { BullJob };
