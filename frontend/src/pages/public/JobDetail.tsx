import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MapPin, Briefcase, DollarSign, Clock, Users, Bookmark, BookmarkCheck, ExternalLink, Flag, ChevronLeft,
  Sparkles, Loader2, TrendingUp,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { SEOHead, buildJobPostingSchema } from '../../components/SEOHead';
import { SocialShare } from '../../components/SocialShare';
import {
  EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, VISA_STATUS_LABELS,
  Emirates, WorkMode, EmploymentType, VisaStatus,
} from '@uaejobs/shared';

const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://jobs.ddotsmedia.com';

function JobDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="skeleton h-4 rounded w-24 mb-6" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="skeleton h-14 w-14 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-6 rounded w-3/4" />
                <div className="skeleton h-4 rounded w-1/2" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-6 rounded-full w-24" />)}
            </div>
            <div className="space-y-2 pt-2">
              <div className="skeleton h-4 rounded w-full" />
              <div className="skeleton h-4 rounded w-5/6" />
              <div className="skeleton h-4 rounded w-4/5" />
              <div className="skeleton h-4 rounded w-full" />
              <div className="skeleton h-4 rounded w-3/4" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="skeleton h-5 rounded w-32" />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-7 rounded-full w-20" />)}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="skeleton h-10 rounded-xl w-full" />
            <div className="skeleton h-10 rounded-xl w-full" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                <div className="skeleton h-3.5 rounded w-24" />
                <div className="skeleton h-3.5 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(n?: number | null) { return n ? n.toLocaleString() : null; }

