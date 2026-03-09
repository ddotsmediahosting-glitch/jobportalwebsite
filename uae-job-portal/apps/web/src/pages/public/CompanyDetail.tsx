import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, MapPin, Users, Globe, Calendar, Briefcase,
  CheckCircle, ArrowLeft, ExternalLink, Clock, DollarSign, Star, ThumbsUp, MessageSquarePlus
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const EMIRATE_LABELS: Record<string, string> = {
  ABU_DHABI: 'Abu Dhabi', DUBAI: 'Dubai', SHARJAH: 'Sharjah',
  AJMAN: 'Ajman', UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah', FUJAIRAH: 'Fujairah',
};

interface CompanyJob {
  id: string;
  title: string;
  slug: string;
  emirate: string;
  workMode: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryNegotiable?: boolean;
  publishedAt?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  level?: string;
  skills: string[];
  category: { name: string };
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatSalary(min?: number, max?: number, currency = 'AED', negotiable = false) {
  if (negotiable && !min && !max) return 'Negotiable';
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return null;
}

function JobRow({ job }: { job: CompanyJob }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryNegotiable);
  return (
    <Link
      to={`/jobs/${job.slug}`}
      className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 hover:shadow-sm hover:border-brand-300 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors text-sm">{job.title}</h3>
          {job.isUrgent && <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Urgent</span>}
          {job.isFeatured && <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-full">Featured</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {EMIRATE_LABELS[job.emirate] || job.emirate}
          </span>
          <span>{job.workMode}</span>
          <span>{job.employmentType.replace('_', ' ')}</span>
          {salary && (
            <span className="flex items-center gap-1 text-green-700">
              <DollarSign size={11} /> {salary}
            </span>
          )}
          {job.category && <span className="text-gray-400">{job.category.name}</span>}
          {job.publishedAt && <span className="text-gray-400">{timeAgo(job.publishedAt)}</span>}
        </div>
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-brand-600 font-medium whitespace-nowrap mt-0.5">View →</span>
    </Link>
  );
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => !readonly && onChange?.(s)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          <Star
            size={readonly ? 14 : 20}
            className={s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? (value / 5) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-500 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full">
        <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-semibold text-gray-700 w-6 text-right">{value ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

export function CompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: '', pros: '', cons: '', rating: 0,
    workLifeBalance: 0, salaryBenefits: 0, management: 0, careerGrowth: 0,
    jobTitle: '', employmentStatus: 'CURRENT', isAnonymous: true,
  });
  const [reviewPage, setReviewPage] = useState(1);

