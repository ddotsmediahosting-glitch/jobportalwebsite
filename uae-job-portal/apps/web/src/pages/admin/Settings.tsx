import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Globe, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

interface Setting {
  key: string;
  value: string;
  description?: string;
}

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

const SETTING_LABELS: Record<string, { label: string; type: 'text' | 'boolean' | 'number' }> = {
  site_name: { label: 'Site Name', type: 'text' },
  site_tagline: { label: 'Tagline', type: 'text' },
  support_email: { label: 'Support Email', type: 'text' },
  jobs_require_approval: { label: 'Jobs Require Approval', type: 'boolean' },
  max_applications_per_day: { label: 'Max Applications Per Day (per seeker)', type: 'number' },
  maintenance_mode: { label: 'Maintenance Mode', type: 'boolean' },
  featured_jobs_limit: { label: 'Default Featured Jobs on Homepage', type: 'number' },
};

export function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'pages'>('settings');
  const [pageModal, setPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [pageForm, setPageForm] = useState({ slug: '', title: '', content: '', isPublished: true });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data.data as Setting[]),
  });

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['admin-content-pages'],
    queryFn: () => api.get('/admin/content-pages').then((r) => r.data.data as ContentPage[]),
    enabled: activeTab === 'pages',
  });

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setLocalSettings(map);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => api.put(`/admin/settings/${key}`, { value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Setting saved.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const upsertPageMutation = useMutation({
    mutationFn: (data: typeof pageForm) =>
      editingPage
        ? api.put(`/admin/content-pages/${editingPage.id}`, data)
        : api.post('/admin/content-pages', data),
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
    mutationFn: (id: string) => api.delete(`/admin/content-pages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-content-pages'] }); toast.success('Page deleted.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (settingsLoading) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Platform configuration and content management.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['settings', 'pages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'settings' ? <><Globe className="h-4 w-4 inline mr-1.5" />Site Settings</> : <><FileText className="h-4 w-4 inline mr-1.5" />Content Pages</>}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-4">
          {Object.entries(SETTING_LABELS).map(([key, { label, type }]) => {
            const currentVal = localSettings[key] ?? '';
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                      </label>
                    ) : (
                      <input
                        type={type === 'number' ? 'number' : 'text'}
                        value={currentVal}
                        onChange={(e) => setLocalSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
      )}

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
            <PageSpinner />
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
                            onClick={() => { if (confirm('Delete this page?')) deletePageMutation.mutate(page.id); }}
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
                <div className="text-center py-16 text-gray-400">No content pages yet.</div>
              )}
            </div>
          )}
        </div>
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
