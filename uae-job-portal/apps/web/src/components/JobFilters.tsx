import React from 'react';
import { useForm } from 'react-hook-form';
import { Search, X } from 'lucide-react';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@uaejobs/shared';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));
const workModeOptions = Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({ value, label }));
const employmentTypeOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface FilterValues {
  q: string;
  emirate: string;
  workMode: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
}

interface JobFiltersProps {
  values: Partial<FilterValues>;
  onChange: (filters: Partial<FilterValues>) => void;
  categories?: { id: string; name: string }[];
}

export function JobFilters({ values, onChange, categories }: JobFiltersProps) {
  const { register, handleSubmit, reset } = useForm<FilterValues>({ defaultValues: values as FilterValues });

  const onSubmit = (data: FilterValues) => {
    // Remove empty strings
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
    );
    onChange(cleaned);
  };

  const handleClear = () => {
    reset({ q: '', emirate: '', workMode: '', employmentType: '', salaryMin: '', salaryMax: '' });
    onChange({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button type="button" onClick={handleClear} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1">
          <X className="h-3 w-3" /> Clear all
        </button>
      </div>

      <Input
        {...register('q')}
        placeholder="Keywords, skills, job title..."
        className="pr-10"
      />

      <Select
        {...register('emirate')}
        label="Emirate"
        options={emirateOptions}
        placeholder="All Emirates"
      />

      <Select
        {...register('workMode')}
        label="Work Mode"
        options={workModeOptions}
        placeholder="All Modes"
      />

      <Select
        {...register('employmentType')}
        label="Employment Type"
        options={employmentTypeOptions}
        placeholder="All Types"
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          {...register('salaryMin')}
          label="Min Salary (AED)"
          type="number"
          placeholder="5,000"
        />
        <Input
          {...register('salaryMax')}
          label="Max Salary (AED)"
          type="number"
          placeholder="50,000"
        />
      </div>

      <Button type="submit" className="w-full" icon={<Search className="h-4 w-4" />}>
        Search Jobs
      </Button>
    </form>
  );
}
