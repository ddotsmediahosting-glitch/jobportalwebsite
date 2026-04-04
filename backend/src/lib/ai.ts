import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey || 'placeholder',
});

function assertApiKey() {
  const key = config.ai.anthropicApiKey;
  if (!key || key.length < 20 || key.startsWith('sk-ant-your') || key.includes('your-key')) {
    throw new AppError(503, 'AI features are not available. Please configure ANTHROPIC_API_KEY in your environment settings.');
  }
}

export async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  assertApiKey();
  const message = await anthropic.messages.create({
    model: config.ai.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function callClaudeJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const fullSystem = (systemPrompt || '') +
    '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, no explanation — raw JSON only.';
  const raw = await callClaude(prompt, fullSystem);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

// ─── ATS Analysis ──────────────────────────────────────────────────────────────

export interface ATSAnalysisResult {
  atsScore: number;           // 0-100
  keywordMatchScore: number;  // 0-100
  formatScore: number;        // 0-100
  contentScore: number;       // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{ category: string; priority: 'high' | 'medium' | 'low'; suggestion: string }>;
  summary: string;
}

export async function analyzeCV(cvText: string, jobDescription: string, jobTitle?: string): Promise<ATSAnalysisResult> {
  const system = `You are an expert ATS (Applicant Tracking System) analyst with 15+ years of experience in HR and recruitment.
You specialize in the UAE job market. Analyze CVs with precision, providing actionable, specific feedback.`;

  const prompt = `Analyze this CV against the job description and return a detailed ATS analysis.

JOB TITLE: ${jobTitle || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

CV TEXT:
${cvText}

Return a JSON object with exactly this structure:
{
  "atsScore": <overall score 0-100>,
  "keywordMatchScore": <keyword match percentage 0-100>,
  "formatScore": <format/structure score 0-100>,
  "contentScore": <content quality score 0-100>,
  "matchedKeywords": [<array of keywords found in both CV and job description>],
  "missingKeywords": [<array of important keywords in job description but missing from CV>],
  "strengths": [<array of 3-5 specific strengths of this CV for this role>],
  "weaknesses": [<array of 3-5 specific weaknesses or gaps>],
  "suggestions": [
    { "category": "<e.g. Keywords|Format|Experience|Skills|Summary>", "priority": "<high|medium|low>", "suggestion": "<specific actionable suggestion>" }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

Scoring guidelines:
- atsScore: weighted average (keywords 40%, content 35%, format 25%)
- keywordMatchScore: % of critical job keywords present in CV
- formatScore: based on structure, sections, bullet points, length (1-2 pages ideal)
- contentScore: based on quantified achievements, action verbs, relevance`;

  return callClaudeJSON<ATSAnalysisResult>(prompt, system);
}

// ─── CV Content Generation ─────────────────────────────────────────────────────

export interface CVGenerationInput {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
  };
  targetRole: string;
  yearsOfExperience: number;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    endDate?: string;
  }>;
  jobDescription?: string;
}

export interface CVGenerationResult {
  professionalSummary: string;
  enhancedExperience: Array<{
    company: string;
    title: string;
    bulletPoints: string[];
  }>;
  suggestedSkills: string[];
  atsKeywords: string[];
}

export async function generateCVContent(input: CVGenerationInput): Promise<CVGenerationResult> {
  const system = `You are an expert CV writer specializing in ATS-optimized resumes for the UAE job market.
You create compelling, achievement-focused content using strong action verbs and quantified results.`;

  const expText = input.experience.map(e =>
    `${e.title} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate || 'N/A'}): ${e.description || 'No description provided'}`
  ).join('\n');

  const prompt = `Create ATS-optimized CV content for this professional.

TARGET ROLE: ${input.targetRole}
YEARS OF EXPERIENCE: ${input.yearsOfExperience}
CURRENT SKILLS: ${(Array.isArray(input.skills) ? input.skills as string[] : []).join(', ')}
${input.jobDescription ? `\nTARGET JOB DESCRIPTION:\n${input.jobDescription}` : ''}

WORK EXPERIENCE:
${expText}

EDUCATION:
${input.education.map(e => `${e.degree} in ${e.field || 'N/A'} from ${e.institution}`).join('\n')}

Return JSON with exactly this structure:
{
  "professionalSummary": "<3-4 sentence compelling professional summary tailored to the target role, ATS-optimized>",
  "enhancedExperience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "bulletPoints": ["<4-5 achievement-focused bullet points with action verbs and metrics where possible>"]
    }
  ],
  "suggestedSkills": ["<10-15 relevant technical and soft skills for this role>"],
  "atsKeywords": ["<15-20 high-value ATS keywords for this role in the UAE market>"]
}`;

  return callClaudeJSON<CVGenerationResult>(prompt, system);
}

// ─── Cover Letter Generation ───────────────────────────────────────────────────

export async function generateCoverLetter(
  cvText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  candidateName: string
): Promise<string> {
  const system = `You are an expert cover letter writer specializing in the UAE job market.
You write compelling, personalized cover letters that pass ATS screening and engage hiring managers.`;

  const prompt = `Write a professional, ATS-optimized cover letter.

CANDIDATE NAME: ${candidateName}
APPLYING FOR: ${jobTitle} at ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CV:
${cvText}

Write a 3-4 paragraph cover letter that:
1. Opens with a compelling hook and mentions the specific role
2. Highlights 2-3 most relevant achievements from the CV that match the job requirements
3. Shows knowledge of the company/role and genuine enthusiasm
4. Closes with a clear call to action

Use a professional but engaging tone. Keep it under 400 words. Include proper greeting and closing.`;

  return callClaude(prompt, system);
}