  const { data: employer, isLoading, isError } = useQuery({
    queryKey: ['employer', slug],
    queryFn: () => api.get(`/employers/${slug}`).then((r) => r.data.data),
    enabled: !!slug,
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['employer-reviews', slug, reviewPage],
    queryFn: () => api.get(`/employers/${slug}/reviews?page=${reviewPage}&limit=5`).then((r) => r.data.data),
    enabled: !!slug,
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post(`/employers/${slug}/reviews`, reviewForm),
    onSuccess: () => {
      toast.success('Review submitted! Thank you.');
      setReviewOpen(false);
      refetchReviews();
      setReviewForm({ title: '', pros: '', cons: '', rating: 0, workLifeBalance: 0, salaryBenefits: 0, management: 0, careerGrowth: 0, jobTitle: '', employmentStatus: 'CURRENT', isAnonymous: true });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const helpfulMutation = useMutation({
    mutationFn: (reviewId: string) => api.post(`/reviews/${reviewId}/helpful`),
    onSuccess: () => { refetchReviews(); toast.success('Marked as helpful'); },
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !employer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900">Company not found</h2>
          <Link to="/companies" className="text-brand-600 text-sm mt-2 inline-block">← Back to companies</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative">
        <div
          className="h-48 bg-gradient-to-r from-brand-800 to-indigo-700"
          style={employer.coverUrl ? { backgroundImage: `url(${employer.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        <div className="absolute inset-0 bg-black/30" />
        <Link to="/companies" className="absolute top-4 left-8 flex items-center gap-1 text-white/80 hover:text-white text-sm z-10">
          <ArrowLeft size={14} /> Companies
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 pb-12">
        {/* Logo + Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {employer.logoUrl ? (
                <img src={employer.logoUrl} alt={employer.companyName} className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="h-9 w-9 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{employer.companyName}</h1>
                  {employer.industry && (
                    <p className="text-brand-600 font-medium text-sm mt-0.5">{employer.industry}</p>
                  )}
                </div>
                {employer.verificationStatus === 'APPROVED' && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {employer.emirate && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    {EMIRATE_LABELS[employer.emirate] || employer.emirate}
                    {employer.location && `, ${employer.location}`}
                  </span>
                )}
                {employer.companySize && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    {employer.companySize} employees
                  </span>
                )}
                {employer.foundedYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    Founded {employer.foundedYear}
                  </span>
                )}
                {employer.website && (
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700"
                  >
                    <Globe size={14} />
                    Website <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {employer.description && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">About {employer.companyName}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{employer.description}</p>
            </div>
          )}
        </div>

        {/* Open Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-600" />
              Open Positions
              <span className="text-sm font-normal text-gray-400">({employer.jobs?.length || 0})</span>
            </h2>
            <Link to={`/jobs`} className="text-sm text-brand-600 hover:text-brand-700">
              View all jobs →
            </Link>
          </div>

          {!employer.jobs?.length ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No open positions at the moment.</p>
              <p className="text-sm mt-1">Check back soon or browse other companies.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(employer.jobs as CompanyJob[]).map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* ── Reviews section ─────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              Company Reviews
              {reviewsData?.stats?.totalReviews > 0 && (
                <span className="text-sm font-normal text-gray-400">({reviewsData.stats.totalReviews})</span>
              )}
            </h2>
            {user && (
              <button
                onClick={() => setReviewOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-400 px-3 py-1.5 rounded-lg transition-all"
              >
                <MessageSquarePlus size={14} /> Write Review
              </button>
            )}
          </div>

          {/* Rating overview */}
          {reviewsData?.stats?.totalReviews > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
              <div className="flex items-center gap-8 flex-wrap">
                <div className="text-center">
                  <p className="text-5xl font-extrabold text-gray-900">{reviewsData.stats.avgRating?.toFixed(1) || '—'}</p>
                  <StarRating value={Math.round(reviewsData.stats.avgRating || 0)} readonly />
                  <p className="text-xs text-gray-400 mt-1">{reviewsData.stats.totalReviews} reviews</p>
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <RatingBar label="Work-Life Balance" value={reviewsData.stats.avgWorkLifeBalance} />
                  <RatingBar label="Salary & Benefits" value={reviewsData.stats.avgSalaryBenefits} />
                  <RatingBar label="Management" value={reviewsData.stats.avgManagement} />
                  <RatingBar label="Career Growth" value={reviewsData.stats.avgCareerGrowth} />
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <div key={r} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-3">{r}</span>
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <div className="w-24 h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 rounded-full bg-yellow-400"
                          style={{ width: `${reviewsData.stats.totalReviews > 0 ? ((reviewsData.stats.ratingDistribution?.[r] || 0) / reviewsData.stats.totalReviews) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-gray-400">{reviewsData.stats.ratingDistribution?.[r] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Review cards */}
          <div className="space-y-4">
            {reviewsData?.items?.map((review: {
              id: string; title: string; pros: string; cons: string; rating: number;
              workLifeBalance: number; salaryBenefits: number; management: number; careerGrowth: number;
              jobTitle: string | null; employmentStatus: string; isAnonymous: boolean; helpfulCount: number;
              createdAt: string;
              reviewer: { id: string; name: string; avatarUrl: string | null };
            }) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {review.reviewer.avatarUrl ? (
                      <img src={review.reviewer.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm">
                        {review.reviewer.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.reviewer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {review.jobTitle && <span>{review.jobTitle}</span>}
                        <span className="capitalize">{review.employmentStatus.toLowerCase()} employee</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <StarRating value={review.rating} readonly />
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>

                <div className="grid sm:grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Pros</p>
                    <p className="text-gray-600 leading-relaxed">{review.pros}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">Cons</p>
                    <p className="text-gray-600 leading-relaxed">{review.cons}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-3 text-xs text-gray-400">
                    {[
                      ['WLB', review.workLifeBalance],
                      ['Salary', review.salaryBenefits],
                      ['Mgmt', review.management],
                      ['Growth', review.careerGrowth],
                    ].map(([label, val]) => (
                      <span key={label as string}>{label as string}: <strong className="text-gray-700">{val as number}/5</strong></span>
                    ))}
                  </div>
                  <button
                    onClick={() => helpfulMutation.mutate(review.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors"
                  >
                    <ThumbsUp size={12} /> Helpful ({review.helpfulCount})
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!reviewsData?.items?.length && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>No reviews yet.</p>
              {user ? (
                <button onClick={() => setReviewOpen(true)} className="text-brand-600 text-sm underline mt-1">
                  Be the first to review {employer.companyName}
                </button>
              ) : (
                <Link to="/login" className="text-brand-600 text-sm underline mt-1 inline-block">
                  Sign in to write a review
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {reviewsData?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(reviewsData.totalPages)].map((_: unknown, i: number) => (
                <button
                  key={i}
                  onClick={() => setReviewPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${reviewPage === i + 1 ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Review {employer.companyName}</h3>
              <button onClick={() => setReviewOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
                <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
              </div>
              {[
                { key: 'workLifeBalance', label: 'Work-Life Balance' },
                { key: 'salaryBenefits', label: 'Salary & Benefits' },
                { key: 'management', label: 'Management' },
                { key: 'careerGrowth', label: 'Career Growth' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">{field.label}</label>
                  <StarRating
                    value={reviewForm[field.key as keyof typeof reviewForm] as number}
                    onChange={(v) => setReviewForm({ ...reviewForm, [field.key]: v })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Title *</label>
                <input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Sum up your experience..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pros *</label>
                <textarea
                  value={reviewForm.pros}
                  onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="What did you like about working here?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cons *</label>
                <textarea
                  value={reviewForm.cons}
                  onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="What could be improved?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    value={reviewForm.jobTitle}
                    onChange={(e) => setReviewForm({ ...reviewForm, jobTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Your role"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={reviewForm.employmentStatus}
                    onChange={(e) => setReviewForm({ ...reviewForm, employmentStatus: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="CURRENT">Current Employee</option>
                    <option value="FORMER">Former Employee</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={reviewForm.isAnonymous}
                  onChange={(e) => setReviewForm({ ...reviewForm, isAnonymous: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Post anonymously
              </label>
              <button
                onClick={() => reviewMutation.mutate()}
                disabled={!reviewForm.title || !reviewForm.pros || !reviewForm.cons || reviewForm.rating === 0 || reviewMutation.isPending}
                className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
