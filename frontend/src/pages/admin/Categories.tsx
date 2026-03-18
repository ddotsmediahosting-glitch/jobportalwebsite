import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderOpen, Folder, Tag } from 'lucide-react';
import { categorySchema, CategoryInput } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  _count?: { jobs: number };
  children?: Category[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function CategoryRow({ cat, depth, onEdit, onDelete, onAddChild }: {
  cat: Category; depth: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddChild: (parentId: string, parentName: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const subCount = cat.children?.length ?? 0;

  return (
    <>
      <tr className={`hover:bg-gray-50 ${depth === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
        <td className="px-4 py-2.5">
          <div
            ref={(el) => { if (el) el.style.setProperty('--indent', `${depth * 24}px`); }}
            className="flex items-center gap-1.5 [padding-left:var(--indent,0px)]"
          >
            {/* Indent connector line for subcategories */}
            {depth > 0 && (
              <span className="inline-block w-3 border-l-2 border-b-2 border-gray-200 h-3 rounded-bl mr-0.5 flex-shrink-0" />
            )}

            {/* Expand/collapse toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label={open ? 'Collapse' : 'Expand'}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            {/* Icon */}
            {depth === 0
              ? (hasChildren
                ? <FolderOpen className="h-4 w-4 text-brand-400 flex-shrink-0" />
                : <Folder className="h-4 w-4 text-brand-300 flex-shrink-0" />)
              : <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            }

            <span className={`ml-1 text-sm font-medium ${depth === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
              {cat.name}
            </span>

            {/* Badges */}
            {depth === 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Category
              </span>
            )}
            {depth > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Sub
              </span>
            )}
            {cat.isFeatured && (
              <span className="text-[10px] font-bold bg-gold-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Featured
              </span>
            )}
            {cat.isActive === false && (
              <span className="text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Inactive
              </span>
            )}
          </div>
        </td>

        <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">
          <span className="font-medium text-gray-700">{cat._count?.jobs ?? 0}</span> jobs
          {depth === 0 && (
            <> · <span className="font-medium text-gray-700">{subCount}</span> sub-categories</>
          )}
        </td>

        <td className="px-4 py-2.5 text-xs text-gray-400 hidden lg:table-cell font-mono">
          {cat.slug}
        </td>

        <td className="px-4 py-2.5">
          <div className="flex justify-end gap-1">
            {/* Add sub-category button — only on root categories */}
            {depth === 0 && (
              <button
                type="button"
                onClick={() => onAddChild(cat.id, cat.name)}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                title={`Add sub-category under "${cat.name}"`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(cat)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(cat)}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Render children when expanded */}
      {open && hasChildren && cat.children!.map((child) => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-1/2" />
            <div className="skeleton h-3 rounded w-1/3" />
          </div>
          <div className="skeleton h-6 rounded-full w-20" />
        </div>
      ))}
    </div>
  );
}

export function AdminCategories() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [modalMode, setModalMode] = useState<'category' | 'subcategory'>('category');
  const [parentInfo, setParentInfo] = useState<{ id: string; name: string } | null>(null);

  // Fetch full tree (including inactive items for admin)
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories?all=true').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  // Auto-generate slug from name (only on create)
  const watchedName = watch('name', '');
  useEffect(() => {
    if (!editingCat) {
      setValue('slug', slugify(watchedName));
    }
  }, [watchedName, editingCat, setValue]);

  const openCreateCategory = () => {
    setEditingCat(null);
    setModalMode('category');
    setParentInfo(null);
    reset({ name: '', slug: '', iconUrl: '', parentId: null, sortOrder: 0, isActive: true, isFeatured: false });
    setModalOpen(true);
  };

  const openCreateSubCategory = (parentId: string, parentName: string) => {
    setEditingCat(null);
    setModalMode('subcategory');
    setParentInfo({ id: parentId, name: parentName });
    reset({ name: '', slug: '', iconUrl: '', parentId, sortOrder: 0, isActive: true, isFeatured: false });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setModalMode(cat.parentId ? 'subcategory' : 'category');

    // Resolve parent info for display in modal header
    if (cat.parentId) {
      const parent = categories?.find((c) => c.id === cat.parentId);
      setParentInfo(parent ? { id: parent.id, name: parent.name } : null);
    } else {
      setParentInfo(null);
    }

    reset({
      name: cat.name,
      slug: cat.slug,
      iconUrl: cat.iconUrl ?? '',
      parentId: cat.parentId ?? null,
      sortOrder: 0,
      isActive: cat.isActive !== false,
      isFeatured: cat.isFeatured ?? false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
    setEditingCat(null);
    setParentInfo(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: CategoryInput) => api.post('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(modalMode === 'category' ? 'Category created.' : 'Sub-category created.');
      closeModal();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryInput }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Updated.');
      closeModal();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Deleted.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: CategoryInput) => {
    // Convert empty-string parentId to null (Select sends '' for "None" option)
    const cleanedParentId = data.parentId === ('' as unknown as null) ? null : data.parentId;
    const slug = editingCat
      ? editingCat.slug  // preserve slug for URL stability
      : `${slugify(data.name)}-${Date.now().toString(36)}`;  // unique slug on create

    const payload: CategoryInput = { ...data, parentId: cleanedParentId, slug };
    if (editingCat) updateMutation.mutate({ id: editingCat.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (cat: Category) => {
    const hasChildren = (cat.children?.length ?? 0) > 0;
    if (hasChildren) {
      toast.error(`Cannot delete "${cat.name}" — it has ${cat.children!.length} sub-categories. Delete them first.`);
      return;
    }
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(cat.id);
  };

  // Parent selector options — only root-level categories (no sub-categories as parents)
  const parentOptions = [
    { value: '', label: '— None (top-level category) —' },
    ...(categories?.map((c: Category) => ({ value: c.id, label: c.name })) ?? []),
  ];

  const totalCategories = categories?.length ?? 0;
  const totalSubs = categories?.reduce((sum: number, c: Category) => sum + (c.children?.length ?? 0), 0) ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1 text-sm">
            <span className="font-semibold text-gray-700">{totalCategories}</span> top-level categories
            &nbsp;·&nbsp;
            <span className="font-semibold text-gray-700">{totalSubs}</span> sub-categories
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateCategory}>
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <CategoriesSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Stats</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Slug</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories?.map((cat: Category) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddChild={openCreateSubCategory}
                />
              ))}
            </tbody>
          </table>
          {!categories?.length && (
            <EmptyState
              illustration="generic"
              title="No categories yet"
              description="Add top-level categories first, then add sub-categories under them."
              className="py-8"
            />
          )}
        </div>
      )}

      {/* Legend */}
      {(categories?.length ?? 0) > 0 && (
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-brand-100" />
            Category (top-level)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-gray-100" />
            Sub-category
          </span>
          <span className="flex items-center gap-1.5">
            <Plus className="h-3 w-3 text-brand-500" />
            Click <strong className="text-gray-500">+</strong> on a category row to add a sub-category
          </span>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          editingCat
            ? `Edit ${editingCat.parentId ? 'Sub-category' : 'Category'}: ${editingCat.name}`
            : modalMode === 'subcategory'
              ? `Add Sub-category${parentInfo ? ` under "${parentInfo.name}"` : ''}`
              : 'Add New Category'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* When CREATING a sub-category, show parent as read-only banner */}
          {!editingCat && modalMode === 'subcategory' && parentInfo && (
            <div className="flex items-center gap-2 bg-brand-50 text-brand-700 text-sm rounded-xl px-4 py-2.5 border border-brand-100">
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span>Parent category: <strong>{parentInfo.name}</strong></span>
            </div>
          )}

          {/* When EDITING, show parent dropdown to allow reassignment */}
          {editingCat && (
            <>
              <Select
                {...register('parentId')}
                label="Parent Category"
                options={parentOptions}
                error={errors.parentId?.message}
              />
              <p className="text-xs text-gray-400 -mt-2">
                Set to "None" to make this a top-level category. Choose a category to make it a sub-category.
              </p>
            </>
          )}

          <Input
            {...register('name')}
            label={modalMode === 'subcategory' ? 'Sub-category Name' : 'Category Name'}
            placeholder={modalMode === 'subcategory' ? 'e.g. Frontend Development' : 'e.g. Technology'}
            error={errors.name?.message}
            required
            autoFocus
          />

          <Input
            {...register('slug')}
            label="Slug"
            placeholder="auto-generated"
            error={errors.slug?.message}
          />

          <Input
            {...register('iconUrl')}
            label="Icon URL (optional)"
            placeholder="https://..."
            error={errors.iconUrl?.message}
          />

          {/* Active / Featured toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('isFeatured')}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingCat
                ? 'Save Changes'
                : modalMode === 'subcategory'
                  ? 'Create Sub-category'
                  : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
