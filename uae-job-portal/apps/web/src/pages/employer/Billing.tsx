import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Zap, Crown, Briefcase } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  jobPostLimit: number;
  featuredJobLimit: number;
  candidateSearchAccess: boolean;
  icon: React.ReactNode;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'AED',
    interval: 'month',
    icon: <Briefcase className="h-6 w-6" />,
    jobPostLimit: 3,
    featuredJobLimit: 0,
    candidateSearchAccess: false,
    features: [
      'Up to 3 active job posts',
      'Basic company profile',
      'Application tracking',
      'Email notifications',
    ],
  },
  {
    id: 'STANDARD',
    name: 'Standard',
    price: 499,
    currency: 'AED',
    interval: 'month',
    icon: <Zap className="h-6 w-6" />,
    popular: true,
    jobPostLimit: 20,
    featuredJobLimit: 3,
    candidateSearchAccess: false,
    features: [
      'Up to 20 active job posts',
      '3 featured job slots',
      'Verified employer badge',
      'Priority listing',
      'Advanced analytics',
      'Email + SMS notifications',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 1299,
    currency: 'AED',
    interval: 'month',
    icon: <Crown className="h-6 w-6" />,
    jobPostLimit: 999,
    featuredJobLimit: 10,
    candidateSearchAccess: true,
    features: [
      'Unlimited job posts',
      '10 featured job slots',
      'Candidate search & filter',
      'Dedicated account manager',
      'Custom branding options',
      'API access',
      'SLA support',
    ],
  },
];

export function Billing() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employer-billing'],
    queryFn: () => api.get('/employer/billing').then((r) => r.data.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (plan: string) => api.post('/employer/billing/subscribe', { plan }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['employer-billing'] });
      if (res.data.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
      } else {
        toast.success('Plan activated!');
      }
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/employer/billing/cancel'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-billing'] }); toast.success('Subscription cancelled.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <PageSpinner />;

  const currentPlan = data?.plan || 'FREE';
  const subscription = data?.subscription;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and billing details.</p>
      </div>

      {/* Current subscription */}
      {subscription && currentPlan !== 'FREE' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Current Subscription</h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <p className="text-gray-400">Plan</p>
              <p className="font-medium text-gray-900 capitalize">{currentPlan.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-medium text-green-600 capitalize">{subscription.status?.toLowerCase()}</p>
            </div>
            {subscription.currentPeriodEnd && (
              <div>
                <p className="text-gray-400">Renews</p>
                <p className="font-medium text-gray-900">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
              </div>
            )}
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (confirm('Cancel your subscription? You can re-subscribe anytime.')) cancelMutation.mutate(); }}
                loading={cancelMutation.isPending}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Usage */}
      {data?.usage && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Usage This Period</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <UsageStat label="Active Jobs" used={data.usage.activeJobs} limit={data.usage.jobPostLimit} />
            <UsageStat label="Featured Jobs" used={data.usage.featuredJobs} limit={data.usage.featuredJobLimit} />
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Candidate Search</p>
              <p className={`font-semibold ${data.usage.candidateSearchAccess ? 'text-green-600' : 'text-gray-400'}`}>
                {data.usage.candidateSearchAccess ? 'Enabled' : 'Not available'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 flex flex-col relative ${
                plan.popular ? 'border-brand-500 shadow-lg' : isCurrent ? 'border-green-400' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && !plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className={`inline-flex p-3 rounded-xl mb-4 w-fit ${plan.popular ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-600'}`}>
                {plan.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                    <span className="text-gray-400 ml-1">AED / {plan.interval}</span>
                  </>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular && !isCurrent ? 'primary' : 'outline'}
                className="w-full"
                disabled={isCurrent}
                loading={subscribeMutation.isPending}
                onClick={() => !isCurrent && subscribeMutation.mutate(plan.id)}
              >
                {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Subscribe'}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        All prices are exclusive of VAT. Subscriptions renew automatically. Cancel anytime.
      </p>
    </div>
  );
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 900 ? 100 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-semibold ${isNearLimit ? 'text-orange-500' : 'text-gray-900'}`}>
        {used} / {limit > 900 ? '∞' : limit}
      </p>
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-orange-400' : 'bg-brand-500'}`}
          style={{ width: `${limit > 900 ? 30 : pct}%` }}
        />
      </div>
    </div>
  );
}