// ─── Skills Gap Analysis ───────────────────────────────────────────────────────

export interface SkillsGapResult {
  matchingSkills: string[];
  missingCriticalSkills: string[];
  missingNiceToHaveSkills: string[];
  learningRecommendations: Array<{ skill: string; reason: string; resourceType: string }>;
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  fitPercentage: number;
}

export async function analyzeSkillsGap(
  candidateSkills: string[],
  cvText: string,
  jobDescription: string
): Promise<SkillsGapResult> {
  const system = `You are a senior talent acquisition specialist with deep knowledge of the UAE tech and business landscape.`;

  const prompt = `Perform a detailed skills gap analysis.

CANDIDATE SKILLS: ${(Array.isArray(candidateSkills) ? candidateSkills as string[] : []).join(', ')}

CV SUMMARY:
${cvText.substring(0, 2000)}

JOB DESCRIPTION:
${jobDescription}

Return JSON:
{
  "matchingSkills": ["<skills candidate has that match the job>"],
  "missingCriticalSkills": ["<must-have skills the candidate lacks>"],
  "missingNiceToHaveSkills": ["<beneficial skills the candidate lacks>"],
  "learningRecommendations": [
    { "skill": "<skill name>", "reason": "<why it matters for this role>", "resourceType": "<e.g. Online Course|Certification|Practice|Book>" }
  ],
  "overallFit": "<excellent|good|fair|poor>",
  "fitPercentage": <0-100>
}`;

  return callClaudeJSON<SkillsGapResult>(prompt, system);
}

// ─── CV Optimization ───────────────────────────────────────────────────────────

export interface OptimizationResult {
  optimizedSummary: string;
  optimizedBulletPoints: string[];
  addedKeywords: string[];
  removedContent: string[];
  improvementScore: number;
}

export async function optimizeCVSection(
  section: string,
  content: string,
  jobDescription: string
): Promise<OptimizationResult> {
  const system = `You are an expert ATS optimization specialist. You rewrite CV content to maximize ATS scores while keeping it authentic and human-readable.`;

  const prompt = `Optimize this CV ${section} section for maximum ATS compatibility with the given job.

ORIGINAL CONTENT:
${content}

TARGET JOB DESCRIPTION:
${jobDescription}

Return JSON:
{
  "optimizedSummary": "<optimized version of the summary/intro if applicable>",
  "optimizedBulletPoints": ["<rewritten bullet points with stronger action verbs, metrics, and ATS keywords>"],
  "addedKeywords": ["<keywords added to improve ATS match>"],
  "removedContent": ["<vague phrases or weak words removed>"],
  "improvementScore": <estimated ATS score improvement 0-30>
}`;

  return callClaudeJSON<OptimizationResult>(prompt, system);
}

// ─── Job Description Writer ────────────────────────────────────────────────────

export interface JobDescriptionResult {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  skills: string[];
  seoKeywords: string[];
  suggestedSalaryMin: number;
  suggestedSalaryMax: number;
  suggestedExperienceMin: number;
  suggestedExperienceMax: number;
  suggestedEmploymentType: string;
  suggestedWorkMode: string;
  suggestedLevel: string;
}

export async function generateJobDescription(
  role: string,
  industry: string,
  keyRequirements: string,
  companyName: string,
  emirate: string,
  workMode: string,
  experienceYears: string
): Promise<JobDescriptionResult> {
  const system = `You are a senior HR consultant and job description specialist for the UAE job market.
You write compelling, inclusive, ATS-optimized job descriptions that attract top talent.`;

  const prompt = `Write a complete, professional job description and suggest realistic job parameters for the UAE market.

ROLE: ${role}
COMPANY: ${companyName}
INDUSTRY: ${industry}
LOCATION: ${emirate}, UAE
WORK MODE: ${workMode}
EXPERIENCE REQUIRED: ${experienceYears}
KEY REQUIREMENTS: ${keyRequirements}

Return JSON:
{
  "title": "<optimized job title>",
  "summary": "<2-3 sentence engaging role overview>",
  "responsibilities": ["<8-10 specific action-verb-led responsibilities>"],
  "requirements": ["<5-7 must-have qualifications>"],
  "niceToHave": ["<3-5 preferred qualifications>"],
  "benefits": ["<5-7 UAE-relevant benefits e.g. visa, health insurance, housing allowance>"],
  "skills": ["<10-15 key skills for ATS>"],
  "seoKeywords": ["<10 high-value UAE job search keywords>"],
  "suggestedSalaryMin": <realistic minimum monthly salary in AED as integer>,
  "suggestedSalaryMax": <realistic maximum monthly salary in AED as integer>,
  "suggestedExperienceMin": <minimum years of experience as integer>,
  "suggestedExperienceMax": <maximum years of experience as integer>,
  "suggestedEmploymentType": "<one of: FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERNSHIP, FREELANCE>",
  "suggestedWorkMode": "<one of: ONSITE, HYBRID, REMOTE>",
  "suggestedLevel": "<one of: Junior, Mid-level, Senior, Lead, Manager, Director, Executive>"
}`;

  return callClaudeJSON<JobDescriptionResult>(prompt, system);
}

