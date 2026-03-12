import { IBillingProvider, BillingPlan, CreateSubscriptionResult } from './billing.interface';

export class MockBillingProvider implements IBillingProvider {
  async createSubscription(
    employerId: string,
    _email: string,
    plan: BillingPlan
  ): Promise<CreateSubscriptionResult> {
    const fakeSubId = `mock_sub_${employerId}_${Date.now()}`;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return {
      providerSubId: fakeSubId,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
      checkoutUrl: undefined, // No redirect needed in mock
    };
  }

  async cancelSubscription(_providerSubId: string): Promise<void> {
    // No-op in mock
  }

  async getSubscriptionStatus(_providerSubId: string): Promise<{ status: string; currentPeriodEnd: Date }> {
    return {
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}
