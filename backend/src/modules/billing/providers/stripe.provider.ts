import Stripe from 'stripe';
import { IBillingProvider, BillingPlan, CreateSubscriptionResult, PLANS } from './billing.interface';
import { config } from '../../../config';

// Stripe price IDs – set these in your Stripe dashboard and put IDs in env
const STRIPE_PRICE_IDS: Record<string, string> = {
  STANDARD: process.env.STRIPE_PRICE_STANDARD || 'price_standard',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
};

export class StripeBillingProvider implements IBillingProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.billing.stripeSecretKey, { apiVersion: '2024-06-20' });
  }

  async createSubscription(
    employerId: string,
    email: string,
    plan: BillingPlan
  ): Promise<CreateSubscriptionResult> {
    if (plan === 'FREE') {
      return {
        providerSubId: `free_${employerId}`,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
    }

    // Create or retrieve customer
    const customers = await this.stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || (await this.stripe.customers.create({ email, metadata: { employerId } }));

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
      success_url: `${config.cors.origin}/employer/billing?success=1`,
      cancel_url: `${config.cors.origin}/employer/billing?cancelled=1`,
      metadata: { employerId, plan },
    });

    return {
      providerSubId: session.id, // Will be updated via webhook
      status: 'PENDING',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      checkoutUrl: session.url || undefined,
    };
  }

  async cancelSubscription(providerSubId: string): Promise<void> {
    if (providerSubId.startsWith('free_') || providerSubId.startsWith('mock_')) return;
    await this.stripe.subscriptions.cancel(providerSubId);
  }

  async getSubscriptionStatus(providerSubId: string): Promise<{ status: string; currentPeriodEnd: Date }> {
    const sub = await this.stripe.subscriptions.retrieve(providerSubId);
    return {
      status: sub.status.toUpperCase(),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    };
  }
}
