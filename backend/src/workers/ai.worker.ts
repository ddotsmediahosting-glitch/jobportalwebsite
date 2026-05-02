import { Worker } from 'bullmq';
import { QUEUE_NAMES, AIJobData, bullConnection } from '../lib/queue';
import prisma from '../lib/prisma';
import {
  detectJobFraud,
  screenApplications,
  extractProfileFromResume,
} from '../lib/ai';
import { storage } from '../lib/storage';

const worker = new Worker<AIJobData>(
  QUEUE_NAMES.AI,
  async (job) => {
    const { task } = job.data;

    if (task === 'fraud-check') {
      await runFraudCheck(job.data.jobId);
    } else if (task === 'screen-application') {
      await runScreenApplication(job.data.applicationId);
    } else if (task === 'extract-resume') {
      await runExtractResume(job.data.resumeId);
    }
  },
  { connection: bullConnection, concurrency: 2 },
);

worker.on('failed', (job, err) => {
  console.error(`[AIWorker] Job ${job?.id} (${job?.data.task}) failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[AIWorker] ${job.data.task} completed (job ${job.id})`);
});

// ── Fraud check: run AI fraud detector on a freshly-posted job ────────────────

async function runFraudCheck(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true, title: true, description: true, salaryMin: true, salaryMax: true,
      employer: { select: { companyName: true } },
    },
  });
  if (!job) return;

  const result = await detectJobFraud(
    job.title,
    job.description,
    job.employer?.companyName ?? '',
    job.salaryMin,
    job.salaryMax,
  );

  await prisma.job.update({
    where: { id: jobId },
    data: {
      fraudRiskScore: result.riskScore,
      fraudRiskLevel: result.riskLevel,
      fraudFlags: result.flags,
      fraudExplanation: result.explanation,
      fraudCheckedAt: new Date(),
      // High-risk auto-flag: send back to admin for manual review.
      ...(result.riskLevel === 'HIGH' ? { status: 'PENDING_APPROVAL' } : {}),
    },
  });

  if (result.riskLevel === 'HIGH') {
    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUB_ADMIN'] } },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.id,
            type: 'JOB_FRAUD_FLAGGED',
            title: 'Job flagged as high-risk',
            body: `"${job.title}" was auto-flagged by fraud detection (score ${result.riskScore}). Review pending.`,
            payloadJson: { jobId },
          },
        }).catch(() => null),
      ),
    );
  }
}

// ── Screen application: AI fit-score for a single application ────────────────

async function runScreenApplication(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, title: true, description: true } },
      user: {
        include: { seekerProfile: { select: { firstName: true, lastName: true, headline: true, yearsOfExperience: true, skills: true } } },
      },
    },
  });
  if (!application || !application.job) return;

  const profile = application.user?.seekerProfile;
  const candidate = {
    applicationId: application.id,
    candidateName: profile
      ? `${profile.firstName} ${profile.lastName}`
      : application.user?.email || 'Candidate',
    coverLetter: application.coverLetter || undefined,
    skills: Array.isArray(profile?.skills) ? (profile!.skills as string[]) : [],
    headline: profile?.headline || undefined,
    yearsOfExperience: profile?.yearsOfExperience || undefined,
  };

  const [result] = await screenApplications(application.job.title, application.job.description, [candidate]);
  if (!result) return;

  await prisma.aIScreeningResult.upsert({
    where: { applicationId },
    create: {
      applicationId,
      jobId: application.job.id,
      fitScore: result.fitScore,
      fitLabel: result.fitLabel,
      priority: result.priority,
      matchingStrengths: result.matchingStrengths,
      gaps: result.gaps,
      recommendation: result.recommendation,
    },
    update: {
      fitScore: result.fitScore,
      fitLabel: result.fitLabel,
      priority: result.priority,
      matchingStrengths: result.matchingStrengths,
      gaps: result.gaps,
      recommendation: result.recommendation,
    },
  });
}

// ── Extract resume: parse uploaded CV with AI and pre-fill the seeker's profile ──

async function runExtractResume(resumeId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { profile: { select: { id: true, userId: true, skills: true } } },
  });
  if (!resume || !resume.profile) return;

  // Fetch the resume file from storage
  const buffer = await storage.read(resume.fileUrl);
  if (!buffer) return;

  // Extract raw text from the file
  let text = '';
  if (resume.mimeType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseLib = require('pdf-parse');
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = pdfParseLib.default || pdfParseLib;
    text = (await pdfParse(buffer)).text;
  } else if (
    resume.mimeType === 'application/msword' ||
    resume.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    text = (await mammoth.extractRawText({ buffer })).value;
  }
  text = text.trim();
  if (text.length < 50) return;

  const extracted = await extractProfileFromResume(text);

  // Merge: only fill fields the user hasn't already set (don't overwrite manual edits).
  const existing = await prisma.jobSeekerProfile.findUnique({ where: { id: resume.profile.id } });
  if (!existing) return;

  const existingSkills = Array.isArray(existing.skills) ? (existing.skills as string[]) : [];
  const mergedSkills = Array.from(new Set([...existingSkills, ...(extracted.skills || [])])).slice(0, 30);

  await prisma.jobSeekerProfile.update({
    where: { id: resume.profile.id },
    data: {
      headline: existing.headline || extracted.headline || undefined,
      bio: existing.bio || extracted.bio || undefined,
      yearsOfExperience: existing.yearsOfExperience ?? extracted.yearsOfExperience ?? undefined,
      skills: mergedSkills,
    },
  });

  // Add education entries the profile doesn't already have
  if (extracted.education?.length) {
    for (const edu of extracted.education) {
      const dup = await prisma.education.findFirst({
        where: { profileId: resume.profile.id, institution: edu.institution, degree: edu.degree },
      });
      if (!dup) {
        await prisma.education.create({
          data: {
            profileId: resume.profile.id,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || null,
            startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
            endDate: edu.endDate ? new Date(edu.endDate) : null,
          },
        }).catch(() => null);
      }
    }
  }

  // Add work experience entries the profile doesn't already have
  if (extracted.experience?.length) {
    for (const exp of extracted.experience) {
      const dup = await prisma.workExperience.findFirst({
        where: { profileId: resume.profile.id, company: exp.company, title: exp.title },
      });
      if (!dup) {
        await prisma.workExperience.create({
          data: {
            profileId: resume.profile.id,
            company: exp.company,
            title: exp.title,
            description: exp.description || null,
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            current: exp.isCurrent ?? false,
          },
        }).catch(() => null);
      }
    }
  }

  // Notify the user
  await prisma.notification.create({
    data: {
      userId: resume.profile.userId,
      type: 'PROFILE_AUTOFILLED',
      title: 'Profile updated from your CV',
      body: `We pre-filled your profile from "${resume.fileName}". Review and edit anything that needs adjusting.`,
      payloadJson: { resumeId },
    },
  }).catch(() => null);
}

export default worker;
