export type BillingPlan = 'FREE' | 'STANDARD' | 'PREMIUM';

export interface PlanDetails {
  plan: BillingPlan;
  priceAed: number;
  jobPostsLimit: number;
  featuredPostsLimit: number;
  candidateSearchEnabled: boolean;
}

export const PLANS: Record<BillingPlan, PlanDetails> = {
  FREE: { plan: 'FREE', priceAed: 0, jobPostsLimit: 3, featuredPostsLimit: 0, candidateSearchEnabled: false },
  STANDARD: { plan: 'STANDARD', priceAed: 999, jobPostsLimit: 15, featuredPostsLimit: 3, candidateSearchEnabled: false },
  PREMIUM: { plan: 'PREMIUM', priceAed: 2499, jobPostsLimit: 50, featuredPostsLimit: 10, candidateSearchEnabled: true },
};

export interface CreateSubscriptionResult {
  providerSubId: string;
  status: string;
  currentPeriodEnd: Date;
  checkoutUrl?: string;
}

export interface IBillingProvider {
  createSubscription(
    employerId: string,
    email: string,
    plan: BillingPlan
  ): Promise<CreateSubscriptionResult>;

  cancelSubscription(providerSubId: string): Promise<void>;

  getSubscriptionStatus(providerSubId: string): Promise<{ status: string; currentPeriodEnd: Date }>;
}
