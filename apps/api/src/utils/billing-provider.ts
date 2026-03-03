export type Plan = "FREE" | "STANDARD" | "PREMIUM";

export interface BillingProvider {
  createOrUpdateSubscription(input: {
    employerId: string;
    plan: Plan;
  }): Promise<{ providerSubId: string; status: string; currentPeriodEnd: Date }>;
}

class MockBillingProvider implements BillingProvider {
  async createOrUpdateSubscription(input: { employerId: string; plan: Plan }) {
    return {
      providerSubId: `mock-${input.employerId}-${input.plan.toLowerCase()}`,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
}

export const billingProvider: BillingProvider = new MockBillingProvider();
