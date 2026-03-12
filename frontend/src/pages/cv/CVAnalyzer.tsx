import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Briefcase, Zap, ChevronRight, Loader2,
  ClipboardList, MessageSquare, HelpCircle, Trash2, RefreshCw,
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

type InputMode = 'text' | 'file';
type ActiveTab = 'score' | 'keywords' | 'suggestions' | 'cover-letter' | 'interview';

export function CVAnalyzer() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [genCoverLetter, setGenCoverLetter] = useState(false);
  const [genInterviewQs, setGenInterviewQs] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('score');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      setActiveTab('score');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast.success('Analysis complete!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const coverLetterMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/cv/cover-letter', {
        cvText: cvText || 'Not provided',
        jobDescription,
        jobTitle: jobTitle || 'Position',
        companyName: companyName || 'Company',
        candidateName: 'Candidate',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const canSubmit = jobDescription.trim().length >= 50 &&
    ((inputMode === 'text' && cvText.trim().length >= 100) ||
     (inputMode === 'file' && cvFile !== null));

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; condition?: boolean }[] = [
    { id: 'score', label: 'ATS Score', icon: <Zap size={15} /> },
    { id: 'keywords', label: 'Keywords', icon: <FileText size={15} /> },
    { id: 'suggestions', label: 'Suggestions', icon: <ClipboardList size={15} /> },
    { id: 'cover-letter', label: 'Cover Letter', icon: <MessageSquare size={15} />, condition: !!result?.coverLetter },
    { id: 'interview', label: 'Interview Prep', icon: <HelpCircle size={15} />, condition: !!(result?.interviewQsJson?.length) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-800 to-blue-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-4">
            <Zap size={14} className="text-yellow-400" />
            Powered by Claude AI
          </div>
          <h1 className="text-4xl font-extrabold mb-3">ATS CV Analyzer</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Upload your CV and paste a job description. Our AI gives you an instant ATS score,
            identifies missing keywords, and provides actionable suggestions to land more interviews.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Input Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Analyze Your CV</h2>

          {/* Step 1: CV Input */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <h3 className="font-semibold text-gray-800">Your CV</h3>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  inputMode === 'text' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <FileText size={15} /> Paste Text
              </button>
              <button
                onClick={() => setInputMode('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  inputMode === 'file' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Upload size={15} /> Upload File
              </button>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                placeholder="Paste your CV text here... (minimum 100 characters)"
                rows={10}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
                {cvFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="text-indigo-600" size={24} />
                    <span className="font-medium text-indigo-700">{cvFile.name}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setCvFile(null); }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-indigo-400 mb-3" size={32} />
                    <p className="font-medium text-gray-700">Drop your CV here or click to upload</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX, TXT (max 10MB)</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Job Details */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <h3 className="font-semibold text-gray-800">Job Details</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Job Title (e.g. Senior Software Engineer)"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Company Name (optional)"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here... (minimum 50 characters)"
              rows={8}
              className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          {/* Step 3: Options */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <h3 className="font-semibold text-gray-800">AI Extras</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                <input
                  type="checkbox"
                  checked={genCoverLetter}
                  onChange={e => setGenCoverLetter(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <div>
                  <p className="font-medium text-sm text-gray-800">Generate Cover Letter</p>
                  <p className="text-xs text-gray-500">AI-crafted cover letter for this role</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                <input
                  type="checkbox"
                  checked={genInterviewQs}
                  onChange={e => setGenInterviewQs(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <div>
                  <p className="font-medium text-sm text-gray-800">Interview Prep Questions</p>
                  <p className="text-xs text-gray-500">10 tailored questions with tips</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!canSubmit || analyzeMutation.isPending}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {analyzeMutation.isPending ? (
              <><Loader2 className="animate-spin" size={22} /> Analyzing with AI...</>
            ) : (
              <><Zap size={22} /> Analyze CV Now <ChevronRight size={18} /></>
            )}
          </button>
          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 mt-2">
              {inputMode === 'text' ? 'Add CV text (100+ chars)' : 'Upload a CV file'} and a job description (50+ chars) to continue
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef}>
            {/* Summary bar */}
            <div className="bg-white rounded-2xl shadow-md px-6 py-4 mb-6 border border-gray-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-700">{jobTitle || 'Position'}</span>
                {companyName && <span className="text-sm text-gray-400">@ {companyName}</span>}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => { setResult(null); setCvText(''); setCvFile(null); setJobDescription(''); }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  <RefreshCw size={14} /> New Analysis
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.filter(t => t.condition !== false).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'score' && (
              <div className="space-y-6">
                <ATSScoreCard
                  atsScore={result.atsScore}
                  keywordMatchScore={result.keywordMatchScore}
                  formatScore={result.formatScore}
                  contentScore={result.contentScore}
                />
                {result.summary && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                    <h3 className="font-bold text-indigo-900 mb-2">AI Summary</h3>
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

            {activeTab === 'cover-letter' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">AI-Generated Cover Letter</h3>
                  <button
                    onClick={() => coverLetterMutation.mutate()}
                    disabled={coverLetterMutation.isPending}
                    className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {coverLetterMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Regenerate
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 rounded-xl p-5">
                  {result.coverLetter}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(result.coverLetter || '')}
                  className="mt-3 text-xs text-indigo-600 hover:underline"
                >
                  Copy to clipboard
                </button>
              </div>
            )}

            {activeTab === 'interview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Interview Preparation Questions</h3>
                  <button
                    onClick={() => interviewMutation.mutate()}
                    disabled={interviewMutation.isPending}
                    className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {interviewMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Regenerate
                  </button>
                </div>
                {(result.interviewQsJson || []).map((q, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{q.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>{q.difficulty}</span>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                      <span className="font-medium text-gray-600">Tip: </span>{q.tip}
                    </p>
                  </div>
                ))}
                {(!result.interviewQsJson?.length) && (
                  <div className="text-center py-10">
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
        )}
      </div>
    </div>
  );
}
