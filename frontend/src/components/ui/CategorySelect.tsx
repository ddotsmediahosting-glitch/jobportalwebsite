import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

interface CategorySelectProps {
  value: string; // always the final categoryId sent to backend
  onChange: (categoryId: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Two-level cascading category selector.
 * - Selecting a parent with children shows a subcategory dropdown.
 * - The value emitted is always the lowest-selected category ID.
 * - If a parent has no children, selecting it is final.
 */
export function CategorySelect({ value, onChange, error, required, disabled }: CategorySelectProps) {
  const { data: categories = [] } = useQuery<CategoryNode[]>({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  // Derive initial parent/sub from the incoming value
  const findParentAndSub = (id: string): { parentId: string; subId: string } => {
    if (!id) return { parentId: '', subId: '' };
    for (const cat of categories) {
      if (cat.id === id) return { parentId: id, subId: '' };
      const sub = cat.children?.find((c) => c.id === id);
      if (sub) return { parentId: cat.id, subId: id };
    }
    return { parentId: '', subId: '' };
  };

  const [parentId, setParentId] = useState('');
  const [subId, setSubId] = useState('');

  // Sync from external value (e.g. when editing existing job)
  useEffect(() => {
    if (!categories.length) return;
    const { parentId: p, subId: s } = findParentAndSub(value);
    setParentId(p);
    setSubId(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, categories]);

  const selectedParent = categories.find((c) => c.id === parentId);
  const subcategories = selectedParent?.children ?? [];

  const handleParentChange = (newParentId: string) => {
    setParentId(newParentId);
    setSubId('');
    const parent = categories.find((c) => c.id === newParentId);
    // If parent has no children, emit it directly
    if (!parent?.children?.length) {
      onChange(newParentId);
    } else {
      // Don't emit yet — wait for subcategory selection
      onChange('');
    }
  };

  const handleSubChange = (newSubId: string) => {
    setSubId(newSubId);
    onChange(newSubId);
  };

  const baseClass =
    'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400';
  const borderClass = error ? 'border-red-300' : 'border-gray-300';

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category {required && <span className="text-red-500">*</span>}
        </label>
        <select
          title="Category"
          value={parentId}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={disabled || !categories.length}
          className={`${baseClass} ${borderClass}`}
        >
          <option value="">Select category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {parentId && subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-category <span className="text-red-500">*</span>
          </label>
          <select
            title="Sub-category"
            value={subId}
            onChange={(e) => handleSubChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} ${borderClass}`}
          >
            <option value="">All {selectedParent?.name} (or choose sub-category)</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
          {!subId && selectedParent && (
            <p className="text-xs text-gray-500 mt-1">
              Selecting a sub-category helps candidates find this job more easily.
            </p>
          )}
        </div>
      )}

      {/* Category breadcrumb preview */}
      {parentId && (
        <div className="flex items-center gap-1 text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5">
          <span className="font-medium">{selectedParent?.name}</span>
          {subId && subcategories.length > 0 && (
            <>
              <span className="text-brand-300">›</span>
              <span className="font-semibold">{subcategories.find((s) => s.id === subId)?.name}</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
