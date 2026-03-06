import { PrismaClient, UserRole, UserStatus, Emirates, WorkMode, EmploymentType, VisaStatus, JobStatus, VerificationStatus, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Super Admin ────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@uaejobs.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin#12345';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryData = [
    {
      name: 'Information Technology',
      slug: 'information-technology',
      isFeatured: true,
      iconUrl: null,
      children: [
        { name: 'Software Development', slug: 'software-development' },
        { name: 'Data Science & AI', slug: 'data-science-ai' },
        { name: 'DevOps & Cloud', slug: 'devops-cloud' },
        { name: 'Cybersecurity', slug: 'cybersecurity' },
        { name: 'UI/UX Design', slug: 'ui-ux-design' },
        { name: 'IT Support', slug: 'it-support' },
      ],
    },
    {
      name: 'Finance & Banking',
      slug: 'finance-banking',
      isFeatured: true,
      iconUrl: null,
      children: [
        { name: 'Accounting', slug: 'accounting' },
        { name: 'Investment Banking', slug: 'investment-banking' },
        { name: 'Financial Analysis', slug: 'financial-analysis' },
        { name: 'Audit & Risk', slug: 'audit-risk' },
      ],
    },
    {
      name: 'Healthcare',
      slug: 'healthcare',
      isFeatured: true,
      iconUrl: null,
      children: [
        { name: 'Doctors & Physicians', slug: 'doctors-physicians' },
        { name: 'Nursing', slug: 'nursing' },
        { name: 'Pharmacy', slug: 'pharmacy' },
        { name: 'Healthcare Admin', slug: 'healthcare-admin' },
      ],
    },
    {
      name: 'Engineering',
      slug: 'engineering',
      isFeatured: false,
      iconUrl: null,
      children: [
        { name: 'Civil Engineering', slug: 'civil-engineering' },
        { name: 'Mechanical Engineering', slug: 'mechanical-engineering' },
        { name: 'Electrical Engineering', slug: 'electrical-engineering' },
        { name: 'Oil & Gas', slug: 'oil-gas' },
      ],
    },
    {
      name: 'Sales & Marketing',
      slug: 'sales-marketing',
      isFeatured: true,
      iconUrl: null,
      children: [
        { name: 'Digital Marketing', slug: 'digital-marketing' },
        { name: 'Sales Executive', slug: 'sales-executive' },
        { name: 'Brand Management', slug: 'brand-management' },
      ],
    },
    {
      name: 'Hospitality & Tourism',
      slug: 'hospitality-tourism',
      isFeatured: false,
      iconUrl: null,
      children: [
        { name: 'Hotel Management', slug: 'hotel-management' },
        { name: 'Food & Beverage', slug: 'food-beverage' },
        { name: 'Travel & Tourism', slug: 'travel-tourism' },
      ],
    },
    {
      name: 'Construction & Real Estate',
      slug: 'construction-real-estate',
      isFeatured: false,
      iconUrl: null,
      children: [
        { name: 'Project Management', slug: 'project-management' },
        { name: 'Architecture', slug: 'architecture' },
        { name: 'Real Estate Sales', slug: 'real-estate-sales' },
      ],
    },
    {
      name: 'Human Resources',
      slug: 'human-resources',
      isFeatured: false,
      iconUrl: null,
      children: [
        { name: 'Recruitment', slug: 'recruitment' },
        { name: 'HR Management', slug: 'hr-management' },
        { name: 'Training & Development', slug: 'training-development' },
      ],
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (let i = 0; i < categoryData.length; i++) {
    const cat = categoryData[i];
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: i,
        isFeatured: cat.isFeatured,
        isActive: true,
      },
    });
    categoryMap[cat.slug] = parent.id;

    for (let j = 0; j < cat.children.length; j++) {
      const child = cat.children[j];
      const childCat = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          sortOrder: j,
          isActive: true,
        },
      });
      categoryMap[child.slug] = childCat.id;
    }
  }
  console.log('✅ Categories seeded');

  // ── Sample Employers ───────────────────────────────────────────────────────
  const employerUsers = [
    {
      email: 'employer1@techcorp.ae',
      password: 'Employer#123',
      companyName: 'TechCorp UAE',
      industry: 'Information Technology',
      emirate: Emirates.DUBAI,
      description: 'Leading technology company in Dubai.',
    },
    {
      email: 'employer2@emiratesbank.ae',
      password: 'Employer#123',
      companyName: 'Emirates Financial Group',
      industry: 'Finance & Banking',
      emirate: Emirates.ABU_DHABI,
      description: 'Top financial institution in the UAE.',
    },
    {
      email: 'employer3@healthplus.ae',
      password: 'Employer#123',
      companyName: 'HealthPlus Medical Centers',
      industry: 'Healthcare',
      emirate: Emirates.SHARJAH,
      description: 'Premium healthcare provider across UAE.',
    },
  ];

  const employers: string[] = [];

  for (const eu of employerUsers) {
    const user = await prisma.user.upsert({
      where: { email: eu.email },
      update: {},
      create: {
        email: eu.email,
        passwordHash: await bcrypt.hash(eu.password, 12),
        role: UserRole.EMPLOYER,
        status: UserStatus.ACTIVE,
        verifiedAt: new Date(),
      },
    });

    const slug = slugify(eu.companyName, { lower: true, strict: true });
    const employer = await prisma.employer.upsert({
      where: { ownerUserId: user.id },
      update: {},
      create: {
        ownerUserId: user.id,
        companyName: eu.companyName,
        slug,
        industry: eu.industry,
        emirate: eu.emirate,
        description: eu.description,
        verificationStatus: VerificationStatus.APPROVED,
        verifiedAt: new Date(),
        isActive: true,
        subscription: {
          create: {
            plan: SubscriptionPlan.STANDARD,
            jobPostsLimit: 10,
            featuredPostsLimit: 2,
            candidateSearchEnabled: true,
          },
        },
      },
    });
    employers.push(employer.id);

    // Add employer as member
    await prisma.employerMember.upsert({
      where: { employerId_userId: { employerId: employer.id, userId: user.id } },
      update: {},
      create: { employerId: employer.id, userId: user.id, role: 'OWNER', joinedAt: new Date() },
    });
  }
  console.log('✅ Employers seeded');

  // ── Sample Job Seeker ──────────────────────────────────────────────────────
  const seekerUser = await prisma.user.upsert({
    where: { email: 'seeker@example.com' },
    update: {},
    create: {
      email: 'seeker@example.com',
      passwordHash: await bcrypt.hash('Seeker#12345', 12),
      role: UserRole.SEEKER,
      status: UserStatus.ACTIVE,
      verifiedAt: new Date(),
    },
  });

  await prisma.jobSeekerProfile.upsert({
    where: { userId: seekerUser.id },
    update: {},
    create: {
      userId: seekerUser.id,
      firstName: 'Ahmed',
      lastName: 'Al Rashid',
      headline: 'Senior Software Engineer | React & Node.js',
      bio: 'Experienced full-stack developer with 7+ years in UAE tech industry.',
      emirate: Emirates.DUBAI,
      location: 'Business Bay, Dubai',
      nationality: 'UAE',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      languages: ['English', 'Arabic'],
      yearsOfExperience: 7,
      immediateJoiner: false,
      noticePeriod: '1 month',
      isProfilePublic: true,
    },
  });
  console.log('✅ Sample seeker seeded');

  // ── Sample Jobs ────────────────────────────────────────────────────────────
  const sampleJobs = [
    {
      employerId: employers[0],
      categoryId: categoryMap['software-development'],
      title: 'Senior React Developer',
      description: `<p>We are looking for a talented Senior React Developer to join our growing team in Dubai.</p>
<h3>Responsibilities</h3>
<ul>
<li>Build and maintain high-quality React applications</li>
<li>Collaborate with cross-functional teams</li>
<li>Write clean, maintainable code</li>
<li>Mentor junior developers</li>
</ul>`,
      requirements: 'React, TypeScript, Node.js, 5+ years experience',
      benefits: 'Health insurance, Annual bonus, Flexible working hours',
      emirate: Emirates.DUBAI,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      visaStatus: VisaStatus.PROVIDED,
      salaryMin: 15000,
      salaryMax: 25000,
      experienceMin: 5,
      experienceMax: 10,
      level: 'Senior',
      skills: ['React', 'TypeScript', 'Node.js', 'REST APIs'],
      languages: ['English'],
      isFeatured: true,
      isUrgent: false,
    },
    {
      employerId: employers[0],
      categoryId: categoryMap['devops-cloud'],
      title: 'DevOps Engineer - AWS',
      description: `<p>Join our infrastructure team and help us scale our cloud-native platform.</p>
<h3>Responsibilities</h3>
<ul>
<li>Manage AWS infrastructure using Terraform</li>
<li>Build and maintain CI/CD pipelines</li>
<li>Monitor system performance and reliability</li>
</ul>`,
      requirements: 'AWS, Kubernetes, Docker, Terraform, 3+ years',
      benefits: 'Competitive salary, Remote-friendly, Annual leave 30 days',
      emirate: Emirates.DUBAI,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      visaStatus: VisaStatus.TRANSFER_AVAILABLE,
      salaryMin: 18000,
      salaryMax: 28000,
      experienceMin: 3,
      experienceMax: 8,
      level: 'Mid',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      languages: ['English'],
      isFeatured: false,
      isUrgent: true,
    },
    {
      employerId: employers[1],
      categoryId: categoryMap['financial-analysis'],
      title: 'Financial Analyst - UAE Markets',
      description: `<p>Emirates Financial Group is seeking a skilled Financial Analyst to support our investment team.</p>
<h3>Responsibilities</h3>
<ul>
<li>Analyse financial statements and market trends</li>
<li>Prepare financial models and forecasts</li>
<li>Support senior management with investment decisions</li>
</ul>`,
      requirements: 'CFA preferred, Excel, Financial modelling, 3+ years in UAE',
      benefits: 'Competitive package, Annual bonus up to 30%, Relocation support',
      emirate: Emirates.ABU_DHABI,
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.FULL_TIME,
      visaStatus: VisaStatus.PROVIDED,
      salaryMin: 20000,
      salaryMax: 35000,
      experienceMin: 3,
      experienceMax: 7,
      level: 'Mid',
      skills: ['Financial Analysis', 'Excel', 'Bloomberg', 'Financial Modelling'],
      languages: ['English', 'Arabic'],
      isFeatured: true,
      isUrgent: false,
    },
    {
      employerId: employers[2],
      categoryId: categoryMap['nursing'],
      title: 'Registered Nurse - ICU',
      description: `<p>HealthPlus Medical Centers is hiring experienced ICU nurses for our Sharjah facility.</p>
<h3>Responsibilities</h3>
<ul>
<li>Provide critical care to ICU patients</li>
<li>Administer medications and treatments</li>
<li>Collaborate with physicians and specialists</li>
</ul>`,
      requirements: 'Valid DHA/MOH license, BSN, 2+ years ICU experience',
      benefits: 'Housing allowance, Health insurance family cover, 30 days annual leave',
      emirate: Emirates.SHARJAH,
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.FULL_TIME,
      visaStatus: VisaStatus.PROVIDED,
      salaryMin: 8000,
      salaryMax: 14000,
      experienceMin: 2,
      experienceMax: 6,
      level: 'Mid',
      skills: ['ICU', 'Critical Care', 'Patient Monitoring', 'Medical Equipment'],
      languages: ['English'],
      isFeatured: false,
      isUrgent: true,
    },
    {
      employerId: employers[0],
      categoryId: categoryMap['data-science-ai'],
      title: 'Machine Learning Engineer',
      description: `<p>Build and deploy ML models that power our AI-driven products.</p>
<h3>Responsibilities</h3>
<ul>
<li>Design and implement ML models in Python</li>
<li>Work with large datasets and data pipelines</li>
<li>Deploy models to production on cloud infrastructure</li>
</ul>`,
      requirements: 'Python, TensorFlow/PyTorch, MLOps, 4+ years',
      benefits: 'Stock options, Remote work, Learning budget',
      emirate: Emirates.DUBAI,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      visaStatus: VisaStatus.PROVIDED,
      salaryMin: 22000,
      salaryMax: 40000,
      experienceMin: 4,
      experienceMax: 10,
      level: 'Senior',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'SQL'],
      languages: ['English'],
      isFeatured: true,
      isUrgent: false,
    },
  ];

  for (const jobData of sampleJobs) {
    const baseSlug = slugify(jobData.title, { lower: true, strict: true });
    const uniqueSlug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await prisma.job.create({
      data: {
        employerId: jobData.employerId,
        categoryId: jobData.categoryId,
        title: jobData.title,
        slug: uniqueSlug,
        description: jobData.description,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        emirate: jobData.emirate,
        workMode: jobData.workMode,
        employmentType: jobData.employmentType,
        visaStatus: jobData.visaStatus,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        experienceMin: jobData.experienceMin,
        experienceMax: jobData.experienceMax,
        level: jobData.level,
        skills: jobData.skills,
        languages: jobData.languages,
        isFeatured: jobData.isFeatured,
        isUrgent: jobData.isUrgent,
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Sample jobs seeded');

  // ── Site settings ──────────────────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'UAE Jobs Portal' },
  });

  await prisma.siteSettings.upsert({
    where: { key: 'jobs_require_approval' },
    update: {},
    create: { key: 'jobs_require_approval', value: false },
  });

  // ── Content pages ──────────────────────────────────────────────────────────
  const pages = [
    {
      slug: 'about',
      title: 'About Us',
      content: '<h1>About UAE Jobs Portal</h1><p>The leading job portal for UAE opportunities.</p>',
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: '<h1>Privacy Policy</h1><p>Your privacy is important to us.</p>',
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions',
      content: '<h1>Terms & Conditions</h1><p>Please read our terms carefully.</p>',
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      content: '<h1>Contact Us</h1><p>Email: support@uaejobs.local</p>',
    },
  ];

  for (const page of pages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log('✅ Content pages seeded');

  console.log('\n🎉 Seed complete!');
  console.log('─'.repeat(40));
  console.log(`Admin:   ${adminEmail} / ${adminPassword}`);
  console.log('Seeker:  seeker@example.com / Seeker#12345');
  console.log('Employer: employer1@techcorp.ae / Employer#123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
