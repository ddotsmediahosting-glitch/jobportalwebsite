import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Search, X, ChevronRight, Tag } from 'lucide-react';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@uaejobs/shared';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));
const workModeOptions = Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({ value, label }));
const employmentTypeOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  _count?: { jobs: number };
  children?: { id: string; name: string; slug: string; _count?: { jobs: number } }[];
}

interface FilterValues {
  q: string;
  categoryId: string;
  subcategoryId: string;
  emirate: string;
  workMode: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
  isEmiratization: boolean;
}

interface JobFiltersProps {
  values: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  categories?: CategoryNode[];
}

export function JobFilters({ values, onChange, categories = [] }: JobFiltersProps) {
  const { register, handleSubmit, reset, control, setValue } = useForm<FilterValues>({
    defaultValues: {
      q: values.q || '',
      categoryId: values.categoryId || '',
      subcategoryId: values.subcategoryId || '',
      emirate: values.emirate || '',
      workMode: values.workMode || '',
      employmentType: values.employmentType || '',
      salaryMin: values.salaryMin || '',
      salaryMax: values.salaryMax || '',
      isEmiratization: values.isEmiratization === 'true',
    },
  });

  const selectedCategoryId = useWatch({ control, name: 'categoryId' });

  // Reset subcategory when parent category changes
  useEffect(() => {
    setValue('subcategoryId', '');
  }, [selectedCategoryId, setValue]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.children ?? [];

  const onSubmit = (data: FilterValues) => {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'isEmiratization') {
        if (v === true) cleaned[k] = 'true';
      } else if (v !== '' && v !== undefined) {
        cleaned[k] = String(v);
      }
    }
    onChange(cleaned);
  };

  const handleClear = () => {
    reset({ q: '', categoryId: '', subcategoryId: '', emirate: '', workMode: '', employmentType: '', salaryMin: '', salaryMax: '', isEmiratization: false });
    onChange({});
  };

  const hasActiveFilters = Object.entries(values).some(([k, v]) => k !== 'page' && v);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Search size={14} className="text-brand-500" /> Filter Jobs
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Keyword search */}
        <Input
          {...register('q')}
          label="Keywords"
          placeholder="Job title, skills, company..."
          leftIcon={<Search size={13} />}
        />

        {/* ── Category & Subcategory ─────────────────── */}
        {categories.length > 0 && (
          <div className="space-y-2.5">
            {/* Section label */}
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-brand-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</span>
            </div>

            {/* Parent category dropdown */}
            <select
              {...register('categoryId')}
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent hover:border-gray-300 transition-all duration-150"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}{cat._count?.jobs ? ` (${cat._count.jobs})` : ''}
                </option>
              ))}
            </select>

            {/* Subcategory dropdown — only when parent is selected and has children */}
            {selectedCategoryId && subcategories.length > 0 && (
              <div className="pl-3 border-l-2 border-brand-100 animate-slide-down">
                <div className="flex items-center gap-1 mb-1.5">
                  <ChevronRight size={10} className="text-brand-400" />
                  <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide">
                    {selectedCategory?.name}
                  </span>
                </div>
                <select
                  {...register('subcategoryId')}
                  className="block w-full rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-2.5 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent hover:border-brand-200 transition-all duration-150"
                >
                  <option value="">All {selectedCategory?.name}</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}{sub._count?.jobs ? ` (${sub._count.jobs})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick-pick chips when nothing is selected */}
            {!selectedCategoryId && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('categoryId', cat.id)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all duration-150"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active category chip with clear */}
            {selectedCategoryId && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full">
                  {selectedCategory?.name}
                  <button
                    type="button"
                    onClick={() => setValue('categoryId', '')}
                    className="ml-0.5 hover:text-brand-900 transition-colors"
                  >
                    <X size={9} />
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-50" />

        {/* Location */}
        <Select
          {...register('emirate')}
          label="Emirate"
          options={emirateOptions}
          placeholder="All Emirates"
        />

        {/* Work Mode */}
        <Select
          {...register('workMode')}
          label="Work Mode"
          options={workModeOptions}
          placeholder="Any Mode"
        />

        {/* Employment Type */}
        <Select
          {...register('employmentType')}
          label="Employment Type"
          options={employmentTypeOptions}
          placeholder="Any Type"
        />

        {/* Salary range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range <span className="text-gray-400 font-normal">(AED/month)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input {...register('salaryMin')} type="number" placeholder="Min" />
            <Input {...register('salaryMax')} type="number" placeholder="Max" />
          </div>
        </div>

        {/* Emiratization filter */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register('isEmiratization')}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-medium text-gray-800 group-hover:text-brand-700 transition-colors">
              🇦🇪 Emiratization only
            </span>
            <p className="text-[10px] text-gray-400 leading-tight">UAE nationals preferred roles</p>
          </div>
        </label>

        <Button type="submit" className="w-full" icon={<Search size={14} />}>
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
