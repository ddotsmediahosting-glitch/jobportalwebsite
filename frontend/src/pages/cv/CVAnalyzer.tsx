import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Briefcase, Zap, ChevronRight, Loader2,
  ClipboardList, MessageSquare, HelpCircle, Trash2, RefreshCw,
  Download, Copy, CheckCircle, XCircle, AlertCircle, Clock,
  TrendingUp, BookOpen, Target, History, ChevronDown, ChevronUp,
  Sparkles, BarChart3, X, Eye,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { ATSScoreCard, KeywordsSection, SuggestionsList } from '../../components/cv/ATSScoreCard';

interface AnalysisResult {
  id: string;
  atsScore: number;
  keywordMatchScore: number;
  formatScore: number;
  contentScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  suggestionsJson: Array<{ category: string; priority: 'high' | 'medium' | 'low'; suggestion: string }>;
  summary: string;
  coverLetter?: string;
  interviewQsJson?: Array<{ question: string; category: string; difficulty: string; tip: string }>;
}

interface SkillsGapResult {
  matchingSkills: string[];
  missingCriticalSkills: string[];
  missingNiceToHaveSkills: string[];
  learningRecommendations: Array<{ skill: string; reason: string; resourceType: string }>;
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  fitPercentage: number;
}

interface HistoryItem {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  atsScore: number;
  createdAt: string;
}

type InputMode = 'text' | 'file';
type ActiveTab = 'score' | 'keywords' | 'suggestions' | 'skills-gap' | 'cover-letter' | 'interview';

const fitColors: Record<string, string> = {
  excellent: 'text-green-600 bg-green-50 border-green-200',
  good: 'text-blue-600 bg-blue-50 border-blue-200',
  fair: 'text-amber-600 bg-amber-50 border-amber-200',
  poor: 'text-red-600 bg-red-50 border-red-200',
};

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-600' : 'text-red-500';

