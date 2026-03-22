import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Calendar, User,
  Tag, Search, ExternalLink,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  readTime: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Career Advice', 'Industry News', 'Hiring Tips', 'Resume Tips',
  'Interview Guide', 'UAE Jobs Market', 'Media Industry', 'Company News', 'General',
];

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: 'Admin',
  category: 'General',
  tags: '',
  isPublished: false,
  readTime: '',
};

export function AdminBlogManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['admin-blog'],
    queryFn: () => api.get('/admin/blog').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      api.post('/admin/blog', {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        readTime: data.readTime ? parseInt(data.readTime) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post created.');
      closeModal();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) =>
      api.put(`/admin/blog/${id}`, {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        readTime: data.readTime ? parseInt(data.readTime) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post updated.');
      closeModal();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post deleted.');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.put(`/admin/blog/${id}`, { isPublished }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success(vars.isPublished ? 'Post published.' : 'Post unpublished.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      author: post.author,
      category: post.category,
      tags: post.tags.join(', '),
      isPublished: post.isPublished,
      readTime: post.readTime?.toString() || '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const filtered = posts.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category === filterCat;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'published' ? p.isPublished : !p.isPublished);
    return matchSearch && matchCat && matchStatus;
  });

  const published = posts.filter((p) => p.isPublished).length;
  const drafts = posts.length - published;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Manager</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Create and manage blog posts and articles.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={15} /> New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Posts', value: posts.length, color: 'text-gray-900' },
          { label: 'Published', value: published, color: 'text-green-600' },
          { label: 'Drafts', value: drafts, color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          title="Filter by category"
          aria-label="Filter by category"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 capitalize transition-colors ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posts table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
              <div className="skeleton h-16 w-24 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded w-2/3" />
                <div className="skeleton h-3 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No posts found" description="Create your first blog post to get started." />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start hover:shadow-sm transition-shadow">
              {/* Cover image */}
              <div className="w-20 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{post.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                {post.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><User size={11} /> {post.author}</span>
                  <span className="flex items-center gap-1"><Tag size={11} /> {post.category}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {post.viewCount} views</span>
                  {post.readTime && <span>{post.readTime} min read</span>}
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {post.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {post.isPublished && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                    title="View post"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => togglePublishMutation.mutate({ id: post.id, isPublished: !post.isPublished })}
                  className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  title={post.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {post.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(post.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Post' : 'New Blog Post'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Post title..."
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                title="Post category"
                aria-label="Post category"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input
              label="Author"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Author name"
            />
          </div>
          <Textarea
            label="Excerpt (short summary)"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Brief description shown in listings..."
            rows={2}
          />
          <Textarea
            label="Content *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Full post content (HTML or plain text supported)..."
            rows={10}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cover Image URL"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://..."
            />
            <Input
              label="Read Time (mins)"
              type="number"
              value={form.readTime}
              onChange={(e) => setForm({ ...form, readTime: e.target.value })}
              placeholder="Auto-calculated if empty"
            />
          </div>
          <Input
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="media, hiring, UAE, design..."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isPending} className="flex-1">
              {editing ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Post?" size="sm">
        <p className="text-sm text-gray-600 mb-4">This will permanently delete the post. This cannot be undone.</p>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button
            type="button"
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