// ─── Application Screener ──────────────────────────────────────────────────────

export interface ScreenedCandidate {
  applicationId: string;
  candidateName: string;
  fitScore: number;
  fitLabel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  matchingStrengths: string[];
  gaps: string[];
  recommendation: string;
  priority: 'shortlist' | 'review' | 'reject';
}

export async function screenApplications(
  jobTitle: string,
  jobDescription: string,
  candidates: Array<{ applicationId: string; candidateName: string; coverLetter?: string; skills: string[]; headline?: string; yearsOfExperience?: number }>
): Promise<ScreenedCandidate[]> {
  const system = `You are an expert talent acquisition specialist for the UAE job market. Screen candidates objectively.`;

  const candidateList = candidates.map((c, i) =>
    `[${i + 1}] ID: ${c.applicationId}\nName: ${c.candidateName}\nExp: ${c.yearsOfExperience ?? '?'} yrs\nHeadline: ${c.headline || '-'}\nSkills: ${(Array.isArray(c.skills) ? c.skills as string[] : []).join(', ') || '-'}\nCover Letter: ${c.coverLetter ? c.coverLetter.substring(0, 200) : 'None'}`
  ).join('\n\n');

  const prompt = `Screen these ${candidates.length} candidates for: ${jobTitle}

JOB DESCRIPTION:
${jobDescription.substring(0, 1200)}

CANDIDATES:
${candidateList}

Return JSON array — one entry per candidate:
[
  {
    "applicationId": "<id>",
    "candidateName": "<name>",
    "fitScore": <0-100>,
    "fitLabel": "<Excellent|Good|Fair|Poor>",
    "matchingStrengths": ["<2-3 strengths>"],
    "gaps": ["<1-3 gaps>"],
    "recommendation": "<1-2 sentence recommendation>",
    "priority": "<shortlist|review|reject>"
  }
]
Shortlist=70+, Review=40-69, Reject<40.`;

  return callClaudeJSON<ScreenedCandidate[]>(prompt, system);
}

// ─── Job Match Score ───────────────────────────────────────────────────────────

export interface JobMatchResult {
  overallScore: number;
  label: 'Excellent Match' | 'Good Match' | 'Partial Match' | 'Low Match';
  skillsMatch: number;
  experienceMatch: number;
  matchingPoints: string[];
  gaps: string[];
  advice: string;
}

export async function scoreJobMatch(
  seekerProfile: { skills: string[]; yearsOfExperience?: number; headline?: string; bio?: string },
  jobDescription: string,
  jobTitle: string
): Promise<JobMatchResult> {
  const system = `You are a career coach helping job seekers understand how well they match a role. Be honest and encouraging.`;

  const prompt = `How well does this candidate match the job?

JOB: ${jobTitle}
DESCRIPTION: ${jobDescription.substring(0, 1200)}

CANDIDATE:
Headline: ${seekerProfile.headline || '-'}
Experience: ${seekerProfile.yearsOfExperience ?? '?'} years
Skills: ${(Array.isArray(seekerProfile.skills) ? seekerProfile.skills as string[] : []).join(', ') || '-'}
Bio: ${seekerProfile.bio ? seekerProfile.bio.substring(0, 200) : '-'}

Return JSON:
{
  "overallScore": <0-100>,
  "label": "<Excellent Match|Good Match|Partial Match|Low Match>",
  "skillsMatch": <0-100>,
  "experienceMatch": <0-100>,
  "matchingPoints": ["<3-4 specific fit reasons>"],
  "gaps": ["<2-3 specific gaps>"],
  "advice": "<1-2 sentences of actionable advice>"
}
Excellent=80+, Good=60-79, Partial=40-59, Low<40.`;

  return callClaudeJSON<JobMatchResult>(prompt, system);
}

// ─── Career Advisor Chat ───────────────────────────────────────────────────────

