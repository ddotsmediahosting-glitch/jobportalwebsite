import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Upload, Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { employerProfileSchema, EmployerProfileInput, EMIRATES_LABELS } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000', label: '501–1,000 employees' },
  { value: '1001+', label: '1,001+ employees' },
];

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Real Estate', 'Construction',
  'Retail & E-commerce', 'Hospitality & Tourism', 'Education', 'Oil & Gas',
  'Logistics & Supply Chain', 'Media & Marketing', 'Legal', 'Government', 'Other',
];

function CompanyProfileSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Page title */}
      <div className="skeleton h-7 rounded w-44" />

      {/* Cover / logo card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="skeleton h-36 w-full rounded-none" />
        <div className="px-6 pb-6 pt-0">
          <div className="flex items-end gap-4 -mt-8">
            <div className="skeleton h-20 w-20 rounded-xl flex-shrink-0" />
            <div className="pb-1 space-y-2">
              <div className="skeleton h-5 rounded w-40" />
              <div className="skeleton h-4 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Form fields card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="skeleton h-5 rounded w-44" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`space-y-1.5 ${i === 6 || i === 7 ? 'sm:col-span-2' : ''}`}>
              <div className="skeleton h-3.5 rounded w-28" />
              <div className="skeleton h-10 rounded-lg w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5 mt-4">
          <div className="skeleton h-3.5 rounded w-40" />
          <div className="skeleton h-28 rounded-lg w-full" />
        </div>
      </div>

      {/* Save button */}
      <div className="skeleton h-10 rounded-lg w-32" />

      {/* Trade license card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="skeleton h-4 rounded w-44" />
            <div className="skeleton h-3.5 rounded w-64" />
          </div>
          <div className="skeleton h-9 rounded-lg w-32" />
        </div>
        <div className="skeleton h-12 rounded-lg w-full" />
      </div>
    </div>
  );
}

function VerificationStatusBanner({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800">Company Verified</p>
          <p className="text-sm text-green-600">Your company profile has been verified by our team.</p>
        </div>
      </div>
    );
  }
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-800">Verification Rejected</p>
          <p className="text-sm text-red-600">Please update your trade license and resubmit for verification.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
      <div>
        <p className="font-medium text-amber-800">Pending Verification</p>
        <p className="text-sm text-amber-600">Your profile is under review. Verified employers get more visibility.</p>
      </div>
    </div>
  );
}

export function CompanyProfile() {
  const qc = useQueryClient();

  const { data: employer, isLoading } = useQuery({
    queryKey: ['employer-profile'],
    queryFn: () => api.get('/employer/profile').then((r) => r.data.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<EmployerProfileInput>({
    resolver: zodResolver(employerProfileSchema),
    values: employer,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmployerProfileInput) => api.put('/employer/profile', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); toast.success('Profile updated!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('logo', file);
      return api.post('/employer/profile/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); toast.success('Logo uploaded!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('cover', file);
      return api.post('/employer/profile/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); toast.success('Cover image uploaded!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const uploadLicenseMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('license', file);
      return api.post('/employer/profile/license', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); toast.success('Trade license uploaded! Under review.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <CompanyProfileSkeleton />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h1>
      <div className="space-y-6">
        {employer?.verificationStatus && (
          <VerificationStatusBanner status={employer.verificationStatus} />
        )}

        {/* Cover & Logo */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="relative h-36 bg-gradient-to-r from-brand-50 to-brand-100">
            {employer?.coverUrl && (
              <img src={employer.coverUrl} alt="Cover" className="w-full h-full object-cover" />
            )}
            <label className="absolute bottom-3 right-3 cursor-pointer">
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCoverMutation.mutate(f); e.target.value = ''; }} />
              <span className="inline-flex items-center gap-1.5 text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors shadow-sm">
                <Upload className="h-3.5 w-3.5" /> Cover photo
              </span>
            </label>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="flex items-end gap-4 -mt-8">
              <div className="relative flex-shrink-0">
                <div className="h-20 w-20 rounded-xl border-4 border-white bg-brand-50 flex items-center justify-center text-brand-600 text-2xl font-bold shadow-sm overflow-hidden">
                  {employer?.logoUrl ? <img src={employer.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="h-8 w-8" />}
                </div>
                <label className="absolute -bottom-1 -right-1 cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMutation.mutate(f); e.target.value = ''; }} />
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow">
                    <Upload className="h-3 w-3" />
                  </span>
                </label>
              </div>
              <div className="pb-1">
                <h2 className="font-semibold text-gray-900">{employer?.companyName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employer?.verificationStatus === 'VERIFIED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {employer?.verificationStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company info form */}
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input {...register('companyName')} label="Company Name" error={errors.companyName?.message} required />
              <Input {...register('website')} label="Website" type="url" placeholder="https://acme.ae" error={errors.website?.message} />
              <Select {...register('industry')} label="Industry" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} placeholder="Select industry" error={errors.industry?.message} />
              <Select {...register('companySize')} label="Company Size" options={COMPANY_SIZES} placeholder="Select size" error={errors.companySize?.message} />
              <Input {...register('foundedYear')} label="Founded Year" type="number" min={1900} max={new Date().getFullYear()} error={errors.foundedYear?.message} />
              <Select {...register('emirate')} label="Emirate" options={emirateOptions} placeholder="Select emirate" error={errors.emirate?.message} />
              <Input {...register('location')} label="Office Location" placeholder="DIFC, Dubai" className="sm:col-span-2" error={errors.location?.message} />
              <Input {...register('tradeLicenseNumber')} label="Trade License Number" placeholder="CN-1234567" className="sm:col-span-2" error={errors.tradeLicenseNumber?.message} />
            </div>
            <div className="mt-4">
              <Textarea {...register('description')} label="Company Description" rows={5} placeholder="Tell candidates about your company, culture, and what makes you a great place to work..." error={errors.description?.message} />
            </div>
          </div>
          <Button type="submit" loading={updateMutation.isPending} className="w-full sm:w-auto">Save Profile</Button>
        </form>

        {/* Trade License */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Trade License Document</h2>
              <p className="text-sm text-gray-500 mt-0.5">Upload your UAE trade license for employer verification (PDF, JPG, PNG).</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLicenseMutation.mutate(f); e.target.value = ''; }} />
              <Button variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} loading={uploadLicenseMutation.isPending} type="button">
                Upload License
              </Button>
            </label>
          </div>
          {employer?.tradeLicenseUrl ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building2 className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-medium text-gray-900 flex-1">Trade License Uploaded</p>
              <a href={employer.tradeLicenseUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View</a>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No trade license uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
