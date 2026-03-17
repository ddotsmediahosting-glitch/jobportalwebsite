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
  _count?: { jobs: number; children: number };
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
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 22}px` }}>
            {hasChildren ? (
              <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : <span className="w-4" />}
            {hasChildren
              ? <FolderOpen className="h-4 w-4 text-brand-400 flex-shrink-0" />
              : depth > 0
                ? <Tag className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                : <Folder className="h-4 w-4 text-gray-300 flex-shrink-0" />}
            <span className="ml-1.5 text-sm font-medium text-gray-900">{cat.name}</span>
            {depth === 0 && (
              <span className="ml-2 text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-medium">Category</span>
            )}
            {depth > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Sub</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm text-gray-500 hidden md:table-cell">
          {cat._count?.jobs ?? 0} jobs · {cat._count?.children ?? 0} sub-categories
        </td>
        <td className="px-4 py-2.5">
          <div className="flex justify-end gap-1">
            {depth === 0 && (
              <button
                onClick={() => onAddChild(cat.id, cat.name)}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50"
                title="Add sub-category"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => onDelete(cat)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </td>
      </tr>
      {open && hasChildren && cat.children!.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
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

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories?all=true').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

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
    setParentInfo(null);
    reset({ name: cat.name, slug: cat.slug, iconUrl: cat.iconUrl ?? '', parentId: cat.parentId ?? null, sortOrder: 0, isActive: true, isFeatured: false });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Deleted.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: CategoryInput) => {
    // On create: generate unique slug. On edit: preserve original slug for URL stability.
    const slug = editingCat ? editingCat.slug : `${slugify(data.name)}-${Date.now().toString(36)}`;
    const payload = { ...data, slug };
    if (editingCat) updateMutation.mutate({ id: editingCat.id, data: payload });
    else createMutation.mutate(payload);
  };

  // Derive flat top-level list from the tree for the parent selector
  const parentOptions = [
    { value: '', label: 'None (top-level category)' },
    ...(categories?.map((c: Category) => ({ value: c.id, label: c.name })) ?? []),
  ];

  const totalCategories = categories?.length ?? 0;
  const totalSubs = categories?.reduce((sum: number, c: Category) => sum + (c.children?.length ?? 0), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">
            {totalCategories} categories · {totalSubs} sub-categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={openCreateCategory}>
            Add Category
          </Button>
        </div>
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
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories?.map((cat: Category) => (
                <CategoryRow key={cat.id} cat={cat} depth={0} onEdit={openEdit}
                  onDelete={(c) => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                  onAddChild={openCreateSubCategory} />
              ))}
            </tbody>
          </table>
          {!categories?.length && (
            <EmptyState illustration="generic" title="No categories yet" description="Add job categories to help employers and seekers." className="py-8" />
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingCat
          ? `Edit ${editingCat.parentId ? 'Sub-category' : 'Category'}`
          : modalMode === 'subcategory'
            ? `Add Sub-category${parentInfo ? ` under "${parentInfo.name}"` : ''}`
            : 'Add Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Parent selector — only shown when editing, for reassignment */}
          {editingCat && (
            <Select
              {...register('parentId')}
              label="Parent Category"
              options={parentOptions}
              error={errors.parentId?.message}
            />
          )}
          {!editingCat && modalMode === 'subcategory' && parentInfo && (
            <div className="bg-brand-50 text-brand-700 text-sm rounded-lg px-3 py-2">
              Sub-category of: <strong>{parentInfo.name}</strong>
            </div>
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
            {...register('iconUrl')}
            label="Icon URL (optional)"
            placeholder="https://..."
            error={errors.iconUrl?.message}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingCat ? 'Save Changes' : modalMode === 'subcategory' ? 'Create Sub-category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