export async function chatWithCareerAdvisor(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userContext?: { skills?: string[]; yearsOfExperience?: number; headline?: string }
): Promise<string> {
  assertApiKey();
  const contextStr = (Array.isArray(userContext?.skills) ? userContext!.skills.length : 0) > 0
    ? `\nUser: ${userContext!.headline || 'job seeker'}, ${userContext!.yearsOfExperience ?? '?'} yrs exp, skills: ${(userContext!.skills as string[]).slice(0, 8).join(', ')}`
    : '';

  const system = `You are an expert career advisor specializing in the UAE and MENA job market.
Help with career advice, job search, CV tips, interview prep, salary negotiation, and professional development.
Be warm, practical, and specific. Give actionable advice under 280 words unless asked for more.${contextStr}`;

  const response = await anthropic.messages.create({
    model: config.ai.model,
    max_tokens: 1024,
    system,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}

// ─── Salary Insights ──────────────────────────────────────────────────────────

export interface SalaryInsightsResult {
  role: string;
  emirate: string;
  industry: string;
  salaryMin: number;
  salaryMax: number;
  salaryMedian: number;
  currency: string;
  topPayingCompanies: string[];
  topPayingIndustries: string[];
  topPayingEmirates: string[];
  inDemandSkills: string[];
  salaryFactors: Array<{ factor: string; impact: 'positive' | 'negative'; description: string }>;
  marketOutlook: string;
  negotiationTips: string[];
}

export async function getSalaryInsights(
  role: string,
  industry: string,
  emirate: string,
  yearsOfExperience: number
): Promise<SalaryInsightsResult> {
  const system = `You are a UAE compensation and benefits specialist with deep knowledge of salary benchmarks across all sectors and emirates. Provide accurate, up-to-date salary data for the UAE job market as of 2024-2025.`;

  const prompt = `Provide comprehensive salary insights for the following role in the UAE.

ROLE: ${role}
INDUSTRY: ${industry}
EMIRATE: ${emirate}
YEARS OF EXPERIENCE: ${yearsOfExperience}

Return detailed salary benchmark data as JSON:
{
  "role": "${role}",
  "emirate": "${emirate}",
  "industry": "${industry}",
  "salaryMin": <minimum monthly salary in AED>,
  "salaryMax": <maximum monthly salary in AED>,
  "salaryMedian": <median/typical monthly salary in AED>,
  "currency": "AED",
  "topPayingCompanies": ["<5 types of companies or specific well-known employers that pay top salaries for this role>"],
  "topPayingIndustries": ["<3-4 industries with highest pay for this role>"],
  "topPayingEmirates": ["<top 3 emirates ordered by pay for this role>"],
  "inDemandSkills": ["<8-10 skills that command higher salaries for this role>"],
  "salaryFactors": [
    { "factor": "<factor name>", "impact": "<positive|negative>", "description": "<how this affects salary>" }
  ],
  "marketOutlook": "<2-3 sentences on job market demand and salary trends for this role in UAE>",
  "negotiationTips": ["<4-5 specific salary negotiation tips for UAE job market>"]
}`;

  return callClaudeJSON<SalaryInsightsResult>(prompt, system);
}

// ─── Standalone Interview Prep ─────────────────────────────────────────────────

export interface InterviewPrepResult {
  questions: Array<{
    question: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tip: string;
    sampleAnswer: string;
  }>;
  interviewTips: string[];
  commonMistakes: string[];
  questionsToAsk: string[];
}

export async function generateInterviewPrep(
  role: string,
  industry: string,
  yearsOfExperience: number,
  specificFocus?: string
): Promise<InterviewPrepResult> {
  const system = `You are an expert interview coach specializing in the UAE and MENA job market. You help candidates prepare thoroughly for job interviews.`;

  const prompt = `Generate a comprehensive interview preparation guide.

ROLE: ${role}
INDUSTRY: ${industry}
EXPERIENCE LEVEL: ${yearsOfExperience} years
${specificFocus ? `FOCUS AREA: ${specificFocus}` : ''}

Return JSON with this structure:
{
  "questions": [
    {
      "question": "<interview question>",
      "category": "<Technical|Behavioral|Situational|Role-specific|Culture fit|UAE-specific>",
      "difficulty": "<easy|medium|hard>",
      "tip": "<brief tip on how to answer well>",
      "sampleAnswer": "<1-2 sentence sample answer framework or STAR method guide>"
    }
  ],
  "interviewTips": ["<6-8 specific tips for interviewing at UAE companies>"],
  "commonMistakes": ["<4-5 common mistakes candidates make for this role>"],
  "questionsToAsk": ["<5 smart questions the candidate should ask the interviewer>"]
}
Generate 12 questions covering a mix of technical, behavioral, and role-specific questions.`;

  return callClaudeJSON<InterviewPrepResult>(prompt, system);
}

// ─── Interview Question Generation ────────────────────────────────────────────

export interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tip: string;
}

export async function generateInterviewQuestions(
  cvText: string,
  jobDescription: string,
  jobTitle: string
): Promise<InterviewQuestion[]> {
  const system = `You are an experienced interviewer specializing in UAE companies and the MENA talent market.`;

  const prompt = `Generate targeted interview questions based on the CV and job description.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription.substring(0, 1500)}

CV HIGHLIGHTS:
${cvText.substring(0, 1500)}

Generate 10 interview questions covering: technical skills, behavioral (STAR method), situational, and role-specific topics.

Return JSON array:
[
  {
    "question": "<interview question>",
    "category": "<Technical|Behavioral|Situational|Role-specific|Culture fit>",
    "difficulty": "<easy|medium|hard>",
    "tip": "<brief tip on how to answer this question well>"
  }
]`;

  return callClaudeJSON<InterviewQuestion[]>(prompt, system);
}

// ─── Job Fraud Detection ───────────────────────────────────────────────────────

export interface FraudDetectionResult {
  riskScore: number;          // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];            // specific issues found
  explanation: string;        // summary of findings
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  isLikelyFraud: boolean;
}

export async function detectJobFraud(
  jobTitle: string,
  description: string,
  companyName: string,
  salaryMin: number | null,
  salaryMax: number | null,
  contactEmail?: string | null,
): Promise<FraudDetectionResult> {
  const system = `You are a fraud detection specialist for an online job portal in the UAE.
Analyze job postings for red flags including: unrealistic salaries, money laundering, MLM schemes,
advance fee fraud, personal data harvesting, unrealistic promises, vague descriptions,
suspicious contact methods, and other deceptive practices.`;

  const prompt = `Analyze this job posting for fraud indicators:

TITLE: ${jobTitle}
COMPANY: ${companyName}
SALARY: ${salaryMin ? `AED ${salaryMin}` : 'Not specified'} - ${salaryMax ? `AED ${salaryMax}` : 'Not specified'} per month
CONTACT EMAIL: ${contactEmail || 'Not provided'}

JOB DESCRIPTION:
${description.substring(0, 2000)}

UAE Context: Be aware of common UAE job scams like visa fraud, advance fee requests,
unrealistic commission-only "jobs", data harvesting, and fake luxury employer brands.

Return JSON:
{
  "riskScore": <0-100, where 0=no risk, 100=certain fraud>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "flags": ["<specific red flags found, empty array if none>"],
  "explanation": "<2-3 sentence explanation of findings>",
  "recommendation": "<APPROVE|REVIEW|REJECT>",
  "isLikelyFraud": <true if riskScore > 65>
}

Risk thresholds: LOW=0-25, MEDIUM=26-50, HIGH=51-75, CRITICAL=76-100`;

  return callClaudeJSON<FraudDetectionResult>(prompt, system);
}

// ─── Personalized Job Recommendations ─────────────────────────────────────────

export interface JobRecommendation {
  jobId: string;
  matchScore: number;
  matchLabel: 'Excellent Match' | 'Good Match' | 'Fair Match';
  topReasons: string[];
}

export async function rankJobsForCandidate(
  candidateProfile: {
    skills: string[];
    yearsOfExperience?: number;
    headline?: string;
    bio?: string;
    preferredEmirate?: string;
    preferredWorkMode?: string;
  },
  jobs: Array<{ id: string; title: string; description: string; skills: string[] }>
): Promise<JobRecommendation[]> {
  const system = `You are a smart job matching AI. Rank jobs by how well they fit a candidate's profile. Be precise with scores.`;

  const jobsList = jobs.map((j, i) =>
    `[${i + 1}] ID: ${j.id}\nTitle: ${j.title}\nRequired skills: ${(Array.isArray(j.skills) ? j.skills as string[] : []).join(', ') || 'Not listed'}\nDescription preview: ${j.description.substring(0, 200)}`
  ).join('\n\n');

  const prompt = `Rank these jobs for this candidate and return match scores.

CANDIDATE:
Headline: ${candidateProfile.headline || 'Not specified'}
Experience: ${candidateProfile.yearsOfExperience ?? '?'} years
Skills: ${(Array.isArray(candidateProfile.skills) ? candidateProfile.skills as string[] : []).join(', ') || 'Not listed'}
Bio: ${candidateProfile.bio ? candidateProfile.bio.substring(0, 200) : 'Not provided'}
Preferred Location: ${candidateProfile.preferredEmirate || 'Any'}
Preferred Work Mode: ${candidateProfile.preferredWorkMode || 'Any'}

JOBS TO RANK:
${jobsList}

Return JSON array sorted by matchScore descending:
[
  {
    "jobId": "<job id>",
    "matchScore": <50-100>,
    "matchLabel": "<Excellent Match|Good Match|Fair Match>",
    "topReasons": ["<2-3 specific reasons why this is a good match>"]
  }
]
Excellent=80+, Good=65-79, Fair=50-64. Only include jobs scoring 50+.`;

  return callClaudeJSON<JobRecommendation[]>(prompt, system);
}

// ─── Trending Skills Analysis ──────────────────────────────────────────────────

export interface TrendingSkill {
  skill: string;
  demandCount: number;
  trend: 'rising' | 'stable' | 'declining';
  averageSalaryPremium: string;
  topIndustries: string[];
  relatedSkills: string[];
  learningDifficulty: 'beginner' | 'intermediate' | 'advanced';
  whyTrending: string;
}

export async function analyzeTrendingSkills(
  skillFrequency: Record<string, number>,
  topJobTitles: string[]
): Promise<TrendingSkill[]> {
  const system = `You are a UAE tech and job market analyst. Analyze skill demand trends in the UAE job market for 2025.`;

  const topSkills = Object.entries(skillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([skill, count]) => `${skill}: ${count} jobs`)
    .join(', ');

  const prompt = `Analyze these skills from current UAE job postings and provide trend insights.

SKILL FREQUENCY (skill: job count):
${topSkills}

TOP JOB TITLES REQUIRING THESE SKILLS:
${topJobTitles.slice(0, 15).join(', ')}

For the top 15 most demanded skills, return trend analysis:

[
  {
    "skill": "<skill name>",
    "demandCount": <number from input>,
    "trend": "<rising|stable|declining>",
    "averageSalaryPremium": "<e.g. +15-25% premium>",
    "topIndustries": ["<3 industries with highest demand>"],
    "relatedSkills": ["<3 complementary skills>"],
    "learningDifficulty": "<beginner|intermediate|advanced>",
    "whyTrending": "<1 sentence explanation>"
  }
]

Sort by demandCount descending. Only return the top 15.`;

  return callClaudeJSON<TrendingSkill[]>(prompt, system);
}

// ─── Profile AI Coach ─────────────────────────────────────────────────────────

export interface ProfileCoachResult {
  completionScore: number;       // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  improvements: Array<{
    section: string;
    priority: 'critical' | 'high' | 'medium';
    suggestion: string;
    impact: string;
  }>;
  missingCritical: string[];
  nextSteps: string[];
  profileSummary: string;
}