function ProgressBar({ value, color = 'bg-indigo-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function CVAnalyzer() {
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [genCoverLetter, setGenCoverLetter] = useState(true);
  const [genInterviewQs, setGenInterviewQs] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [skillsGap, setSkillsGap] = useState<SkillsGapResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('score');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [copiedCover, setCopiedCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Analysis history
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['cv-analyses'],
    queryFn: async () => {
      const { data } = await api.get('/cv/analyses?limit=5');
      return data.data as { items: HistoryItem[]; total: number };
    },
    enabled: showHistory,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (inputMode === 'file' && cvFile) {
        formData.append('cvFile', cvFile);
      } else {
        formData.append('cvText', cvText);
      }
      formData.append('jobDescription', jobDescription);
      if (jobTitle) formData.append('jobTitle', jobTitle);
      if (companyName) formData.append('companyName', companyName);
      formData.append('generateCoverLetter', String(genCoverLetter));
      formData.append('generateInterviewQuestions', String(genInterviewQs));
      const { data } = await api.post('/cv/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data as AnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setSkillsGap(null);
      setActiveTab('score');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast.success('Analysis complete!');
      refetchHistory();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const skillsGapMutation = useMutation({
    mutationFn: async () => {
      const skills = userSkills.split(',').map(s => s.trim()).filter(Boolean);
      if (!skills.length) throw new Error('Add your skills first');
      const { data } = await api.post('/cv/skills-gap', {
        skills,
        cvText: cvText || 'Not provided',
        jobDescription,
      });
      return data.data as SkillsGapResult;
    },
    onSuccess: (data) => {
      setSkillsGap(data);
      setActiveTab('skills-gap');
      toast.success('Skills gap analysis ready!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const coverLetterMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/cv/cover-letter', {
        cvText: cvText || 'Not provided',
        jobDescription,
        jobTitle: jobTitle || 'Position',
        companyName: companyName || 'the Company',
        candidateName: candidateName || 'Candidate',
      });
      return data.data.coverLetter as string;
    },
    onSuccess: (letter) => {
      setResult(prev => prev ? { ...prev, coverLetter: letter } : prev);
      setActiveTab('cover-letter');
      toast.success('Cover letter generated!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const interviewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/cv/interview-questions', {
        cvText: cvText || 'Not provided',
        jobDescription,
        jobTitle: jobTitle || 'Position',
      });
      return data.data.questions;
    },
    onSuccess: (qs) => {
      setResult(prev => prev ? { ...prev, interviewQsJson: qs } : prev);
      setActiveTab('interview');
      toast.success('Interview questions ready!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // Drag and drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const allowed = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowed.includes(file.type) || file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        setCvFile(file);
      } else {
        toast.error('Unsupported file type. Use PDF, DOC, DOCX, or TXT.');
      }
    }
  }, []);

  const downloadCoverLetter = () => {
    const text = result?.coverLetter || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover_letter_${jobTitle || 'position'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCoverLetter = async () => {
    await navigator.clipboard.writeText(result?.coverLetter || '');
    setCopiedCover(true);
    setTimeout(() => setCopiedCover(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const canSubmit = jobDescription.trim().length >= 50 &&
    ((inputMode === 'text' && cvText.trim().length >= 100) ||
      (inputMode === 'file' && cvFile !== null));

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; hidden?: boolean }[] = [
    { id: 'score', label: 'ATS Score', icon: <BarChart3 size={14} /> },
    { id: 'keywords', label: 'Keywords', icon: <FileText size={14} /> },
    { id: 'suggestions', label: 'Suggestions', icon: <ClipboardList size={14} />, badge: result ? String(result.suggestionsJson?.length || 0) : undefined },
    { id: 'skills-gap', label: 'Skills Gap', icon: <Target size={14} />, hidden: !skillsGap },
    { id: 'cover-letter', label: 'Cover Letter', icon: <MessageSquare size={14} />, hidden: !result?.coverLetter },
    { id: 'interview', label: 'Interview Prep', icon: <HelpCircle size={14} />, hidden: !(result?.interviewQsJson?.length) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-800 to-blue-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
            <Sparkles size={14} className="text-yellow-400" />
            Powered by Claude AI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">ATS CV Analyzer</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-6">
            Get an instant ATS score, keyword analysis, and AI suggestions to land more interviews.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-100">
            {['Instant ATS Score', 'Keyword Gap Analysis', 'Cover Letter', 'Interview Prep', 'Skills Gap'].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-400" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Input Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8 border border-gray-100">

          {/* Step 1: CV Input */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <h3 className="font-semibold text-gray-800">Your CV</h3>
              {inputMode === 'text' && (
                <span className={`ml-auto text-xs ${cvText.length >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  {cvText.length} chars {cvText.length >= 100 ? '✓' : '(min 100)'}
                </span>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              {(['file', 'text'] as InputMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${inputMode === mode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {mode === 'file' ? <><Upload size={14} /> Upload File</> : <><FileText size={14} /> Paste Text</>}
                </button>
              ))}
            </div>

            {inputMode === 'file' ? (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging
                  ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                  : cvFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
              >
                <input
                  ref={fileInputRef} type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setCvFile(f); }}
                />
                {cvFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">{cvFile.name}</p>
                      <p className="text-xs text-green-600 mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB • Ready to analyze</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setCvFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                    >
                      <X size={13} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <Upload className={isDragging ? 'text-indigo-600' : 'text-slate-400'} size={28} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        {isDragging ? 'Drop your CV here!' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX, TXT — max 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={cvText}
                  onChange={e => setCvText(e.target.value)}
                  placeholder="Paste your CV text here... Include your experience, education, skills, and achievements."
                  rows={12}
                  className="w-full border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <div className={`absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full ${cvText.length >= 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cvText.length}/100+
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Job Details */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <h3 className="font-semibold text-gray-800">Job Details</h3>
              {jobDescription.length > 0 && (
                <span className={`ml-auto text-xs ${jobDescription.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                  {jobDescription.length} chars {jobDescription.length >= 50 ? '✓' : '(min 50)'}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <input
                type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="Job Title"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="Company Name (optional)"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)}
                placeholder="Your Name (for cover letter)"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="relative">
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. Include responsibilities, requirements, and qualifications for the best analysis."
                rows={8}
                className="w-full border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <div className={`absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full ${jobDescription.length >= 50 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {jobDescription.length}/50+
              </div>
            </div>
          </div>

          {/* Step 3: Options */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <h3 className="font-semibold text-gray-800">Generate Extras</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'cover', state: genCoverLetter, set: setGenCoverLetter, title: 'AI Cover Letter', desc: 'Personalized cover letter for this role', icon: <MessageSquare size={16} className="text-indigo-500" /> },
                { key: 'interview', state: genInterviewQs, set: setGenInterviewQs, title: 'Interview Prep Questions', desc: '10 tailored questions with expert tips', icon: <HelpCircle size={16} className="text-purple-500" /> },
              ].map(opt => (
                <label key={opt.key} className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${opt.state ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)} className="w-4 h-4 accent-indigo-600 shrink-0" />
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <div>
                      <p className="font-medium text-sm text-gray-800">{opt.title}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Skills for gap analysis */}
            <div className="mt-3 p-4 border border-dashed border-gray-200 rounded-2xl">
              <label className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-teal-500" />
                <span className="text-sm font-medium text-gray-700">Your Skills (for gap analysis)</span>
                <span className="text-xs text-gray-400">optional</span>
              </label>
              <input
                type="text"
                value={userSkills}
                onChange={e => setUserSkills(e.target.value)}
                placeholder="e.g. React, Python, Project Management, SQL..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated • AI will identify what skills you're missing for this role</p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!canSubmit || analyzeMutation.isPending}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {analyzeMutation.isPending ? (
              <><Loader2 className="animate-spin" size={22} /> Analyzing with AI... <span className="text-sm font-normal opacity-75">(may take 20–40s)</span></>
            ) : (
              <><Zap size={22} /> Analyze My CV <ChevronRight size={18} /></>
            )}
          </button>
          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 mt-2">
              {inputMode === 'file' && !cvFile ? '⬆ Upload your CV file' : inputMode === 'text' && cvText.length < 100 ? '✏ Add more CV text (100+ chars)' : ''}
              {jobDescription.length < 50 ? ' • Paste the job description (50+ chars)' : ''}
            </p>
          )}
        </div>

        {/* Loading state */}
        {analyzeMutation.isPending && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 border border-indigo-100">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                <Zap className="absolute inset-0 m-auto text-indigo-500" size={20} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 mb-1">Claude AI is analyzing your CV...</p>
                <p className="text-sm text-gray-500">Parsing content • Matching keywords • Generating insights</p>
              </div>
              <div className="w-full max-w-sm space-y-2 mt-2">
                {['Extracting CV content', 'Matching ATS keywords', 'Scoring your profile', genCoverLetter ? 'Writing cover letter' : null, genInterviewQs ? 'Preparing interview questions' : null]
                  .filter(Boolean).map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <Loader2 size={14} className="animate-spin text-indigo-400 shrink-0" />
                      {step}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !analyzeMutation.isPending && (
          <div ref={resultsRef} className="space-y-4">
            {/* Summary bar */}
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 border border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-extrabold ${scoreColor(result.atsScore)}`}>{result.atsScore}</div>
                <div className="text-xs text-gray-400 leading-tight">ATS<br/>Score</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              {jobTitle && <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Briefcase size={14} className="text-indigo-500" />{jobTitle}</div>}
              {companyName && <span className="text-sm text-gray-400">@ {companyName}</span>}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-all"
                >
                  <History size={14} /> History
                </button>
                <button
                  onClick={() => { setResult(null); setCvText(''); setCvFile(null); setJobDescription(''); setSkillsGap(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200 transition-all"
                >
                  <RefreshCw size={14} /> New Analysis
                </button>
              </div>
            </div>

            {/* Sub-score bars */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Keyword Match', value: result.keywordMatchScore, color: 'bg-blue-500' },
                  { label: 'Content Quality', value: result.contentScore, color: 'bg-purple-500' },
                  { label: 'Format Score', value: result.formatScore, color: 'bg-teal-500' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                      <span>{s.label}</span>
                      <span className={`font-bold ${scoreColor(s.value)}`}>{s.value}%</span>
                    </div>
                    <ProgressBar value={s.value} color={s.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.filter(t => !t.hidden).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {tab.icon} {tab.label}
                  {tab.badge && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                </button>
              ))}
              {/* Skills gap trigger */}
              {!skillsGap && (
                <button
                  onClick={() => skillsGapMutation.mutate()}
                  disabled={skillsGapMutation.isPending || !userSkills.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 disabled:opacity-50 transition-all"
                  title={!userSkills.trim() ? 'Add your skills in the form above' : ''}
                >
                  {skillsGapMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                  Analyze Skills Gap
                </button>
              )}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'score' && (
                <div className="space-y-5">
                  <ATSScoreCard
                    atsScore={result.atsScore}
                    keywordMatchScore={result.keywordMatchScore}
                    formatScore={result.formatScore}
                    contentScore={result.contentScore}
                  />
                  {result.summary && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5">
                      <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles size={16} /> AI Summary</h3>
                      <p className="text-indigo-800 text-sm leading-relaxed">{result.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'keywords' && (
                <KeywordsSection matched={result.matchedKeywords} missing={result.missingKeywords} />
              )}

              {activeTab === 'suggestions' && (
                <SuggestionsList
                  suggestions={result.suggestionsJson || []}
                  strengths={result.strengths}
                  weaknesses={result.weaknesses}
                />
              )}

              {activeTab === 'skills-gap' && skillsGap && (
                <div className="space-y-4">
                  {/* Fit score */}
                  <div className={`rounded-2xl border p-5 ${fitColors[skillsGap.overallFit]}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-lg capitalize">{skillsGap.overallFit} Fit</p>
                        <p className="text-sm opacity-80">You match {skillsGap.fitPercentage}% of required skills</p>
                      </div>
                      <div className="text-4xl font-extrabold">{skillsGap.fitPercentage}%</div>
                    </div>
                    <ProgressBar value={skillsGap.fitPercentage} color={
                      skillsGap.overallFit === 'excellent' ? 'bg-green-500' :
                        skillsGap.overallFit === 'good' ? 'bg-blue-500' :
                          skillsGap.overallFit === 'fair' ? 'bg-amber-500' : 'bg-red-500'
                    } />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Matching */}
                    <div className="bg-white rounded-2xl border border-green-200 p-5">
                      <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2"><CheckCircle size={15} /> You Have ({skillsGap.matchingSkills.length})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsGap.matchingSkills.map(s => <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">{s}</span>)}
                      </div>
                    </div>
                    {/* Missing Critical */}
                    <div className="bg-white rounded-2xl border border-red-200 p-5">
                      <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2"><XCircle size={15} /> Critical Missing ({skillsGap.missingCriticalSkills.length})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsGap.missingCriticalSkills.map(s => <span key={s} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full border border-red-200">{s}</span>)}
                      </div>
                    </div>
                    {/* Nice to have */}
                    <div className="bg-white rounded-2xl border border-amber-200 p-5">
                      <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><AlertCircle size={15} /> Nice to Have ({skillsGap.missingNiceToHaveSkills.length})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsGap.missingNiceToHaveSkills.map(s => <span key={s} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">{s}</span>)}
                      </div>
                    </div>
                  </div>

                  {/* Learning Recommendations */}
                  {skillsGap.learningRecommendations.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen size={16} className="text-indigo-500" /> Learning Recommendations</h4>
                      <div className="space-y-3">
                        {skillsGap.learningRecommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-indigo-700">{i + 1}</div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{rec.skill}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{rec.reason}</p>
                              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full mt-1 inline-block">{rec.resourceType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cover-letter' && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-gray-900">AI-Generated Cover Letter</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyCoverLetter}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${copiedCover ? 'border-green-400 text-green-600 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                      >
                        {copiedCover ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                      </button>
                      <button
                        onClick={downloadCoverLetter}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 transition-all"
                      >
                        <Download size={13} /> Download
                      </button>
                      <button
                        onClick={() => coverLetterMutation.mutate()}
                        disabled={coverLetterMutation.isPending}
                        className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {coverLetterMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {result.coverLetter}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'interview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Interview Preparation</h3>
                      <p className="text-sm text-gray-500">{result.interviewQsJson?.length || 0} questions tailored to this role</p>
                    </div>
                    <button
                      onClick={() => interviewMutation.mutate()}
                      disabled={interviewMutation.isPending}
                      className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {interviewMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                      Refresh
                    </button>
                  </div>

                  {(result.interviewQsJson || []).map((q, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                      >
                        <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{q.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${q.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-100' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                              {q.difficulty}
                            </span>
                          </div>
                        </div>
                        {expandedQ === i ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>
                      {expandedQ === i && (
                        <div className="px-4 pb-4 border-t border-gray-50">
                          <div className="bg-amber-50 rounded-xl p-3 mt-3 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-700 mb-1">💡 Interview Tip</p>
                            <p className="text-sm text-amber-800">{q.tip}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {!result.interviewQsJson?.length && (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                      <HelpCircle className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-gray-500 mb-4">No interview questions yet</p>
                      <button
                        onClick={() => interviewMutation.mutate()}
                        disabled={interviewMutation.isPending}
                        className="flex items-center gap-2 mx-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {interviewMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <HelpCircle size={16} />}
                        Generate Interview Questions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <History size={16} />
            {showHistory ? 'Hide' : 'View'} Analysis History
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHistory && (
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {!historyData?.items?.length ? (
                <div className="p-6 text-center text-gray-400 text-sm">No previous analyses found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {historyData.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${item.atsScore >= 80 ? 'bg-green-100 text-green-700' : item.atsScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {item.atsScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{item.jobTitle || 'Untitled Analysis'}</p>
                        {item.companyName && <p className="text-xs text-gray-400 truncate">@ {item.companyName}</p>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <Clock size={12} />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* How it works */}
        {!result && !analyzeMutation.isPending && (
          <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">How It Works</h3>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { icon: <Upload size={22} className="text-indigo-500" />, title: 'Upload CV', desc: 'PDF, Word, or paste text' },
                { icon: <FileText size={22} className="text-blue-500" />, title: 'Add Job', desc: 'Paste the job description' },
                { icon: <Zap size={22} className="text-purple-500" />, title: 'AI Analysis', desc: 'Claude scans & scores your CV' },
                { icon: <TrendingUp size={22} className="text-green-500" />, title: 'Get Results', desc: 'Score, keywords & action plan' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                    {step.icon}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
