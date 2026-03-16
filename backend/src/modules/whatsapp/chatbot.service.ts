import prisma from '../../lib/prisma';
import { sendWhatsApp, updateSessionState } from './whatsapp.service';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SITE_URL = process.env.FRONTEND_URL || 'https://jobs.ddotsmedia.com';

const EMOJI = {
  wave: '👋',
  search: '🔍',
  job: '💼',
  map: '📍',
  money: '💰',
  star: '⭐',
  rocket: '🚀',
  check: '✅',
  cross: '❌',
  bell: '🔔',
  building: '🏢',
  chart: '📊',
  help: '❓',
  link: '🔗',
  phone: '📱',
  ai: '🤖',
};

const EMIRATES_MAP: Record<string, string> = {
  '1': 'DUBAI',
  '2': 'ABU_DHABI',
  '3': 'SHARJAH',
  '4': 'AJMAN',
  '5': 'RAS_AL_KHAIMAH',
  '6': 'FUJAIRAH',
  '7': 'UMM_AL_QUWAIN',
  dubai: 'DUBAI',
  'abu dhabi': 'ABU_DHABI',
  abudhabi: 'ABU_DHABI',
  sharjah: 'SHARJAH',
  ajman: 'AJMAN',
  'ras al khaimah': 'RAS_AL_KHAIMAH',
  rak: 'RAS_AL_KHAIMAH',
  fujairah: 'FUJAIRAH',
  uaq: 'UMM_AL_QUWAIN',
};

const EMIRATE_LABELS: Record<string, string> = {
  DUBAI: 'Dubai',
  ABU_DHABI: 'Abu Dhabi',
  SHARJAH: 'Sharjah',
  AJMAN: 'Ajman',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
};

// ── Greeting / Main menu ────────────────────────────────────────────────────────
function welcomeMessage(name?: string | null): string {
  const greeting = name ? `Hello ${name}!` : 'Hello!';
  return `${EMOJI.wave} *${greeting} Welcome to DdotsmediaJobs UAE*

I'm your personal job search assistant. How can I help you today?

*1* ${EMOJI.search} Search Jobs
*2* ${EMOJI.map} Browse by Emirate
*3* ${EMOJI.money} Salary Insights
*4* ${EMOJI.building} Top Companies
*5* ${EMOJI.ai} Career Advice (AI)
*6* ${EMOJI.help} Help

Reply with a number or type your query directly.`;
}

function helpMessage(): string {
  return `${EMOJI.help} *Available Commands*

${EMOJI.search} *Search:* "jobs [keyword]" or "find [role]"
${EMOJI.map} *By location:* "jobs in Dubai" or "Dubai jobs"
${EMOJI.money} *Salary:* "salary [role]" e.g. "salary software engineer"
${EMOJI.building} *Companies:* "companies" or "top employers"
${EMOJI.ai} *AI advice:* "career advice" or "cv tips"
${EMOJI.bell} *Alerts:* "alert [keyword]" e.g. "alert React developer"
${EMOJI.link} *Website:* ${SITE_URL}

Type *menu* anytime to see the main menu.
Type *stop* to unsubscribe.`;
}

// ── Format job listing ─────────────────────────────────────────────────────────
function formatJobList(jobs: {
  title: string; slug: string; employer: { companyName: string };
  emirate: string; employmentType: string; salaryMin: number | null; salaryMax: number | null;
}[], total: number, keyword?: string): string {
  if (jobs.length === 0) {
    return `${EMOJI.cross} No jobs found${keyword ? ` for *${keyword}*` : ''}.\n\nTry a different keyword or type *menu* to explore.`;
  }

  const lines = jobs.slice(0, 5).map((j, i) => {
    const salary = j.salaryMin && j.salaryMax
      ? `AED ${(j.salaryMin / 1000).toFixed(0)}k–${(j.salaryMax / 1000).toFixed(0)}k`
      : 'Salary TBD';
    const emirate = EMIRATE_LABELS[j.emirate] || j.emirate;
    return `*${i + 1}. ${j.title}*\n   ${EMOJI.building} ${j.employer.companyName}\n   ${EMOJI.map} ${emirate} · ${salary}\n   ${EMOJI.link} ${SITE_URL}/jobs/${j.slug}`;
  });

  const showing = Math.min(5, jobs.length);
  const header = keyword
    ? `${EMOJI.search} *${total} jobs found for "${keyword}"*\n`
    : `${EMOJI.search} *${total} jobs found*\n`;

  return header + '\n' + lines.join('\n\n') + (total > 5 ? `\n\n_Showing ${showing} of ${total}. Visit ${SITE_URL}/jobs for all results._` : '');
}