export function JobDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', slug],
    queryFn: () => api.get(`/jobs/${slug}`).then((r) => r.data.data),
  });

  const { data: matchData, isLoading: matchLoading, refetch: fetchMatch, isFetched: matchFetched } = useQuery({
    queryKey: ['job-match', data?.id],
    queryFn: () => api.get(`/ai/match-score/${data!.id}`).then(r => r.data.data),
    enabled: false,
  });

  const { data: resumes } = useQuery({
    queryKey: ['my-resumes'],
    queryFn: () => api.get('/seeker/profile').then((r) => r.data.data.resumes || []),
    enabled: user?.role === 'SEEKER' && applyOpen,
  });

  const [selectedResumeId, setSelectedResumeId] = useState('');

  const saveMutation = useMutation({
    mutationFn: () =>
      data?.isSaved ? api.delete(`/seeker/saved-jobs/${data.id}`) : api.post(`/seeker/saved-jobs/${data.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job', slug] }); toast.success(data?.isSaved ? 'Removed from saved' : 'Job saved!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api.post(`/jobs/${data.id}/apply`, { resumeId: selectedResumeId || undefined, coverLetter, answers: [] }),
    onSuccess: () => {
      setApplyOpen(false);
      qc.invalidateQueries({ queryKey: ['job', slug] });
      toast.success('Application submitted!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <JobDetailSkeleton />;
  if (error || !data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Job not found or no longer available.</p>
      <Link to="/jobs" className="text-brand-600 text-sm mt-2 inline-block">← Back to jobs</Link>
    </div>
  );

  const job = data;
  const jobUrl = `${BASE_URL}/jobs/${job.slug}`;
  const salaryText = job.salaryMin && job.salaryMax
    ? `AED ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}/mo`
    : null;
  const metaDesc = job.metaDescription ||
    `${job.title} at ${job.employer.companyName} in ${EMIRATES_LABELS[job.emirate as Emirates] || job.emirate}, UAE. ${salaryText ? salaryText + '.' : ''} Apply now on DdotsmediaJobs.`;

  return (
    <>
      <SEOHead
        title={job.metaTitle || `${job.title} at ${job.employer.companyName}`}
        description={metaDesc}
        ogTitle={`${job.title} – ${job.employer.companyName} | DdotsmediaJobs`}
        ogDescription={metaDesc}
        ogImage={job.employer.logoUrl || undefined}
        ogUrl={jobUrl}
        ogType="article"
        canonical={jobUrl}
        jsonLd={buildJobPostingSchema({
          title: job.title,
          description: job.description,
          slug: job.slug,
          publishedAt: job.publishedAt,
          expiresAt: job.expiresAt,
          employmentType: job.employmentType,
          workMode: job.workMode,
          emirate: job.emirate,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          skills: job.skills,
          employer: job.employer,
          category: job.category,
        })}
      />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              {job.employer.logoUrl ? (
                <img src={job.employer.logoUrl} alt={job.employer.companyName} className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-gray-50" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-brand-50 flex items-center justify-center text-2xl font-bold text-brand-600 flex-shrink-0">
                  {job.employer.companyName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                <Link to={`/companies/${job.employer.slug}`} className="text-brand-600 text-sm hover:underline">
                  {job.employer.companyName}
                </Link>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.isFeatured && <Badge color="yellow">Featured</Badge>}
                  {job.isUrgent && <Badge color="red">Urgent</Badge>}
                  <Badge color="blue">{EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType]}</Badge>
                  {job.level && <Badge color="gray">{job.level}</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
              {[
                { icon: MapPin, label: EMIRATES_LABELS[job.emirate as Emirates] || job.emirate },
                { icon: Briefcase, label: WORK_MODE_LABELS[job.workMode as WorkMode] },
                { icon: DollarSign, label: job.salaryMin && job.salaryMax ? `AED ${fmt(job.salaryMin)}–${fmt(job.salaryMax)}` : job.salaryNegotiable ? 'Negotiable' : 'Not specified' },
                { icon: Clock, label: `${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : '+'} yrs exp` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Job Description</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>

          {job.requirements && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Requirements</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          {job.benefits && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Benefits</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.benefits}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            {job.myApplication ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">You applied to this job</p>
                <ApplicationStatusBadge status={job.myApplication.status} />
              </div>
            ) : user?.role === 'SEEKER' ? (
              <>
                <Button className="w-full mb-3" onClick={() => setApplyOpen(true)}>
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  icon={job.isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  onClick={() => saveMutation.mutate()}
                  loading={saveMutation.isPending}
                >
                  {job.isSaved ? 'Saved' : 'Save Job'}
                </Button>
              </>
            ) : !user ? (
              <Link to="/login" className="w-full">
                <Button className="w-full">Sign in to Apply</Button>
              </Link>
            ) : null}

            {user && (
              <button
                onClick={() => {/* report modal */ }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-3 w-full justify-center transition-colors"
              >
                <Flag className="h-3 w-3" /> Report this job
              </button>
            )}
          </div>

          {/* AI Match Score — seekers only */}
          {user?.role === 'SEEKER' && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-violet-600" />
                <h3 className="font-semibold text-violet-900 text-sm">AI Match Score</h3>
              </div>
              {!matchFetched ? (
                <div className="text-center">
                  <p className="text-xs text-violet-700 mb-3">See how well your profile matches this job</p>
                  <button
                    onClick={() => fetchMatch()}
                    disabled={matchLoading}
                    className="flex items-center gap-2 mx-auto bg-violet-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {matchLoading ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
                    {matchLoading ? 'Analyzing...' : 'Check My Match'}
                  </button>
                </div>
              ) : matchData ? (
                <div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold text-violet-900">{matchData.overallScore}</span>
                    <span className="text-gray-400 text-sm mb-1">/100</span>
                  </div>
                  <p className="text-xs font-semibold text-violet-700 mb-2">{matchData.label}</p>
                  <div className="w-full bg-violet-200 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      style={{ width: `${matchData.overallScore}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white/70 rounded-lg p-2 text-center">
                      <p className="font-bold text-violet-900">{matchData.skillsMatch}%</p>
                      <p className="text-gray-500">Skills Match</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2 text-center">
                      <p className="font-bold text-violet-900">{matchData.experienceMatch}%</p>
                      <p className="text-gray-500">Experience</p>
                    </div>
                  </div>
                  {matchData.matchingPoints?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                      {matchData.matchingPoints.slice(0, 2).map((p: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600">✓ {p}</p>
                      ))}
                    </div>
                  )}
                  {matchData.gaps?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-red-600 mb-1">Gaps</p>
                      {matchData.gaps.slice(0, 2).map((g: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600">✗ {g}</p>
                      ))}
                    </div>
                  )}
                  {matchData.advice && (
                    <p className="text-xs text-violet-700 bg-violet-100 rounded-lg p-2 italic">{matchData.advice}</p>
                  )}
                  <button onClick={() => fetchMatch()} className="mt-2 text-xs text-violet-500 hover:underline">Refresh</button>
                </div>
              ) : (
                <p className="text-xs text-red-500">Could not load match score. Complete your profile first.</p>
              )}
            </div>
          )}

          {/* Job details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Job Details</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Visa', VISA_STATUS_LABELS[job.visaStatus as VisaStatus]],
                ['Location', job.location || EMIRATES_LABELS[job.emirate as Emirates]],
                ['Category', job.category.name],
                ['Posted', job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'N/A'],
                ['Applications', job._count?.applications ?? 0],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-900 font-medium">{v as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {(Array.isArray(job.skills) ? job.skills : []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(job.skills) ? job.skills as string[] : []).map((s: string) => <Badge key={s} color="gray">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Social share */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SocialShare
              jobId={job.id}
              url={jobUrl}
              title={`${job.title} at ${job.employer.companyName} – ${EMIRATES_LABELS[job.emirate as Emirates] || job.emirate}, UAE`}
              description={metaDesc}
              utmCampaign="job-detail-share"
            />
          </div>
        </div>
      </div>

      {/* Apply modal */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for this position">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
            {resumes?.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {resumes.map((r: { id: string; fileName: string; isPrimary: boolean }) => (
                  <option key={r.id} value={r.id}>
                    {r.fileName} {r.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-500">
                No resume uploaded. <Link to="/profile" className="text-brand-600 underline">Upload one first.</Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the employer why you're a great fit..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={applyMutation.isPending} onClick={() => applyMutation.mutate()}>
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
}
