import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../lib/api';
import { createJobSchema, CreateJobInput, EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, VISA_STATUS_LABELS, JOB_LEVEL_OPTIONS } from '@uaejobs/shared';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));
const workModeOptions = Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({ value, label }));
const employmentOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const visaOptions = Object.entries(VISA_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const levelOptions = JOB_LEVEL_OPTIONS.map((l) => ({ value: l, label: l }));

export function PostJob() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditing = !!id;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const { data: existingJob, isLoading: jobLoading } = useQuery({
    queryKey: ['employer-job', id],
    queryFn: () => api.get(`/employer/jobs?id=${id}`).then((r) => r.data.data.items?.[0]),
    enabled: isEditing,
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(existingJob?.skills || []);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    values: existingJob as CreateJobInput,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateJobInput) =>
      isEditing ? api.put(`/employer/jobs/${id}`, { ...data, skills }) : api.post('/employer/jobs', { ...data, skills }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['employer-jobs'] });
      toast.success(isEditing ? 'Job updated!' : 'Job created!');
      navigate('/employer/jobs');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  // Flatten categories for select
  const flatCats = categories ? categories.flatMap((c: { id: string; name: string; children?: { id: string; name: string }[] }) =>
    c.children?.length
      ? c.children.map((ch: { id: string; name: string }) => ({ value: ch.id, label: `${c.name} › ${ch.name}` }))
      : [{ value: c.id, label: c.name }]
  ) : [];

  if (isEditing && jobLoading) return <PageSpinner />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Job' : 'Post a New Job'}</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, skills }))} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <Input {...register('title')} label="Job Title" placeholder="Senior Software Engineer" error={errors.title?.message} required />
          <Select {...register('categoryId')} label="Category" options={flatCats} placeholder="Select category" error={errors.categoryId?.message} required />
          <Select {...register('emirate')} label="Emirate" options={emirateOptions} error={errors.emirate?.message} required />
          <Input {...register('location')} label="Location" placeholder="Business Bay, Dubai" />
        </div>

        {/* Job type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Type</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select {...register('workMode')} label="Work Mode" options={workModeOptions} required />
            <Select {...register('employmentType')} label="Employment Type" options={employmentOptions} required />
            <Select {...register('visaStatus')} label="Visa Status" options={visaOptions} required />
            <Select {...register('level')} label="Seniority Level" options={levelOptions} placeholder="Select level" />
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Salary</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('salaryMin', { valueAsNumber: true })} label="Salary Min (AED)" type="number" placeholder="10000" />
            <Input {...register('salaryMax', { valueAsNumber: true })} label="Salary Max (AED)" type="number" placeholder="20000" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('salaryNegotiable')} className="rounded" />
            Salary is negotiable
          </label>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Experience</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('experienceMin', { valueAsNumber: true })} label="Min Experience (years)" type="number" min={0} placeholder="2" />
            <Input {...register('experienceMax', { valueAsNumber: true })} label="Max Experience (years)" type="number" placeholder="7" />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Description</h2>
          <Textarea {...register('description')} label="Job Description" rows={10} placeholder="Describe the role, responsibilities, and what you're looking for..." error={errors.description?.message} required />
          <Textarea {...register('requirements')} label="Requirements (optional)" rows={5} placeholder="List specific requirements..." />
          <Textarea {...register('benefits')} label="Benefits & Perks (optional)" rows={4} placeholder="Health insurance, annual leave, etc..." />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/employer/jobs')}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Update Job' : 'Save as Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
