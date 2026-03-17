import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Upload, Trash2, Star } from 'lucide-react';
import { seekerProfileSchema, SeekerProfileInput, EMIRATES_LABELS } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton h-8 rounded w-40 mb-6" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="skeleton h-5 rounded w-48" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(6)].map((__, j) => (
              <div key={j} className="space-y-1.5">
                <div className="skeleton h-3.5 rounded w-24" />
                <div className="skeleton h-10 rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="skeleton h-10 rounded-xl w-36" />
    </div>
  );
}

export function Profile() {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/seeker/profile').then((r) => r.data.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SeekerProfileInput>({
    resolver: zodResolver(seekerProfileSchema),
    values: profile,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SeekerProfileInput) => api.put('/seeker/profile', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); toast.success('Profile updated!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const uploadResumeMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('resume', file);
      return api.post('/seeker/resumes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); toast.success('Resume uploaded!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/seeker/resumes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); toast.success('Resume deleted'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const primaryResumeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/seeker/resumes/${id}/primary`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); toast.success('Primary resume updated'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('firstName')} label="First Name" error={errors.firstName?.message} required />
            <Input {...register('lastName')} label="Last Name" error={errors.lastName?.message} required />
            <Input {...register('headline')} label="Professional Headline" placeholder="Senior Developer | React & Node.js" />
            <Select {...register('emirate')} label="Current Emirate" options={emirateOptions} placeholder="Select emirate" />
            <Input {...register('location')} label="Location" placeholder="Business Bay, Dubai" />
            <Input {...register('nationality')} label="Nationality" placeholder="UAE" />
          </div>
          <div className="mt-4">
            <Textarea {...register('bio')} label="Bio / About me" rows={3} placeholder="Tell employers about yourself..." />
          </div>
        </div>

        {/* Career preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Career Preferences</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('desiredRole')} label="Desired Job Title" />
            <Input {...register('yearsOfExperience')} label="Years of Experience" type="number" min={0} />
            <Input {...register('desiredSalaryMin')} label="Min Expected Salary (AED)" type="number" />
            <Input {...register('desiredSalaryMax')} label="Max Expected Salary (AED)" type="number" />
            <Input {...register('noticePeriod')} label="Notice Period" placeholder="1 month / Immediate" />
            <Input {...register('linkedInUrl')} label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>

        <Button type="submit" loading={updateMutation.isPending} className="w-full sm:w-auto">
          Save Profile
        </Button>
      </form>

      {/* Resumes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Resumes / CVs</h2>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadResumeMutation.mutate(file);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} loading={uploadResumeMutation.isPending} type="button">
              Upload CV
            </Button>
          </label>
        </div>

        {!profile?.resumes?.length ? (
          <p className="text-sm text-gray-400 text-center py-6">No resumes uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {profile.resumes.map((r: { id: string; fileName: string; fileUrl: string; isPrimary: boolean; createdAt: string }) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {r.isPrimary && <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                <a href={r.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-sm text-brand-600 hover:underline truncate">
                  {r.fileName}
                </a>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                {!r.isPrimary && (
                  <button
                    onClick={() => primaryResumeMutation.mutate(r.id)}
                    className="text-xs text-gray-500 hover:text-brand-600"
                    title="Set as primary"
                  >
                    Set primary
                  </button>
                )}
                <button
                  onClick={() => deleteResumeMutation.mutate(r.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
