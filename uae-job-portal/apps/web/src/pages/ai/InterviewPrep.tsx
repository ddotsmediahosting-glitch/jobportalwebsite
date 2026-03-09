import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Mic, Sparkles, Loader2, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertTriangle, HelpCircle,
  BookOpen, Star, MessageSquare, KeyRound,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Construction & Real Estate',
  'Retail & E-commerce', 'Tourism & Hospitality', 'Education', 'Energy & Oil & Gas',
  'Logistics & Transportation', 'Consulting', 'Manufacturing', 'Media & Advertising',
];

const EXP_OPTIONS = [
  { value: 0, label: 'Entry level (0-1 yrs)' },
  { value: 2, label: 'Junior (2-3 yrs)' },
  { value: 5, label: 'Mid-level (4-6 yrs)' },
  { value: 8, label: 'Senior (7-10 yrs)' },
  { value: 12, label: 'Lead / Principal (10+ yrs)' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  hard: 'bg-red-50 text-red-700 border-red-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  Technical: 'bg-blue-50 text-blue-700',
  Behavioral: 'bg-purple-50 text-purple-700',
  Situational: 'bg-orange-50 text-orange-700',
  'Role-specific': 'bg-brand-50 text-brand-700',
  'Culture fit': 'bg-pink-50 text-pink-700',
  'UAE-specific': 'bg-emerald-50 text-emerald-700',
};

interface PrepResult {
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

interface FormData {
  role: string;
  industry: string;
  yearsOfExperience: number;
  specificFocus: string;
}

function QuestionCard({ q, index }: { q: PrepResult['questions'][0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}>
                {q.difficulty}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[q.category] || 'bg-gray-100 text-gray-600'}`}>
                {q.category}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>
          </div>
          <div className="flex-shrink-0 ml-2">
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
              <Star size={11} /> How to Answer
            </p>
            <p className="text-sm text-blue-800">{q.tip}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
              <MessageSquare size={11} /> Sample Answer Framework
            </p>
            <p className="text-sm text-green-800">{q.sampleAnswer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InterviewPrep() {
  const [result, setResult] = useState<PrepResult | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'tips' | 'mistakes' | 'ask'>('questions');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get('/ai/status').then((r) => r.data.data as { configured: boolean }),
    staleTime: 60_000,
  });

  const roleInputRef = useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: { role: '', industry: 'Technology', yearsOfExperience: 5, specificFocus: '' },
  });
  const { ref: roleRef, ...roleRest } = register('role', { required: 'Role is required' });

  const prepMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/ai/interview-prep', data).then((r) => r.data.data),
    onSuccess: (data) => { setResult(data); setActiveTab('questions'); setCategoryFilter(''); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const popularRoles = [
    'Software Engineer', 'Data Analyst', 'Marketing Manager', 'Sales Manager',
    'Project Manager', 'Financial Analyst', 'HR Specialist', 'Business Analyst',
  ];

  const categories = result
    ? ['', ...new Set(result.questions.map((q) => q.category))]
    : [];

  const filteredQuestions = result?.questions.filter(
    (q) => !categoryFilter || q.category === categoryFilter
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-800 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-purple-200 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Mic size={14} /> AI Interview Coach
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Interview Prep</h1>
          <p className="text-purple-200 text-lg max-w-xl mx-auto">
            Generate tailored interview questions, expert tips, and sample answers for any role in the UAE job market.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* AI not configured banner */}
        {aiStatus && !aiStatus.configured && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <KeyRound size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold">AI features are not configured</p>
              <p className="mt-0.5 text-amber-700">Add a valid <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the API container to enable interview prep.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" /> Set Up Your Practice Session
          </h2>

          <form onSubmit={handleSubmit((d) => prepMutation.mutate(d))} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Role *</label>
              <input
                {...roleRest}
                ref={(el) => { roleRef(el); roleInputRef.current = el; }}
                placeholder="e.g. Senior Software Engineer, Marketing Manager"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {popularRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue('role', r)}
                    className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  {...register('industry')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  {...register('yearsOfExperience', { valueAsNumber: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {EXP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specific Focus <span className="text-gray-400">(optional)</span></label>
              <input
                {...register('specificFocus')}
                placeholder="e.g. system design, leadership, React, UAE regulations"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <Button
              type="submit"
              loading={prepMutation.isPending}
              icon={prepMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {prepMutation.isPending ? 'Generating questions...' : 'Generate Interview Prep'}
            </Button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5 overflow-x-auto">
              {[
                { key: 'questions', label: `Questions (${result.questions.length})`, icon: HelpCircle },
                { key: 'tips', label: `Interview Tips (${result.interviewTips.length})`, icon: BookOpen },
                { key: 'mistakes', label: `Common Mistakes`, icon: XCircle },
                { key: 'ask', label: `Questions to Ask`, icon: MessageSquare },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === key
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Questions tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {/* Category filter */}
                {categories.length > 2 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          categoryFilter === cat
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'
                        }`}
                      >
                        {cat || 'All Categories'}
                      </button>
                    ))}
                  </div>
                )}
                {filteredQuestions?.map((q, i) => (
                  <QuestionCard key={i} q={q} index={i} />
                ))}
              </div>
            )}

            {/* Tips tab */}
            {activeTab === 'tips' && (
              <div className="space-y-3">
                {result.interviewTips.map((tip, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mistakes tab */}
            {activeTab === 'mistakes' && (
              <div className="space-y-3">
                {result.commonMistakes.map((m, i) => (
                  <div key={i} className="bg-white rounded-xl border border-red-100 p-4 flex items-start gap-3">
                    <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{m}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Questions to ask tab */}
            {activeTab === 'ask' && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-700">Always prepare questions to ask your interviewer — it shows genuine interest and helps you evaluate if the role is right for you.</p>
                </div>
                {result.questionsToAsk.map((q, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                    <CheckCircle size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{q}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