// ── Format single job detail ────────────────────────────────────────────────────
function formatJobDetail(job: {
  title: string; slug: string; description: string;
  employer: { companyName: string; website?: string | null };
  emirate: string; workMode: string; employmentType: string;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string;
  skills: string[]; experienceMin: number; experienceMax: number | null;
  visaStatus: string;
}): string {
  const salary = job.salaryMin && job.salaryMax
    ? `AED ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()} /month`
    : 'Not specified';
  const emirate = EMIRATE_LABELS[job.emirate] || job.emirate;
  const desc = job.description.replace(/<[^>]+>/g, ' ').slice(0, 200).trim();

  return `${EMOJI.job} *${job.title}*
${EMOJI.building} ${job.employer.companyName}
${EMOJI.map} ${emirate} · ${job.workMode}
${EMOJI.money} ${salary}
${EMOJI.chart} ${job.employmentType} · ${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : '+'} yrs exp

${desc}...

${job.skills.length ? `${EMOJI.check} *Skills:* ${job.skills.slice(0, 5).join(', ')}` : ''}

${EMOJI.rocket} *Apply:* ${SITE_URL}/jobs/${job.slug}`;
}

// ── Search jobs in DB ──────────────────────────────────────────────────────────
async function searchJobs(keyword: string, emirate?: string) {
  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    employer: { verificationStatus: 'APPROVED' },
    ...(emirate ? { emirate } : {}),
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: 5,
      include: { employer: { select: { companyName: true } } },
    }),
    prisma.job.count({ where }),
  ]);
  return { jobs, total };
}

// ── Salary insights ─────────────────────────────────────────────────────────────
async function getSalaryInsights(keyword: string): Promise<string> {
  const jobs = await prisma.job.findMany({
    where: {
      status: 'PUBLISHED',
      salaryMin: { gt: 0 },
      OR: [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ],
    },
    select: { title: true, emirate: true, salaryMin: true, salaryMax: true },
    take: 50,
  });

  if (jobs.length === 0) {
    return `${EMOJI.money} No salary data found for *${keyword}*.\n\nCheck ${SITE_URL}/salary-insights for full insights.`;
  }

  const salaries = jobs
    .filter((j) => j.salaryMin && j.salaryMax)
    .map((j) => ({ min: j.salaryMin!, max: j.salaryMax!, emirate: j.emirate }));

  const avgMin = Math.round(salaries.reduce((s, j) => s + j.min, 0) / salaries.length);
  const avgMax = Math.round(salaries.reduce((s, j) => s + j.max, 0) / salaries.length);
  const highest = Math.max(...salaries.map((j) => j.max));
  const lowest = Math.min(...salaries.map((j) => j.min));

  // By emirate
  const byEmirate: Record<string, { min: number[]; max: number[] }> = {};
  salaries.forEach((s) => {
    if (!byEmirate[s.emirate]) byEmirate[s.emirate] = { min: [], max: [] };
    byEmirate[s.emirate].min.push(s.min);
    byEmirate[s.emirate].max.push(s.max);
  });

  const emirateLines = Object.entries(byEmirate)
    .slice(0, 3)
    .map(([e, d]) => {
      const avg = Math.round((d.min.reduce((a, b) => a + b) / d.min.length + d.max.reduce((a, b) => a + b) / d.max.length) / 2);
      return `  • ${EMIRATE_LABELS[e] || e}: ~AED ${avg.toLocaleString()}/mo`;
    })
    .join('\n');

  return `${EMOJI.money} *Salary Insights: ${keyword}*
Based on ${jobs.length} active listings:

${EMOJI.chart} Avg: AED ${avgMin.toLocaleString()}–${avgMax.toLocaleString()}/mo
${EMOJI.star} Highest: AED ${highest.toLocaleString()}/mo
📉 Lowest: AED ${lowest.toLocaleString()}/mo

*By Emirate:*
${emirateLines}

${EMOJI.link} Full insights: ${SITE_URL}/salary-insights`;
}

// ── Top companies ───────────────────────────────────────────────────────────────
async function getTopCompanies(): Promise<string> {
  const employers = await prisma.employer.findMany({
    where: { verificationStatus: 'APPROVED', isActive: true },
    include: { _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } } },
    orderBy: { jobs: { _count: 'desc' } },
    take: 8,
  });

  if (employers.length === 0) return `${EMOJI.building} No companies found.`;

  const lines = employers.map((e, i) =>
    `*${i + 1}. ${e.companyName}* (${e._count.jobs} open jobs)\n   ${EMOJI.link} ${SITE_URL}/companies/${e.slug}`,
  );

  return `${EMOJI.building} *Top Hiring Companies in UAE*\n\n${lines.join('\n\n')}\n\n${EMOJI.link} All companies: ${SITE_URL}/companies`;
}

