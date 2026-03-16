import { Worker } from 'bullmq';
import { QUEUE_NAMES, JobAlertsData, emailQueue, bullConnection } from '../lib/queue';
import prisma from '../lib/prisma';
import { jobAlertTemplate } from '../lib/email';
import { config } from '../config';
import { Prisma } from '@prisma/client';

const worker = new Worker<JobAlertsData>(
  QUEUE_NAMES.JOB_ALERTS,
  async (job) => {
    const { alertId, runAll } = job.data;

    let alerts;
    if (alertId) {
      const alert = await prisma.jobAlert.findUnique({ where: { id: alertId } });
      alerts = alert ? [alert] : [];
    } else if (runAll) {
      alerts = await prisma.jobAlert.findMany({
        where: { isActive: true },
        include: { profile: { include: { user: true } } },
      });
    } else {
      return;
    }

    for (const alert of alerts) {
      try {
        const where: Prisma.JobWhereInput = {
          status: 'PUBLISHED',
          publishedAt: alert.lastSentAt ? { gt: alert.lastSentAt } : undefined,
        };

        if (alert.keywords) {
          where.OR = [
            { title: { contains: alert.keywords } },
            { description: { contains: alert.keywords } },
          ];
        }

        if (alert.categoryId) where.categoryId = alert.categoryId;
        if (alert.emirate) where.emirate = alert.emirate;
        if (alert.workMode) where.workMode = alert.workMode;
        if (alert.salaryMin) where.salaryMin = { gte: alert.salaryMin };

        const jobs = await prisma.job.findMany({
          where,
          include: { employer: { select: { companyName: true } } },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        });

        if (jobs.length === 0) continue;

        const profile = (alert as typeof alert & { profile?: { user?: { email: string }; firstName: string } }).profile;
        const userEmail = profile?.user?.email;
        if (!userEmail) continue;

        await emailQueue.add('alert', {
          to: userEmail,
          subject: `[UAE Jobs] ${jobs.length} new jobs match "${alert.name}"`,
          html: jobAlertTemplate(
            profile!.firstName,
            jobs.map((j) => ({
              title: j.title,
              company: j.employer.companyName,
              slug: j.slug,
              emirate: j.emirate,
            })),
            config.cors.origin
          ),
        });

        await prisma.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } });
      } catch (err) {
        console.error(`[AlertWorker] Failed for alert ${alert.id}:`, err);
      }
    }
  },
  { connection: bullConnection, concurrency: 2 }
);

worker.on('failed', (job, err) => console.error(`[AlertWorker] Failed: ${err.message}`));

export default worker;
