import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";

const connection = { url: env.redisUrl };
const isTest = process.env.NODE_ENV === "test";

function createQueue(name: string) {
  if (isTest) {
    return {
      add: async () => undefined,
      upsertJobScheduler: async () => undefined
    } as unknown as Queue;
  }
  return new Queue(name, { connection });
}

export const emailQueue = createQueue("email");
export const alertsQueue = createQueue("alerts");
export const cleanupQueue = createQueue("cleanup");

export function startQueueWorkers() {
  if (isTest) return;
  new Worker(
    "email",
    async (job) => {
      console.log("EMAIL JOB", job.data);
    },
    { connection }
  );

  new Worker(
    "alerts",
    async (job) => {
      console.log("ALERT JOB", job.data);
    },
    { connection }
  );

  new Worker(
    "cleanup",
    async () => {
      console.log("Cleanup expired jobs tick");
    },
    { connection }
  );
}

export async function registerRecurringJobs() {
  if (isTest) return;
  await cleanupQueue.upsertJobScheduler("cleanup-expired-jobs", { every: 60 * 60 * 1000 }, { name: "cleanup" });
  await alertsQueue.upsertJobScheduler("job-alerts-daily", { pattern: "0 8 * * *" }, { name: "alerts" });
}
