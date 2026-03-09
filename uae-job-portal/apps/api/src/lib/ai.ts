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
CURRENT SKILLS: ${input.skills.join(', ')}
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

CANDIDATE SKILLS: ${candidateSkills.join(', ')}

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
    `[${i + 1}] ID: ${c.applicationId}\nName: ${c.candidateName}\nExp: ${c.yearsOfExperience ?? '?'} yrs\nHeadline: ${c.headline || '-'}\nSkills: ${c.skills.join(', ') || '-'}\nCover Letter: ${c.coverLetter ? c.coverLetter.substring(0, 200) : 'None'}`
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
Skills: ${seekerProfile.skills.join(', ') || '-'}
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
  const contextStr = userContext?.skills?.length
    ? `\nUser: ${userContext.headline || 'job seeker'}, ${userContext.yearsOfExperience ?? '?'} yrs exp, skills: ${userContext.skills.slice(0, 8).join(', ')}`
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
