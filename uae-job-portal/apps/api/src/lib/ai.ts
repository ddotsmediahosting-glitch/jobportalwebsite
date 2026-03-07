import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey,
});

export async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
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