export async function coachProfile(profile: {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  yearsOfExperience?: number;
  preferredWorkMode?: string;
  hasAvatar: boolean;
  resumeCount: number;
  educationCount: number;
  experienceCount: number;
  certificationCount: number;
}): Promise<ProfileCoachResult> {
  const system = `You are a professional career coach specializing in the UAE job market.
Help job seekers optimize their profiles to get hired faster. Be specific and actionable.`;

  const profileSummary = `
Name: ${profile.firstName || 'Missing'} ${profile.lastName || 'Missing'}
Headline: ${profile.headline || 'MISSING - Critical gap'}
Bio/Summary: ${profile.bio ? `${profile.bio.length} chars` : 'MISSING - Critical gap'}
Skills: ${(Array.isArray(profile.skills) ? profile.skills as string[] : []).length > 0 ? (Array.isArray(profile.skills) ? profile.skills as string[] : []).join(', ') : 'MISSING - Critical gap'}
Experience: ${profile.yearsOfExperience ?? 'Not specified'} years
Work Mode Preference: ${profile.preferredWorkMode || 'Not set'}
Profile Photo: ${profile.hasAvatar ? 'Added ✓' : 'Missing ✗'}
Uploaded Resumes: ${profile.resumeCount}
Education entries: ${profile.educationCount}
Work Experience entries: ${profile.experienceCount}
Certifications: ${profile.certificationCount}
`.trim();

  const prompt = `Analyze this UAE job seeker's profile and provide coaching:

${profileSummary}

Return JSON:
{
  "completionScore": <0-100 based on profile completeness>,
  "grade": "<A=90+|B=75-89|C=50-74|D<50>",
  "strengths": ["<2-3 things they've done well>"],
  "improvements": [
    {
      "section": "<Profile section name>",
      "priority": "<critical|high|medium>",
      "suggestion": "<specific actionable suggestion>",
      "impact": "<what improving this will achieve>"
    }
  ],
  "missingCritical": ["<list of critical missing elements>"],
  "nextSteps": ["<3-4 numbered action items ordered by priority>"],
  "profileSummary": "<2 sentence overall assessment>"
}

Score calculation: headline(20pts) + bio(15pts) + skills(20pts) + experience_entries(15pts) + education(10pts) + resume_upload(10pts) + photo(5pts) + certifications(5pts)`;

  return callClaudeJSON<ProfileCoachResult>(prompt, system);
}

