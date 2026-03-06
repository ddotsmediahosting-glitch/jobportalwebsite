import { Worker } from 'bullmq';
import { sendEmail } from '../lib/email';
import { QUEUE_NAMES, EmailJobData, bullConnection } from '../lib/queue';

const worker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { to, subject, html, text } = job.data;
    await sendEmail({ to, subject, html, text });
    console.log(`[EmailWorker] Sent: ${subject} → ${to}`);
  },
  {
    connection: bullConnection,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

export default worker;
