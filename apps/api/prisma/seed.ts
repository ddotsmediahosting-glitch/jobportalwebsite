import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function seed() {
  const adminEmail = "admin@uaejobs.local";
  const adminPassword = "Admin#12345";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      role: "ADMIN",
      passwordHash: await hashPassword(adminPassword),
      verifiedAt: new Date()
    }
  });

  const root = await prisma.category.upsert({
    where: { slug: "information-technology" },
    update: {},
    create: { name: "Information Technology", slug: "information-technology", sortOrder: 1 }
  });

  const sub = await prisma.category.upsert({
    where: { slug: "software-development" },
    update: {},
    create: { name: "Software Development", slug: "software-development", parentId: root.id, sortOrder: 1 }
  });

  const employerUser = await prisma.user.upsert({
    where: { email: "hr@techme.ae" },
    update: {},
    create: {
      email: "hr@techme.ae",
      role: "EMPLOYER",
      passwordHash: await hashPassword("Employer#123"),
      verifiedAt: new Date()
    }
  });

  const employer = await prisma.employer.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { ownerUserId: employerUser.id },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      ownerUserId: employerUser.id,
      companyName: "TechME Solutions",
      industry: "Technology",
      verifiedStatus: "APPROVED"
    }
  });

  await prisma.subscription.upsert({
    where: { employerId: employer.id },
    update: { plan: "STANDARD", status: "active" },
    create: {
      employerId: employer.id,
      plan: "STANDARD",
      provider: "mock",
      providerSubId: "seed-standard",
      status: "active",
      quotaJobPosts: 20,
      quotaFeatured: 3,
      candidateSearch: true,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.job.upsert({
    where: { slug: "senior-nodejs-engineer-dubai" },
    update: {},
    create: {
      employerId: employer.id,
      title: "Senior Node.js Engineer",
      slug: "senior-nodejs-engineer-dubai",
      description: "Build scalable backend services for a UAE fintech platform.",
      requirements: "5+ years Node.js, PostgreSQL, cloud deployment.",
      benefits: ["Medical insurance", "Annual flight allowance"],
      categoryId: sub.id,
      emirate: "Dubai",
      locationText: "Dubai Internet City",
      salaryMin: 18000,
      salaryMax: 26000,
      currency: "AED",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      visa: "VISA_PROVIDED",
      experienceMin: 5,
      experienceMax: 8,
      experienceBand: "5-8",
      languageRequirements: ["English"],
      skills: ["Node.js", "TypeScript", "PostgreSQL"],
      status: "PUBLISHED",
      immediateJoiner: false,
      moderationFlags: []
    }
  });

  console.log("Seed completed", { admin: admin.email });
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
