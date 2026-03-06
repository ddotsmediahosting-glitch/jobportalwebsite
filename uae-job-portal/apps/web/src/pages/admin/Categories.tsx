import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { categorySchema, CategoryInput } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  parentId?: string | null;
  _count?: { jobs: number; children: number };
  children?: Category[];
}

function CategoryRow({ cat, depth, onEdit, onDelete, onAddChild }: {
  cat: Category; depth: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : <span className="w-4" />}
            {hasChildren
              ? <FolderOpen className="h-4 w-4 text-brand-400 flex-shrink-0" />
              : <Folder className="h-4 w-4 text-gray-300 flex-shrink-0" />}
            <span className="ml-1.5 text-sm font-medium text-gray-900">{cat.name}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{cat.slug}</td>
        <td className="px-4 py-2.5 text-sm text-gray-500 hidden md:table-cell">
          {cat._count?.jobs ?? 0} jobs · {cat._count?.children ?? 0} sub
        </td>
        <td className="px-4 py-2.5">
          <div className="flex justify-end gap-1">
            <button onClick={() => onAddChild(cat.id)} className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50" title="Add subcategory"><Plus className="h-3.5 w-3.5" /></button>
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

export function AdminCategories() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories?tree=true').then((r) => r.data.data),
  });

  const { data: flatCats } = useQuery({
    queryKey: ['admin-categories-flat'],
    queryFn: () => api.get('/admin/categories').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  const openCreate = (parentId?: string) => {
    setEditingCat(null);
    reset({ name: '', slug: '', iconUrl: '', parentId: parentId ?? null });
    setDefaultParentId(parentId);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    reset({ name: cat.name, slug: cat.slug, iconUrl: cat.iconUrl ?? '', parentId: cat.parentId ?? null });
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: CategoryInput) => api.post('/admin/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['admin-categories-flat'] });
      toast.success('Category created.');
      setModalOpen(false); reset();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryInput }) => api.put(`/admin/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category updated.');
      setModalOpen(false); reset();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Category deleted.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: CategoryInput) => {
    if (editingCat) updateMutation.mutate({ id: editingCat.id, data });
    else createMutation.mutate(data);
  };

  const parentOptions = [
    { value: '', label: 'None (top-level)' },
    ...(flatCats?.map((c: Category) => ({ value: c.id, label: c.name })) ?? []),
  ];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage the job category tree.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>Add Category</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Stats</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories?.map((cat: Category) => (
              <CategoryRow key={cat.id} cat={cat} depth={0} onEdit={openEdit}
                onDelete={(c) => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                onAddChild={(parentId) => openCreate(parentId)} />
            ))}
          </tbody>
        </table>
        {!categories?.length && <div className="text-center py-16 text-gray-400">No categories yet.</div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset(); setEditingCat(null); }} title={editingCat ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register('name')} label="Name" placeholder="Technology" error={errors.name?.message} required />
          <Input {...register('slug')} label="Slug" placeholder="technology" error={errors.slug?.message} required />
          <Input {...register('iconUrl')} label="Icon URL (optional)" placeholder="https://..." error={errors.iconUrl?.message} />
          <Select {...register('parentId')} label="Parent Category" options={parentOptions} defaultValue={defaultParentId ?? ''} error={errors.parentId?.message} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); reset(); setEditingCat(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingCat ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
