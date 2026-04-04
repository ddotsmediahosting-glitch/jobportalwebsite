import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Mic, ChevronRight, RotateCcw, CheckCircle, AlertCircle,
  Lightbulb, Star, User, Building2, Clock, TrendingUp,
  MessageSquare, Award, ArrowRight, Send,
} from 'lucide-react';
import { api } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'motivational';
  hint: string;
}

interface InterviewSet {
  interviewerPersona: string;
  companyContext: string;
  questions: Question[];
}

interface AnswerEvaluation {
  score: number;
  scoreLabel: string;
  whatWorked: string[];
  improvements: string[];
  modelAnswer: string;
  coachingTip: string;
}

interface Debrief {
  overallScore: number;
  overallLabel: string;
  summary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  hireRecommendation: string;
  nextSteps: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Technology & IT', 'Finance & Banking', 'Healthcare', 'Construction & Engineering',
  'Hospitality & Tourism', 'Retail & E-commerce', 'Media & Marketing', 'Education',
  'Logistics & Supply Chain', 'Real Estate', 'Oil & Gas', 'Consulting', 'Other',
];

const INTERVIEW_TYPES = [
  { value: 'mixed', label: 'Mixed', desc: 'Behavioral + Technical + Situational' },
  { value: 'behavioral', label: 'Behavioral', desc: 'Past experience & STAR-format' },
  { value: 'technical', label: 'Technical', desc: 'Role-specific skills & knowledge' },
  { value: 'hr', label: 'HR Round', desc: 'Culture fit, motivation & salary' },
];

const EXP_OPTIONS = [
  { value: 0, label: '0–1 years (Fresher)' },
  { value: 2, label: '2–3 years (Junior)' },
  { value: 5, label: '4–6 years (Mid-level)' },
  { value: 8, label: '7–10 years (Senior)' },
  { value: 12, label: '10+ years (Lead/Director)' },
];

const TYPE_COLORS: Record<string, string> = {
  behavioral: 'bg-purple-100 text-purple-700',
  technical: 'bg-blue-100 text-blue-700',
  situational: 'bg-orange-100 text-orange-700',
  motivational: 'bg-green-100 text-green-700',
};