// ─── Employer AI Hiring Insights ──────────────────────────────────────────────

export interface HiringInsightsResult {
  overallScore: number;
  insights: Array<{
    category: string;
    finding: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  topPerformingJobTypes: string[];
  candidateQualityTrends: string;
  hiringVelocityTip: string;
  salaryCompetitiveness: string;
  suggestedImprovements: string[];
}

export async function generateHiringInsights(employerData: {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  avgApplicationsPerJob: number;
  hireRate: number;
  topJobTitles: string[];
  avgSalaryOffered: number;
  avgTimeToFill: number;
  rejectionRate: number;
  companyName: string;
  emirate: string;
}): Promise<HiringInsightsResult> {
  const system = `You are an expert talent acquisition consultant for the UAE market.
Provide actionable hiring insights to help employers attract and hire better candidates faster.`;

  const prompt = `Analyze this employer's hiring metrics and provide strategic insights.

COMPANY: ${employerData.companyName} (${employerData.emirate})
Total Job Posts: ${employerData.totalJobs}
Active Jobs: ${employerData.activeJobs}
Total Applications Received: ${employerData.totalApplications}
Avg Applications per Job: ${employerData.avgApplicationsPerJob.toFixed(1)}
Hire Rate: ${(employerData.hireRate * 100).toFixed(1)}%
Top Job Titles: ${employerData.topJobTitles.slice(0, 5).join(', ')}
Average Salary Offered: AED ${employerData.avgSalaryOffered.toFixed(0)}/month
Average Days to Fill: ${employerData.avgTimeToFill} days
Rejection Rate: ${(employerData.rejectionRate * 100).toFixed(1)}%

Return JSON:
{
  "overallScore": <0-100 hiring effectiveness score>,
  "insights": [
    {
      "category": "<e.g. Application Volume|Candidate Quality|Salary|Speed|Job Descriptions>",
      "finding": "<what the data shows>",
      "recommendation": "<specific action to take>",
      "impact": "<high|medium|low>"
    }
  ],
  "topPerformingJobTypes": ["<3 job types that likely perform best based on titles>"],
  "candidateQualityTrends": "<1-2 sentences on candidate quality based on metrics>",
  "hiringVelocityTip": "<specific tip to hire faster>",
  "salaryCompetitiveness": "<assessment of salary competitiveness in UAE market>",
  "suggestedImprovements": ["<4-5 prioritized improvement suggestions>"]
}
Generate 4-5 insights. Be specific and UAE-market relevant.`;

  return callClaudeJSON<HiringInsightsResult>(prompt, system);
}

// ─── Portfolio Review ──────────────────────────────────────────────────────────

export interface PortfolioReviewResult {
  overallScore: number;          // 0-100
  overallLabel: 'Excellent' | 'Good' | 'Needs Work' | 'Major Issues';
  presentationScore: number;
  contentScore: number;
  uaeMarketScore: number;
  strengths: string[];
  improvements: Array<{ area: string; priority: 'high' | 'medium' | 'low'; suggestion: string }>;
  firstImpression: string;
  platformTips: string[];
  summary: string;
}

export async function analyzePortfolio(input: {
  portfolioUrl?: string;
  description: string;
  role: string;
  targetIndustry?: string;
}): Promise<PortfolioReviewResult> {
  const system = `You are a senior creative director and portfolio consultant with 15+ years of experience hiring for UAE and MENA media agencies, design studios, and marketing departments. You give direct, actionable portfolio feedback.`;

  const prompt = `Review this creative portfolio and provide expert feedback for the UAE job market.

ROLE TARGETING: ${input.role}
INDUSTRY: ${input.targetIndustry || 'Media & Creative'}
${input.portfolioUrl ? `PORTFOLIO URL: ${input.portfolioUrl}` : ''}

PORTFOLIO DESCRIPTION / WORK SAMPLES:
${input.description}

Evaluate and return a JSON object:
{
  "overallScore": <0-100>,
  "overallLabel": "<Excellent|Good|Needs Work|Major Issues>",
  "presentationScore": <0-100>,
  "contentScore": <0-100>,
  "uaeMarketScore": <0-100>,
  "strengths": ["<3-5 genuine strengths>"],
  "improvements": [
    { "area": "<area>", "priority": "<high|medium|low>", "suggestion": "<specific actionable suggestion>" }
  ],
  "firstImpression": "<honest 2-3 sentence first impression as a hiring manager>",
  "platformTips": ["<2-3 platform-specific tips e.g. Behance, LinkedIn, personal site>"],
  "summary": "<2-3 sentence overall assessment with the single most important action to take>"
}
Be direct, specific, and constructive. Focus on UAE media/creative market standards.`;

  return callClaudeJSON<PortfolioReviewResult>(prompt, system);
}

// ─── Market Intelligence Narrative ────────────────────────────────────────────

export interface MarketNarrativeResult {
  headline: string;          // e.g. "Hiring is up 18% — digital roles driving demand"
  marketMood: 'hot' | 'active' | 'steady' | 'slow';
  summary: string;           // 3-4 sentence market overview
  topOpportunities: Array<{ title: string; insight: string }>;
  seekerAdvice: string;      // 2-sentence advice for job seekers
  employerAdvice: string;    // 2-sentence advice for employers
  weeklyOutlook: string;     // forward-looking sentence
}

export interface RoleIntelligenceResult {
  demandLevel: 'very high' | 'high' | 'medium' | 'low';
  demandTrend: 'rising' | 'stable' | 'declining';
  salaryRange: { min: number; max: number; median: number; currency: string };
  competitionScore: number;   // 0-100 (higher = more competitive)
  topSkillsRequired: string[];
  topEmiratesHiring: string[];
  careerPath: string[];
  tipsToStandOut: string[];
  marketSummary: string;
}

export async function generateMarketNarrative(stats: {
  totalActiveJobs: number;
  newJobsThisWeek: number;
  totalSeekers: number;
  totalApplicationsThisWeek: number;
  topHiringIndustries: Array<{ industry: string; count: number }>;
  topHiringEmirates: Array<{ emirate: string; count: number }>;
  topSkillsInDemand: Array<{ skill: string; count: number }>;
  avgSalaryAED: number;
  urgentJobsCount: number;
  emiratizationJobsCount: number;
}): Promise<MarketNarrativeResult> {
  const system = `You are a senior UAE job market analyst writing a concise, authoritative market briefing.
Focus on media, creative, marketing, and digital industries. Be specific, data-driven, and actionable.`;

  const prompt = `Generate a UAE job market intelligence briefing based on real platform data.

LIVE PLATFORM DATA:
- Active job listings: ${stats.totalActiveJobs}
- New jobs this week: ${stats.newJobsThisWeek}
- Registered job seekers: ${stats.totalSeekers}
- Applications submitted this week: ${stats.totalApplicationsThisWeek}
- Avg salary offered (AED/month): ${Math.round(stats.avgSalaryAED)}
- Urgent roles: ${stats.urgentJobsCount}
- Emiratization roles: ${stats.emiratizationJobsCount}

TOP HIRING INDUSTRIES:
${stats.topHiringIndustries.slice(0, 6).map((i) => `- ${i.industry}: ${i.count} jobs`).join('\n')}

TOP HIRING EMIRATES:
${stats.topHiringEmirates.slice(0, 5).map((e) => `- ${e.emirate}: ${e.count} jobs`).join('\n')}

TOP SKILLS IN DEMAND:
${stats.topSkillsInDemand.slice(0, 10).map((s) => `- ${s.skill}: ${s.count} jobs`).join('\n')}

Return JSON:
{
  "headline": "<punchy 8-12 word market headline using the data>",
  "marketMood": "<hot|active|steady|slow>",
  "summary": "<3-4 sentence market overview referencing actual numbers above>",
  "topOpportunities": [
    { "title": "<opportunity name>", "insight": "<1-2 sentence insight why this is a good opportunity now>" }
  ],
  "seekerAdvice": "<2 sentence actionable advice for job seekers based on current market>",
  "employerAdvice": "<2 sentence actionable advice for employers to attract candidates>",
  "weeklyOutlook": "<1 forward-looking sentence about the market in coming weeks>"
}

Include 3-4 top opportunities. Be specific and reference actual numbers from the data.`;

  return callClaudeJSON<MarketNarrativeResult>(prompt, system);
}

export async function generateRoleIntelligence(roleData: {
  title: string;
  jobCount: number;
  applicationCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  topSkills: string[];
  topEmirates: string[];
  topIndustries: string[];
  recentJobs: number; // jobs posted in last 30 days
}): Promise<RoleIntelligenceResult> {
  const system = `You are a UAE job market specialist. Provide data-driven intelligence about specific job roles in the UAE, focusing on media, creative, and marketing sectors.`;

  const prompt = `Provide market intelligence for this job role based on UAE platform data.

ROLE: ${roleData.title}
Active job listings: ${roleData.jobCount}
Total applications received: ${roleData.applicationCount}
Average salary offered: AED ${Math.round(roleData.avgSalaryMin)}-${Math.round(roleData.avgSalaryMax)}/month
Recent postings (last 30 days): ${roleData.recentJobs}
Top skills required: ${roleData.topSkills.join(', ')}
Top hiring emirates: ${roleData.topEmirates.join(', ')}
Top hiring industries: ${roleData.topIndustries.join(', ')}

Competition index = applications ÷ jobs = ${roleData.jobCount > 0 ? Math.round(roleData.applicationCount / roleData.jobCount) : 0} applicants per role.

Return JSON:
{
  "demandLevel": "<very high|high|medium|low>",
  "demandTrend": "<rising|stable|declining>",
  "salaryRange": {
    "min": <number AED/month>,
    "max": <number AED/month>,
    "median": <number AED/month>,
    "currency": "AED"
  },
  "competitionScore": <0-100, higher = harder to get hired>,
  "topSkillsRequired": ["<top 5 skills>"],
  "topEmiratesHiring": ["<top 3 emirates>"],
  "careerPath": ["<3-4 logical next role progression steps>"],
  "tipsToStandOut": ["<4 specific tips to stand out for this role in UAE>"],
  "marketSummary": "<2-3 sentence market summary specific to this role in UAE>"
}`;

  return callClaudeJSON<RoleIntelligenceResult>(prompt, system);
}

// ─── Career Score ──────────────────────────────────────────────────────────────

export interface CareerScoreResult {
  overallScore: number;
  grade: string;
  scoreLabel: string;
  breakdown: {
    technicalSkills: number;
    experience: number;
    marketability: number;
    education: number;
    profileStrength: number;
  };
  strengths: string[];
  skillGaps: Array<{
    skill: string;
    priority: 'critical' | 'high' | 'medium';
    reason: string;
    howToLearn: string;
  }>;
  actionItems: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  marketPositioning: string;
  salaryPotential: {
    current: string;
    withImprovements: string;
  };
}

export async function generateCareerScore(input: {
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  education: string;
  industry: string;
  targetRole?: string;
  bio?: string;
}): Promise<CareerScoreResult> {
  const system = `You are an expert UAE career coach and talent assessment specialist with deep knowledge of the UAE job market across Dubai, Abu Dhabi, Sharjah, and all Emirates. You provide honest, data-driven career assessments with actionable insights tailored to the UAE market.`;

  const prompt = `Assess this candidate's career profile and provide a comprehensive Career Score for the UAE job market.

CANDIDATE PROFILE:
- Current Role: ${input.currentRole}
- Years of Experience: ${input.yearsOfExperience}
- Industry: ${input.industry}
- Education: ${input.education}
- Skills: ${input.skills.length > 0 ? input.skills.join(', ') : 'Not specified'}
${input.bio ? `- Bio/Summary: ${input.bio}` : ''}
${input.targetRole ? `- Target Role: ${input.targetRole}` : ''}

Evaluate against UAE market standards and demand. Be honest — a junior with few skills should score low, a strong senior should score high.

Return JSON with exactly this structure:
{
  "overallScore": <0-100 integer>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "scoreLabel": "<one of: Elite Talent|Strong Candidate|Competitive Profile|Developing Professional|Entry Level|Needs Improvement>",
  "breakdown": {
    "technicalSkills": <0-100>,
    "experience": <0-100>,
    "marketability": <0-100>,
    "education": <0-100>,
    "profileStrength": <0-100>
  },
  "strengths": ["<3-5 specific strengths this candidate has in the UAE market>"],
  "skillGaps": [
    {
      "skill": "<skill name>",
      "priority": "<critical|high|medium>",
      "reason": "<why this skill matters for their role/target in UAE>",
      "howToLearn": "<specific course, certification, or method to acquire it>"
    }
  ],
  "actionItems": [
    {
      "action": "<specific actionable step>",
      "impact": "<high|medium|low>",
      "timeframe": "<e.g. 1-2 weeks, 1 month, 3 months>"
    }
  ],
  "marketPositioning": "<2-3 sentence assessment of how this candidate is positioned in the UAE job market right now, and what opportunities are available>",
  "salaryPotential": {
    "current": "<estimated current salary range in AED/month based on profile, e.g. AED 8,000-12,000/month>",
    "withImprovements": "<estimated salary range after addressing top skill gaps, e.g. AED 15,000-20,000/month>"
  }
}

Scoring guide:
- overallScore: weighted (technical 30%, experience 25%, marketability 25%, education 10%, profile 10%)
- skillGaps: focus on ${input.targetRole ? `skills needed for ${input.targetRole}` : 'high-demand UAE market skills missing from their current set'}
- actionItems: 3-5 items, most impactful first
- Be specific to UAE market conditions`;

  return callClaudeJSON<CareerScoreResult>(prompt, system);
}
