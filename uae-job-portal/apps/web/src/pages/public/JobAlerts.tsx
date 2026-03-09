import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Bell, Plus, Trash2, BellOff, CheckCircle, Search, MapPin, Briefcase } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';

const EMIRATE_OPTIONS = [
  { value: '', label: 'Any Emirate' },
  { value: 'DUBAI', label: 'Dubai' },
  { value: 'ABU_DHABI', label: 'Abu Dhabi' },
  { value: 'SHARJAH', label: 'Sharjah' },
  { value: 'AJMAN', label: 'Ajman' },
  { value: 'RAS_AL_KHAIMAH', label: 'Ras Al Khaimah' },
  { value: 'FUJAIRAH', label: 'Fujairah' },
  { value: 'UMM_AL_QUWAIN', label: 'Umm Al Quwain' },
];

const WORK_MODE_OPTIONS = [
  { value: '', label: 'Any Mode' },
  { value: 'ONSITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
];

const EMIRATE_LABELS: Record<string, string> = {
  DUBAI: 'Dubai', ABU_DHABI: 'Abu Dhabi', SHARJAH: 'Sharjah',
  AJMAN: 'Ajman', RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah', UMM_AL_QUWAIN: 'Umm Al Quwain',
};

interface AlertForm {
  name: string;
  keywords: string;
  emirate: string;
  workMode: string;
  salaryMin: string;
  frequency: string;
}

interface JobAlert {
  id: string;
  name: string;
  keywords?: string;
  emirate?: string;
  workMode?: string;
  salaryMin?: number;
  frequency: string;
  isActive: boolean;
  lastSentAt?: string;
  createdAt: string;
}

export function JobAlerts() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['job-alerts'],
    queryFn: () => api.get('/seeker/alerts').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlertForm>({
    defaultValues: { name: '', keywords: '', emirate: '', workMode: '', salaryMin: '', frequency: 'WEEKLY' },
  });

  const createMutation = useMutation({
    mutationFn: (data: AlertForm) =>
      api.post('/seeker/alerts', {
        name: data.name,
        keywords: data.keywords || undefined,
        emirate: data.emirate || undefined,
        workMode: data.workMode || undefined,
        salaryMin: data.salaryMin ? parseInt(data.salaryMin) : undefined,
        frequency: data.frequency,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
      toast.success('Job alert created!');
      setShowModal(false);
      reset();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/seeker/alerts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
      toast.success('Alert deleted.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const alerts: JobAlert[] = data || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-brand-600" /> Job Alerts
            </h1>
            <p className="text-gray-500 text-sm mt-1">Get notified when new matching jobs are posted.</p>
          </div>
          <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>
            New Alert
          </Button>
        </div>

        {/* Tips banner */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-brand-700">
            <p className="font-medium">How job alerts work</p>
            <p className="mt-0.5 text-brand-600">
              We'll scan new job postings and send you an email digest based on your chosen frequency. The more specific your filters, the better the matches.
            </p>
          </div>
        </div>

        {/* Alerts list */}
        {isLoading ? (
          <PageSpinner />
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No alerts yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first job alert to never miss an opportunity.</p>
            <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Create Alert</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell size={14} className="text-brand-600" />
                      <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${alert.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {alert.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {alert.keywords && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          <Search size={10} /> {alert.keywords}
                        </span>
                      )}
                      {alert.emirate && (
                        <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                          <MapPin size={10} /> {EMIRATE_LABELS[alert.emirate] || alert.emirate}
                        </span>
                      )}
                      {alert.workMode && (
                        <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                          <Briefcase size={10} /> {alert.workMode}
                        </span>
                      )}
                      {alert.salaryMin && (
                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          Min {alert.salaryMin.toLocaleString()} AED/mo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Frequency: <span className="font-medium text-gray-500">{alert.frequency}</span>
                      {alert.lastSentAt && (
                        <> · Last sent: {new Date(alert.lastSentAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(alert.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title="Create Job Alert" size="md">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g. Senior Developer in Dubai"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              {...register('keywords')}
              placeholder="e.g. React, Node.js, Marketing"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple keywords with commas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
              <select
                {...register('emirate')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {EMIRATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                {...register('workMode')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {WORK_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (AED/mo)</label>
              <input
                {...register('salaryMin')}
                type="number"
                placeholder="e.g. 10000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                {...register('frequency')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={createMutation.isPending} className="flex-1">
              Create Alert
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