const SCORE_CONFIG = (score: number) => {
  if (score >= 9) return { color: 'text-green-700', bg: 'bg-green-50 border-green-200', bar: 'bg-green-500' };
  if (score >= 7) return { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', bar: 'bg-blue-500' };
  if (score >= 5) return { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', bar: 'bg-yellow-500' };
  return { color: 'text-red-700', bg: 'bg-red-50 border-red-200', bar: 'bg-red-500' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const cfg = SCORE_CONFIG(score);
  return (
    <div className={clsx('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm', cfg.bg, cfg.color)}>
      <span className="text-lg font-bold">{score}/10</span>
      <span>— {label}</span>
    </div>
  );
}

function ProgressDots({ total, current, scores }: { total: number; current: number; scores: (number | null)[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const s = scores[i];
        const isCurrent = i === current;
        return (
          <div
            key={i}
            className={clsx(
              'h-2.5 rounded-full transition-all duration-300',
              isCurrent ? 'w-8 bg-blue-600' :
              s !== null ? (s >= 7 ? 'w-2.5 bg-green-500' : s >= 5 ? 'w-2.5 bg-yellow-500' : 'w-2.5 bg-red-400') :
              'w-2.5 bg-gray-200',
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Stage = 'setup' | 'interview' | 'debrief';

export function MockInterview() {
  // Setup form
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [interviewType, setInterviewType] = useState('mixed');

  // Interview state
  const [stage, setStage] = useState<Stage>('setup');
  const [interviewSet, setInterviewSet] = useState<InterviewSet | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluations, setEvaluations] = useState<(AnswerEvaluation | null)[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [debrief, setDebrief] = useState<Debrief | null>(null);

  // Generate questions
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/mock-interview/questions', {
        role, industry, yearsOfExperience, interviewType,
      });
      return res.data.data as InterviewSet;
    },
    onSuccess: (data) => {
      setInterviewSet(data);
      setEvaluations(new Array(data.questions.length).fill(null));
      setAnswers(new Array(data.questions.length).fill(''));
      setCurrentQ(0);
      setAnswer('');
      setStage('interview');
    },
  });

  // Evaluate answer
  const evalMutation = useMutation({
    mutationFn: async () => {
      const q = interviewSet!.questions[currentQ];
      const res = await api.post('/ai/mock-interview/evaluate', {
        role, industry, yearsOfExperience,
        question: q.question,
        questionType: q.type,
        answer,
      });
      return res.data.data as AnswerEvaluation;
    },
    onSuccess: (data) => {
      const newEvals = [...evaluations];
      newEvals[currentQ] = data;
      const newAnswers = [...answers];
      newAnswers[currentQ] = answer;
      setEvaluations(newEvals);
      setAnswers(newAnswers);
      setShowHint(false);
      setShowModelAnswer(false);
    },
  });

  // Generate debrief
  const debriefMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/mock-interview/debrief', {
        role,
        questions: interviewSet!.questions.map((q) => q.question),
        answers,
        scores: evaluations.map((e) => e?.score ?? 0),
      });
      return res.data.data as Debrief;
    },
    onSuccess: (data) => {
      setDebrief(data);
      setStage('debrief');
    },
  });

  function submitAnswer() {
    if (!answer.trim() || answer.trim().length < 10) return;
    evalMutation.mutate();
  }

  function nextQuestion() {
    if (currentQ < interviewSet!.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setAnswer(answers[currentQ + 1] || '');
      setShowHint(false);
      setShowModelAnswer(false);
    } else {
      debriefMutation.mutate();
    }
  }

  function restart() {
    setStage('setup');
    setInterviewSet(null);
    setEvaluations([]);
    setAnswers([]);
    setCurrentQ(0);
    setAnswer('');
    setDebrief(null);
  }

  const scores = evaluations.map((e) => e?.score ?? null);
  const allAnswered = evaluations.every((e) => e !== null);
  const currentEval = evaluations[currentQ];
  const currentQuestion = interviewSet?.questions[currentQ];

  // ── Setup Stage ──────────────────────────────────────────────────────────────

  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 text-white">
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Mic className="w-4 h-4" />
              AI Interview Simulator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Mock Interview</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Practice with a realistic UAE interview, get instant AI feedback on every answer,
              and receive a full debrief — just like a real coaching session.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Set up your interview
            </h2>

            <div className="space-y-6">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title / Role you're interviewing for <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Marketing Manager, Software Engineer, Sales Executive"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your experience level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setYearsOfExperience(opt.value)}
                      className={clsx(
                        'text-left px-4 py-2.5 rounded-lg border text-sm transition-colors',
                        yearsOfExperience === opt.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview type</label>
                <div className="grid grid-cols-2 gap-3">
                  {INTERVIEW_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInterviewType(t.value)}
                      className={clsx(
                        'text-left px-4 py-3 rounded-xl border transition-colors',
                        interviewType === t.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div className={clsx('text-sm font-semibold', interviewType === t.value ? 'text-blue-700' : 'text-gray-900')}>
                        {t.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-700">
                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                <span>You'll answer 6 questions. After each answer the AI gives instant feedback, a score, and a model answer. You'll get a full debrief at the end.</span>
              </div>

              <button
                onClick={() => startMutation.mutate()}
                disabled={!role.trim() || startMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {startMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing your interview...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Interview
                  </>
                )}
              </button>

              {startMutation.isError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Failed to generate interview. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Interview Stage ───────────────────────────────────────────────────────────

  if (stage === 'interview' && interviewSet && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Interviewer</div>
                <div className="text-sm font-medium text-gray-900 truncate max-w-48">{interviewSet.interviewerPersona}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressDots total={interviewSet.questions.length} current={currentQ} scores={scores} />
              <span className="text-sm text-gray-500">{currentQ + 1}/{interviewSet.questions.length}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {/* Context (first question only) */}
          {currentQ === 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-indigo-700">
              <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
              {interviewSet.companyContext}
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[currentQuestion.type] || 'bg-gray-100 text-gray-600')}>
                    {currentQuestion.type}
                  </span>
                  <span className="text-xs text-gray-400">Question {currentQ + 1} of {interviewSet.questions.length}</span>
                </div>
                <p className="text-gray-900 text-base font-medium leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* Hint toggle */}
            <div className="mt-4 ml-14">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHint ? 'Hide hint' : 'What is the interviewer looking for?'}
              </button>
              {showHint && (
                <div className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  {currentQuestion.hint}
                </div>
              )}
            </div>
          </div>

          {/* Answer Box */}
          {!currentEval && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Aim for 100-300 words. Be specific and use real examples where possible."
                rows={8}
                disabled={evalMutation.isPending}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || answer.trim().length < 10 || evalMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {evalMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
              {evalMutation.isError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Failed to evaluate. Please try again.
                </div>
              )}
            </div>
          )}

          {/* Evaluation Result */}
          {currentEval && (
            <div className={clsx('bg-white rounded-2xl shadow-sm border p-6 space-y-5', SCORE_CONFIG(currentEval.score).bg)}>
              {/* Score */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  AI Feedback
                </h3>
                <ScoreBadge score={currentEval.score} label={currentEval.scoreLabel} />
              </div>

              {/* Score bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={clsx('h-2 rounded-full transition-all duration-700', SCORE_CONFIG(currentEval.score).bar)}
                  style={{ width: `${currentEval.score * 10}%` }}
                />
              </div>

              {/* Your answer */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-1">Your answer</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{answers[currentQ]}</p>
              </div>

              {/* What worked */}
              {currentEval.whatWorked.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> What worked well
                  </div>
                  <ul className="space-y-1">
                    {currentEval.whatWorked.map((w, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {currentEval.improvements.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> How to improve
                  </div>
                  <ul className="space-y-1">
                    {currentEval.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">→</span>{imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coaching tip */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700"><span className="font-semibold">Coach tip:</span> {currentEval.coachingTip}</p>
              </div>

              {/* Model answer toggle */}
              <button
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                {showModelAnswer ? 'Hide model answer' : 'See a strong model answer'}
              </button>
              {showModelAnswer && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-green-700 mb-2">Model Answer</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{currentEval.modelAnswer}</p>
                </div>
              )}

              {/* Next button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={nextQuestion}
                  disabled={debriefMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {debriefMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating debrief...
                    </>
                  ) : currentQ < interviewSet.questions.length - 1 ? (
                    <>Next Question <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <>Finish & Get Debrief <Award className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Debrief Stage ─────────────────────────────────────────────────────────────

  if (stage === 'debrief' && debrief) {
    const avgScore = evaluations.reduce((sum, e) => sum + (e?.score ?? 0), 0) / evaluations.length;
    const cfg = SCORE_CONFIG(Math.round(avgScore));

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-indigo-700 to-blue-700 text-white">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold mb-2">Interview Complete</h1>
            <p className="text-blue-100">{role} · {interviewSet?.interviewerPersona}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Overall Score */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl font-bold text-gray-900 mb-1">{debrief.overallScore}<span className="text-2xl text-gray-400">/10</span></div>
            <div className={clsx('inline-block text-lg font-bold px-5 py-1.5 rounded-full mt-2 mb-4', cfg.bg, cfg.color)}>
              {debrief.overallLabel}
            </div>
            <p className="text-gray-700 leading-relaxed max-w-xl mx-auto">{debrief.summary}</p>
            <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
              <span className="font-semibold">Interviewer verdict: </span>{debrief.hireRecommendation}
            </div>
          </div>

          {/* Question breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Question Breakdown
            </h3>
            <div className="space-y-3">
              {interviewSet!.questions.map((q, i) => {
                const e = evaluations[i];
                const s = e?.score ?? 0;
                const qcfg = SCORE_CONFIG(s);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700 flex-1 truncate">{q.question}</p>
                    <span className={clsx('text-sm font-bold px-2 py-0.5 rounded-full', qcfg.bg, qcfg.color)}>{s}/10</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Top Strengths
              </h3>
              <ul className="space-y-2">
                {debrief.topStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {debrief.topWeaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5 shrink-0">→</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Before Your Next Real Interview
            </h3>
            <div className="space-y-3">
              {debrief.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={restart}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </button>
            <a
              href="/jobs"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
