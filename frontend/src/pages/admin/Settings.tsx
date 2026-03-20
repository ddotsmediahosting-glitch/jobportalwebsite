import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Globe, FileText, Plus, Pencil, Trash2, Share2, ExternalLink, Megaphone } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

const SETTING_LABELS: Record<string, { label: string; type: 'text' | 'boolean' | 'number'; placeholder?: string }> = {
  site_name: { label: 'Site Name', type: 'text', placeholder: 'Ddotsmedia Jobs' },
  site_tagline: { label: 'Tagline', type: 'text', placeholder: 'Find your dream job in the UAE' },
  support_email: { label: 'Support Email', type: 'text', placeholder: 'support@yourdomain.com' },
  jobs_require_approval: { label: 'Jobs Require Approval', type: 'boolean' },
  max_applications_per_day: { label: 'Max Applications Per Day (per seeker)', type: 'number', placeholder: '10' },
  maintenance_mode: { label: 'Maintenance Mode', type: 'boolean' },
  featured_jobs_limit: { label: 'Default Featured Jobs on Homepage', type: 'number', placeholder: '6' },
};

interface SocialLink {
  key: string;
  label: string;
  placeholder: string;
  icon: string;
  color: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { key: 'social_facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourpage',       icon: 'f', color: 'bg-blue-600' },
  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle',    icon: 'in', color: 'bg-pink-500' },
  { key: 'social_twitter',   label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle',          icon: 'x', color: 'bg-gray-900' },
  { key: 'social_linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/yourco', icon: 'li', color: 'bg-blue-700' },
  { key: 'social_youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel',    icon: 'yt', color: 'bg-red-600' },
  { key: 'social_tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourhandle',      icon: 'tt', color: 'bg-gray-800' },
  { key: 'social_whatsapp',  label: 'WhatsApp',  placeholder: 'https://wa.me/971XXXXXXXXX',          icon: 'wa', color: 'bg-green-500' },
];

// ── Settings skeleton ─────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 rounded w-40" />
              <div className="skeleton h-3 rounded w-28" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 rounded-lg w-52" />
              <div className="skeleton h-8 rounded-lg w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pages skeleton ────────────────────────────────────────────────────────────
function PagesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
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

export function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'social' | 'pages' | 'announcement'>('settings');
  const [pageModal, setPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [pageForm, setPageForm] = useState({ slug: '', title: '', content: '', isPublished: true });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data.data as Record<string, string>),
  });

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['admin-content-pages'],
    queryFn: () => api.get('/admin/pages').then((r) => r.data.data as ContentPage[]),
    enabled: activeTab === 'pages',
  });

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (settings) {
      const coerced: Record<string, string> = {};
      Object.entries(settings).forEach(([k, v]) => { coerced[k] = String(v ?? ''); });
      setLocalSettings(coerced);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => api.put(`/admin/settings/${key}`, { value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Saved.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const upsertPageMutation = useMutation({
    mutationFn: (data: typeof pageForm) => api.put('/admin/pages', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-content-pages'] });
      toast.success(editingPage ? 'Page updated.' : 'Page created.');
      setPageModal(false);
      setEditingPage(null);
      setPageForm({ slug: '', title: '', content: '', isPublished: true });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deletePageMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/admin/pages/${slug}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-content-pages'] }); toast.success('Page deleted.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const tabs = [
    { id: 'settings',     label: 'Site Settings',  icon: <Globe className="h-4 w-4" /> },
    { id: 'social',       label: 'Social Media',   icon: <Share2 className="h-4 w-4" /> },
    { id: 'pages',        label: 'Content Pages',  icon: <FileText className="h-4 w-4" /> },
    { id: 'announcement', label: 'Announcement',   icon: <Megaphone className="h-4 w-4" /> },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Platform configuration, social media and content management.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Site Settings ─────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <div className="space-y-4">
            {Object.entries(SETTING_LABELS).map(([key, { label, type, placeholder }]) => {
              const currentVal = localSettings[key] ?? '';
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-sm font-medium text-gray-900 mb-0.5">{label}</label>
                      <p className="text-xs text-gray-400 font-mono">{key}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {type === 'boolean' ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={currentVal === 'true'}
                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, [key]: String(e.target.checked) }))}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                        </label>
                      ) : (
                        <input
                          type={type === 'number' ? 'number' : 'text'}
                          value={currentVal}
                          placeholder={placeholder}
                          onChange={(e) => setLocalSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Save className="h-3.5 w-3.5" />}
                        onClick={() => updateSettingMutation.mutate({ key, value: currentVal })}
                        loading={updateSettingMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Social Media ──────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <div className="space-y-3">
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700">
              Add your social media profile URLs. Leave blank to hide a platform from the site footer.
            </div>

            {SOCIAL_LINKS.map(({ key, label, placeholder, icon, color }) => {
              const currentVal = localSettings[key] ?? '';
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Platform badge */}
                    <div className={`${color} text-white rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold uppercase">{icon}</span>
                    </div>
                    <div className="flex-shrink-0 w-24">
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="url"
                        value={currentVal}
                        placeholder={placeholder}
                        onChange={(e) => setLocalSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {currentVal && (
                        <a
                          href={currentVal}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50"
                          title="Preview link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Save className="h-3.5 w-3.5" />}
                        onClick={() => updateSettingMutation.mutate({ key, value: currentVal })}
                        loading={updateSettingMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Content Pages ─────────────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setEditingPage(null); setPageForm({ slug: '', title: '', content: '', isPublished: true }); setPageModal(true); }}
            >
              New Page
            </Button>
          </div>
          {pagesLoading ? (
            <PagesSkeleton />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Published</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Updated</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pages?.map((page: ContentPage) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell font-mono">{page.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {page.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingPage(page);
                              setPageForm({ slug: page.slug, title: page.title, content: page.content, isPublished: page.isPublished });
                              setPageModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this page?')) deletePageMutation.mutate(page.slug); }}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!pages?.length && (
                <EmptyState
                  illustration="generic"
                  title="No content pages yet"
                  description="Create pages like About Us, Privacy Policy, and Terms of Service."
                  className="py-8"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Announcement Banner ───────────────────────────────────────────── */}
      {activeTab === 'announcement' && (
        settingsLoading ? <SettingsSkeleton /> : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              This banner appears at the top of every public page. Leave the text blank to hide the banner.
            </div>

            {/* Active toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Banner Active</p>
                <p className="text-xs text-gray-400">Show the announcement banner to all visitors</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" title="Banner Active" className="sr-only peer"
                    checked={localSettings['announcement_active'] === 'true'}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcement_active: String(e.target.checked) }))} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                </label>
                <Button size="sm" variant="outline" icon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => updateSettingMutation.mutate({ key: 'announcement_active', value: localSettings['announcement_active'] ?? 'false' })}
                  loading={updateSettingMutation.isPending}>Save</Button>
              </div>
            </div>

            {/* Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <p className="text-sm font-medium text-gray-900">Banner Type</p>
                <p className="text-xs text-gray-400">Controls the colour of the banner</p>
              </div>
              <div className="flex items-center gap-3">
                <select title="Banner type" value={localSettings['announcement_type'] ?? 'info'}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcement_type: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="info">Info (blue)</option>
                  <option value="success">Success (green)</option>
                  <option value="warning">Warning (yellow)</option>
                  <option value="error">Alert (red)</option>
                </select>
                <Button size="sm" variant="outline" icon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => updateSettingMutation.mutate({ key: 'announcement_type', value: localSettings['announcement_type'] ?? 'info' })}
                  loading={updateSettingMutation.isPending}>Save</Button>
              </div>
            </div>

            {/* Text */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <p className="text-sm font-medium text-gray-900">Banner Message</p>
              <textarea title="Banner message" placeholder="e.g. We have 5,000+ new jobs this week — browse now!"
                value={localSettings['announcement_text'] ?? ''}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcement_text: e.target.value }))}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" icon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => updateSettingMutation.mutate({ key: 'announcement_text', value: localSettings['announcement_text'] ?? '' })}
                  loading={updateSettingMutation.isPending}>Save Message</Button>
              </div>
            </div>

            {/* Link */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <p className="text-sm font-medium text-gray-900">Optional CTA Link</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input title="Link URL" placeholder="e.g. /jobs" value={localSettings['announcement_link'] ?? ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcement_link: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input title="Link label" placeholder="e.g. Browse Jobs" value={localSettings['announcement_link_label'] ?? ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcement_link_label: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" icon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => {
                    updateSettingMutation.mutate({ key: 'announcement_link', value: localSettings['announcement_link'] ?? '' });
                    updateSettingMutation.mutate({ key: 'announcement_link_label', value: localSettings['announcement_link_label'] ?? '' });
                  }}
                  loading={updateSettingMutation.isPending}>Save Link</Button>
              </div>
            </div>

            {/* Live preview */}
            {localSettings['announcement_text'] && (
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Live Preview</p>
                <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 ${
                  localSettings['announcement_type'] === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  localSettings['announcement_type'] === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  localSettings['announcement_type'] === 'error'   ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-brand-50 text-brand-800 border border-brand-200'
                }`}>
                  <span>{localSettings['announcement_text']}</span>
                  {localSettings['announcement_link'] && localSettings['announcement_link_label'] && (
                    <span className="underline text-xs flex-shrink-0">{localSettings['announcement_link_label']} →</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Page editor modal */}
      <Modal
        isOpen={pageModal}
        onClose={() => { setPageModal(false); setEditingPage(null); }}
        title={editingPage ? 'Edit Page' : 'New Page'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={pageForm.title}
              onChange={(e) => setPageForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <Input
              label="Slug"
              value={pageForm.slug}
              onChange={(e) => setPageForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="about-us"
              required
            />
          </div>
          <Textarea
            label="Content (HTML)"
            value={pageForm.content}
            onChange={(e) => setPageForm((p) => ({ ...p, content: e.target.value }))}
            rows={10}
            placeholder="<h1>About Us</h1><p>...</p>"
          />
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pageForm.isPublished}
                onChange={(e) => setPageForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
            </label>
            <span className="text-sm text-gray-600">Published</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => { setPageModal(false); setEditingPage(null); }}>Cancel</Button>
            <Button onClick={() => upsertPageMutation.mutate(pageForm)} loading={upsertPageMutation.isPending}>
              {editingPage ? 'Save Changes' : 'Create Page'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
