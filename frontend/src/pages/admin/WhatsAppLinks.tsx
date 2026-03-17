import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, ExternalLink, Pin, Eye, EyeOff,
  Settings, Users, TrendingUp, Save, X, Check, BarChart2,
  MessageCircle, Globe, Instagram, Twitter, Linkedin, Hash,
  ArrowUp, ArrowDown, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface WhatsAppGroup {
  id: string;
  title: string;
  description?: string;
  link: string;
  category: string;
  emoji: string;
  memberCount?: number;
  maxMembers?: number;
  isPinned: boolean;
  isActive: boolean;
  sortOrder: number;
  clickCount: number;
  tags: string[];
  createdAt: string;
}

interface PageSettings {
  name: string;
  tagline?: string;
  bio?: string;
  avatarUrl?: string;
  bannerText?: string;
  bannerColor: string;
  theme: string;
  socialLinks?: { instagram?: string; twitter?: string; linkedin?: string; website?: string };
  isPublished: boolean;
  showStats: boolean;
}

const EMOJI_OPTIONS = ['💬', '👥', '💼', '📢', '🎯', '🚀', '💡', '🌍', '📱', '🤝', '📊', '🎓', '💰', '🏠', '🍕', '⚽', '🎮', '🎵', '📰', '🌟'];
const CATEGORIES = ['General', 'Jobs', 'Tech', 'Business', 'News', 'Community', 'Education', 'Finance', 'Health', 'Sports', 'Other'];
const THEMES = [
  { value: 'emerald', label: 'Emerald', color: '#10b981' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6' },
  { value: 'rose', label: 'Rose', color: '#f43f5e' },
  { value: 'amber', label: 'Amber', color: '#f59e0b' },
  { value: 'cyan', label: 'Cyan', color: '#06b6d4' },
];

const defaultGroup: Omit<WhatsAppGroup, 'id' | 'clickCount' | 'createdAt'> = {
  title: '', description: '', link: '', category: 'General',
  emoji: '💬', memberCount: undefined, maxMembers: undefined,
  isPinned: false, isActive: true, sortOrder: 0, tags: [],
};

const defaultPage: PageSettings = {
  name: 'Join Our WhatsApp Groups',
  tagline: '',
  bio: '',
  avatarUrl: '',
  bannerText: '',
  bannerColor: '#10b981',
  theme: 'emerald',
  socialLinks: { instagram: '', twitter: '', linkedin: '', website: '' },
  isPublished: true,
  showStats: true,
};

export function AdminWhatsAppLinks() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'groups' | 'settings'>('groups');
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [form, setForm] = useState<typeof defaultGroup>({ ...defaultGroup });
  const [pageForm, setPageForm] = useState<PageSettings>({ ...defaultPage });
  const [tagInput, setTagInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['admin-wa-groups'],
    queryFn: () => api.get('/admin/whatsapp-links/groups').then(r => r.data.data),
  });

  const { data: pageData } = useQuery({
    queryKey: ['admin-wa-page'],
    queryFn: () => api.get('/admin/whatsapp-links/page').then(r => r.data.data),
  });

  React.useEffect(() => {
    if (pageData) {
      setPageForm({
        ...defaultPage, ...pageData,
        socialLinks: { instagram: '', twitter: '', linkedin: '', website: '', ...(pageData.socialLinks ?? {}) },
      });
    }
  }, [pageData]);

  const groups: WhatsAppGroup[] = groupsData ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data: typeof defaultGroup) => api.post('/admin/whatsapp-links/groups', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wa-groups'] }); toast.success('Group created!'); closeModal(); },
    onError: () => toast.error('Failed to create group'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WhatsAppGroup> }) =>
      api.put(`/admin/whatsapp-links/groups/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wa-groups'] }); toast.success('Group updated!'); closeModal(); },
    onError: () => toast.error('Failed to update group'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/whatsapp-links/groups/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wa-groups'] }); toast.success('Group deleted'); setDeleteConfirm(null); },
    onError: () => toast.error('Failed to delete group'),
  });

  const pageMut = useMutation({
    mutationFn: (data: PageSettings) => api.put('/admin/whatsapp-links/page', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wa-page'] }); toast.success('Page settings saved!'); },
    onError: () => toast.error('Failed to save settings'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...defaultGroup, sortOrder: groups.length });
    setTagInput('');
    setModal('create');
  }

  function openEdit(g: WhatsAppGroup) {
    setEditingGroup(g);
    setForm({
      title: g.title, description: g.description ?? '', link: g.link,
      category: g.category, emoji: g.emoji,
      memberCount: g.memberCount, maxMembers: g.maxMembers,
      isPinned: g.isPinned, isActive: g.isActive,
      sortOrder: g.sortOrder, tags: g.tags ?? [],
    });
    setTagInput('');
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditingGroup(null); }

  function submitGroup() {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.link.trim()) return toast.error('WhatsApp link is required');
    if (!form.link.includes('chat.whatsapp.com') && !form.link.startsWith('https://')) {
      return toast.error('Please enter a valid WhatsApp group link');
    }
    if (modal === 'create') createMut.mutate(form);
    else if (modal === 'edit' && editingGroup) updateMut.mutate({ id: editingGroup.id, data: form });
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  function togglePin(g: WhatsAppGroup) {
    updateMut.mutate({ id: g.id, data: { isPinned: !g.isPinned } });
  }

  function toggleActive(g: WhatsAppGroup) {
    updateMut.mutate({ id: g.id, data: { isActive: !g.isActive } });
  }

  function moveOrder(g: WhatsAppGroup, dir: 'up' | 'down') {
    const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(x => x.id === g.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    updateMut.mutate({ id: g.id, data: { sortOrder: swap.sortOrder } });
    updateMut.mutate({ id: swap.id, data: { sortOrder: g.sortOrder } });
  }

  // Stats
  const totalClicks = groups.reduce((s, g) => s + g.clickCount, 0);
  const totalMembers = groups.reduce((s, g) => s + (g.memberCount ?? 0), 0);
  const activeCount = groups.filter(g => g.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Groups Page</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your Linktree-style WhatsApp groups sharing page</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/whatsapp-groups"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Preview
          </a>
          {tab === 'groups' && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bc5a] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#25D366]/25"
            >
              <Plus className="w-4 h-4" /> Add Group
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Groups', value: groups.length, icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Groups', value: activeCount, icon: Check, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Members', value: totalMembers ? `${(totalMembers / 1000).toFixed(1)}K` : '—', icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Joins', value: totalClicks.toLocaleString(), icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['groups', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'groups' ? <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4" />Groups</span>
              : <span className="flex items-center gap-2"><Settings className="w-4 h-4" />Page Settings</span>}
          </button>
        ))}
      </div>

      {/* ── GROUPS TAB ── */}
      {tab === 'groups' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {groupsLoading ? (
            <div className="p-12 text-center text-gray-400">Loading…</div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No groups yet</p>
              <p className="text-gray-400 text-sm mt-1">Add your first WhatsApp group to get started</p>
              <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-semibold rounded-xl">
                <Plus className="w-4 h-4" /> Add Group
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...groups].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || a.sortOrder - b.sortOrder).map((g, idx, arr) => (
                <div key={g.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors ${!g.isActive ? 'opacity-50' : ''}`}>
                  {/* Order controls */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveOrder(g, 'up')} disabled={idx === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveOrder(g, 'down')} disabled={idx === arr.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Emoji */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {g.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{g.title}</span>
                      {g.isPinned && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{g.category}</span>
                    </div>
                    {g.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {g.memberCount && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{g.memberCount.toLocaleString()} members</span>}
                      <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{g.clickCount} joins</span>
                      {(Array.isArray(g.tags) ? g.tags : []).length > 0 && <span>{(Array.isArray(g.tags) ? g.tags as string[] : []).slice(0, 2).map(t => `#${t}`).join(' ')}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => togglePin(g)}
                      title={g.isPinned ? 'Unpin' : 'Pin as featured'}
                      className={`p-2 rounded-lg transition-all ${g.isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'}`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(g)}
                      title={g.isActive ? 'Hide group' : 'Show group'}
                      className={`p-2 rounded-lg transition-all ${g.isActive ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                    >
                      {g.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <a
                      href={g.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-300 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEdit(g)}
                      className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(g.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" /> Profile
            </h2>
            {[
              { label: 'Page Title', key: 'name', placeholder: 'Join Our WhatsApp Groups' },
              { label: 'Tagline', key: 'tagline', placeholder: 'Your communities, one link' },
              { label: 'Avatar URL', key: 'avatarUrl', placeholder: 'https://…' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                <input
                  value={(pageForm as any)[f.key] ?? ''}
                  onChange={e => setPageForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
              <textarea
                value={pageForm.bio ?? ''}
                onChange={e => setPageForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Short description about your communities…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
              />
            </div>
          </div>

          {/* Banner & Theme */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Banner & Theme
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Announcement Banner</label>
              <input
                value={pageForm.bannerText ?? ''}
                onChange={e => setPageForm(p => ({ ...p, bannerText: e.target.value }))}
                placeholder="Show an announcement to visitors…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Banner Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={pageForm.bannerColor}
                  onChange={e => setPageForm(p => ({ ...p, bannerColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  value={pageForm.bannerColor}
                  onChange={e => setPageForm(p => ({ ...p, bannerColor: e.target.value }))}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Theme Color</label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setPageForm(p => ({ ...p, theme: t.value }))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${
                      pageForm.theme === t.value ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    {t.label}
                    {pageForm.theme === t.value && <Check className="w-3.5 h-3.5 ml-auto text-gray-900" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setPageForm(p => ({ ...p, isPublished: !p.isPublished }))}
                  className={`w-10 h-5.5 rounded-full transition-all relative ${pageForm.isPublished ? 'bg-emerald-400' : 'bg-gray-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${pageForm.isPublished ? 'left-[18px]' : 'left-0.5'}`}
                    style={{ width: '18px', height: '18px' }} />
                </div>
                <span className="text-sm text-gray-700">Published</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setPageForm(p => ({ ...p, showStats: !p.showStats }))}
                  className={`relative rounded-full transition-all ${pageForm.showStats ? 'bg-emerald-400' : 'bg-gray-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <div className={`absolute top-0.5 bg-white rounded-full shadow transition-all ${pageForm.showStats ? 'left-[18px]' : 'left-0.5'}`}
                    style={{ width: '18px', height: '18px' }} />
                </div>
                <span className="text-sm text-gray-700">Show Stats</span>
              </label>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" /> Social Links
            </h2>
            {[
              { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com' },
              { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/…' },
              { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/…' },
              { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/…' },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  value={(pageForm.socialLinks as any)?.[f.key] ?? ''}
                  onChange={e => setPageForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [f.key]: e.target.value } }))}
                  placeholder={f.placeholder}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-48">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-xl">
              {pageForm.avatarUrl ? (
                <img src={pageForm.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <MessageCircle className="w-7 h-7 text-white" />
              )}
            </div>
            <h3 className="text-white font-bold text-lg">{pageForm.name || 'Page Title'}</h3>
            {pageForm.tagline && <p className="text-emerald-300 text-sm mt-1">{pageForm.tagline}</p>}
            {pageForm.bio && <p className="text-white/50 text-xs mt-1 max-w-xs line-clamp-2">{pageForm.bio}</p>}
            <p className="text-white/25 text-xs mt-4">Live preview</p>
          </div>

          <div className="lg:col-span-2">
            <button
              onClick={() => pageMut.mutate(pageForm)}
              disabled={pageMut.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
            >
              <Save className="w-4 h-4" />
              {pageMut.isPending ? 'Saving…' : 'Save Page Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ── GROUP MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">
                {modal === 'create' ? 'Add New Group' : 'Edit Group'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                  <input
                    value={!EMOJI_OPTIONS.includes(form.emoji) ? form.emoji : ''}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value || '💬' }))}
                    placeholder="Custom"
                    className="w-20 h-10 px-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Group Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. UAE Jobs Network"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Group Link *</label>
                <input
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="https://chat.whatsapp.com/…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="What is this group about?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Member count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current Members</label>
                  <input
                    type="number"
                    min={0}
                    value={form.memberCount ?? ''}
                    onChange={e => setForm(f => ({ ...f, memberCount: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Members</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxMembers ?? ''}
                    onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g. 1024"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag…"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors">
                    Add
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                        #{t}
                        <button onClick={() => removeTag(t)} className="text-emerald-400 hover:text-red-400 transition-colors ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                {[
                  { key: 'isPinned', label: 'Pin as Featured' },
                  { key: 'isActive', label: 'Active' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, [opt.key]: !(f as any)[opt.key] }))}
                      className={`relative rounded-full transition-all ${(form as any)[opt.key] ? 'bg-emerald-400' : 'bg-gray-200'}`}
                      style={{ width: '40px', height: '22px' }}
                    >
                      <div
                        className={`absolute top-0.5 bg-white rounded-full shadow transition-all ${(form as any)[opt.key] ? 'left-[18px]' : 'left-0.5'}`}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </div>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                Cancel
              </button>
              <button
                onClick={submitGroup}
                disabled={createMut.isPending || updateMut.isPending}
                className="px-6 py-2.5 bg-[#25D366] hover:bg-[#20bc5a] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-[#25D366]/20"
              >
                {(createMut.isPending || updateMut.isPending) ? 'Saving…' : modal === 'create' ? 'Create Group' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Group</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleteConfirm)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