// ── AI Career Advice ────────────────────────────────────────────────────────────
async function getCareerAdvice(query: string): Promise<string> {
  const prompt = `You are a career advisor for UAE job seekers. Give concise, practical advice for the following query. Keep your response under 300 characters for WhatsApp. No markdown formatting, plain text only.

Query: ${query}`;

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return `${EMOJI.ai} *Career Advisor*\n\n${text}\n\n${EMOJI.link} More tools: ${SITE_URL}/career-advisor`;
}

// ── Main message handler ───────────────────────────────────────────────────────
export async function handleMessage(params: {
  from: string;       // E.164 phone e.g. +971501234567
  body: string;
  waId: string;
  profileName?: string;
  session: { id: string; state: string; contextJson: unknown; optedOut: boolean; profileName?: string | null };
}) {
  const { from, session } = params;
  const body = params.body.trim();
  const lower = body.toLowerCase();

  // ── Opt-out ──────────────────────────────────────────────────────────────────
  if (['stop', 'unsubscribe', 'opt out', 'optout'].includes(lower)) {
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { optedOut: true, state: 'idle' },
    });
    await sendWhatsApp(from, `${EMOJI.check} You've been unsubscribed from DdotsmediaJobs WhatsApp.\n\nSend *START* anytime to re-subscribe.`, session.id);
    return;
  }

  // ── Opted-out check ──────────────────────────────────────────────────────────
  if (session.optedOut) {
    if (['start', 'hi', 'hello'].includes(lower)) {
      await prisma.whatsAppSession.update({ where: { id: session.id }, data: { optedOut: false } });
      await sendWhatsApp(from, welcomeMessage(session.profileName), session.id);
    }
    return;
  }

  // ── Reset / menu ─────────────────────────────────────────────────────────────
  if (['menu', 'start', 'hi', 'hello', 'hey', '0'].includes(lower)) {
    await updateSessionState(session.id, 'idle');
    await sendWhatsApp(from, welcomeMessage(session.profileName), session.id);
    return;
  }

  // ── Help ─────────────────────────────────────────────────────────────────────
  if (['help', '6', '?'].includes(lower)) {
    await sendWhatsApp(from, helpMessage(), session.id);
    return;
  }

  // ── Main menu shortcuts (numbers) ────────────────────────────────────────────
  if (lower === '1' || lower === 'search jobs' || lower === 'find jobs') {
    await updateSessionState(session.id, 'searching');
    await sendWhatsApp(from, `${EMOJI.search} *Search Jobs*\n\nEnter a job title, skill, or keyword:\ne.g. "Software Engineer", "React", "Sales Manager"`, session.id);
    return;
  }

  if (lower === '2' || lower === 'browse by emirate' || lower === 'by location') {
    await updateSessionState(session.id, 'emirate_select');
    await sendWhatsApp(
      from,
      `${EMOJI.map} *Select an Emirate:*\n\n*1* Dubai\n*2* Abu Dhabi\n*3* Sharjah\n*4* Ajman\n*5* Ras Al Khaimah\n*6* Fujairah\n*7* Umm Al Quwain\n\n*0* Main Menu`,
      session.id,
    );
    return;
  }

  if (lower === '3' || lower === 'salary insights' || lower === 'salary') {
    await updateSessionState(session.id, 'salary_query');
    await sendWhatsApp(from, `${EMOJI.money} *Salary Insights*\n\nEnter a job title or skill:\ne.g. "Software Engineer", "Marketing Manager", "Nurse"`, session.id);
    return;
  }

  if (lower === '4' || lower === 'top companies' || lower === 'companies') {
    const reply = await getTopCompanies();
    await sendWhatsApp(from, reply, session.id);
    return;
  }

  if (lower === '5' || lower === 'career advice' || lower === 'cv tips' || lower === 'ai') {
    await updateSessionState(session.id, 'career_advice');
    await sendWhatsApp(from, `${EMOJI.ai} *AI Career Advisor*\n\nAsk me anything about:\n• CV tips\n• Interview preparation\n• Career transition\n• UAE work culture\n• Salary negotiation\n\nType your question:`, session.id);
    return;
  }

  // ── State: searching (awaiting keyword) ──────────────────────────────────────
  if (session.state === 'searching') {
    await updateSessionState(session.id, 'idle');
    const { jobs, total } = await searchJobs(body);
    await sendWhatsApp(from, formatJobList(jobs as Parameters<typeof formatJobList>[0], total, body), session.id);
    return;
  }

  // ── State: emirate_select ─────────────────────────────────────────────────────
  if (session.state === 'emirate_select') {
    const emirate = EMIRATES_MAP[lower] || EMIRATES_MAP[body];
    if (emirate) {
      await updateSessionState(session.id, 'idle');
      const { jobs, total } = await searchJobs('', emirate);
      await sendWhatsApp(from, formatJobList(jobs as Parameters<typeof formatJobList>[0], total, `jobs in ${EMIRATE_LABELS[emirate]}`), session.id);
    } else {
      await sendWhatsApp(from, `${EMOJI.cross} Please choose a number 1–7 or type the emirate name.`, session.id);
    }
    return;
  }

  // ── State: salary_query ───────────────────────────────────────────────────────
  if (session.state === 'salary_query') {
    await updateSessionState(session.id, 'idle');
    const reply = await getSalaryInsights(body);
    await sendWhatsApp(from, reply, session.id);
    return;
  }

  // ── State: career_advice ──────────────────────────────────────────────────────
  if (session.state === 'career_advice') {
    await updateSessionState(session.id, 'idle');
    const reply = await getCareerAdvice(body);
    await sendWhatsApp(from, reply, session.id);
    return;
  }

  // ── Inline keyword patterns (no state needed) ─────────────────────────────────
  // "jobs in Dubai" / "Dubai jobs"
  const locationMatch = lower.match(/jobs?\s+in\s+(.+)|(.+)\s+jobs?/);
  if (locationMatch) {
    const loc = (locationMatch[1] || locationMatch[2] || '').trim();
    const emirate = EMIRATES_MAP[loc];
    if (emirate) {
      const { jobs, total } = await searchJobs('', emirate);
      await sendWhatsApp(from, formatJobList(jobs as Parameters<typeof formatJobList>[0], total, `jobs in ${EMIRATE_LABELS[emirate]}`), session.id);
      return;
    }
  }

  // "find X" / "search X" / "jobs X"
  const searchMatch = lower.match(/^(?:find|search|jobs?|looking for)\s+(.+)/);
  if (searchMatch) {
    const keyword = searchMatch[1].trim();
    const { jobs, total } = await searchJobs(keyword);
    await sendWhatsApp(from, formatJobList(jobs as Parameters<typeof formatJobList>[0], total, keyword), session.id);
    return;
  }

  // "salary X"
  const salaryMatch = lower.match(/^salary(?:\s+for)?\s+(.+)/);
  if (salaryMatch) {
    const reply = await getSalaryInsights(salaryMatch[1].trim());
    await sendWhatsApp(from, reply, session.id);
    return;
  }

  // "company X"
  const companyMatch = lower.match(/^company\s+(.+)|^about\s+(.+)/);
  if (companyMatch) {
    const name = (companyMatch[1] || companyMatch[2]).trim();
    const employer = await prisma.employer.findFirst({
      where: { companyName: { contains: name }, verificationStatus: 'APPROVED' },
      include: { _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } } },
    });
    if (employer) {
      const reply = `${EMOJI.building} *${employer.companyName}*\n${employer.industry ? `Industry: ${employer.industry}\n` : ''}${employer.emirate ? `${EMOJI.map} ${EMIRATE_LABELS[employer.emirate] || employer.emirate}\n` : ''}${EMOJI.job} ${employer._count.jobs} open jobs\n\n${employer.description ? employer.description.slice(0, 200) + '...\n\n' : ''}${EMOJI.link} ${SITE_URL}/companies/${employer.slug}`;
      await sendWhatsApp(from, reply, session.id);
    } else {
      await sendWhatsApp(from, `${EMOJI.cross} No company found matching "${name}".\n\n${EMOJI.link} Browse all: ${SITE_URL}/companies`, session.id);
    }
    return;
  }

  // "alert X"
  const alertMatch = lower.match(/^alert\s+(.+)/);
  if (alertMatch) {
    await sendWhatsApp(
      from,
      `${EMOJI.bell} *Job Alert Setup*\n\nTo set up job alerts for "${alertMatch[1]}", please:\n\n1. Create a free account at ${SITE_URL}/register\n2. Go to Job Alerts in your profile\n3. Set keywords, location and frequency\n\nYou'll receive email notifications for new matching jobs!`,
      session.id,
    );
    return;
  }

  // Default: try to search as-is
  if (body.length > 2) {
    const { jobs, total } = await searchJobs(body);
    if (total > 0) {
      await sendWhatsApp(from, formatJobList(jobs as Parameters<typeof formatJobList>[0], total, body), session.id);
      return;
    }
  }

  // Fallback
  await sendWhatsApp(
    from,
    `${EMOJI.cross} I didn't understand that.\n\nType *menu* to see options or *help* for commands.\n\n${EMOJI.link} Visit: ${SITE_URL}`,
    session.id,
  );
}
