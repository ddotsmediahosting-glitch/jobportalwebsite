import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MapPin, Briefcase, DollarSign, Clock, Users, Bookmark, BookmarkCheck, ExternalLink, Flag, ChevronLeft,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, VISA_STATUS_LABELS,
  Emirates, WorkMode, EmploymentType, VisaStatus,
} from '@uaejobs/shared';

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

  if (isLoading) return <PageSpinner />;
  if (error || !data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Job not found or no longer available.</p>
      <Link to="/jobs" className="text-brand-600 text-sm mt-2 inline-block">← Back to jobs</Link>
    </div>
  );

  const job = data;

  return (
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
                <Link to={`/employers/${job.employer.slug}`} className="text-brand-600 text-sm hover:underline">
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
          {job.skills?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s: string) => <Badge key={s} color="gray">{s}</Badge>)}
              </div>
            </div>
          )}
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
  );
}
