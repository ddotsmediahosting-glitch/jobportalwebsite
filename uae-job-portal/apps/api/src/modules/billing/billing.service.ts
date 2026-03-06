import prisma from '../../lib/prisma';
import { AppError, NotFoundError } from '../../middleware/errorHandler';
import { PLANS, BillingPlan, IBillingProvider } from './providers/billing.interface';
import { MockBillingProvider } from './providers/mock.provider';
import { StripeBillingProvider } from './providers/stripe.provider';
import { config } from '../../config';

const provider: IBillingProvider =
  config.billing.provider === 'stripe' ? new StripeBillingProvider() : new MockBillingProvider();

export class BillingService {
  async getSubscription(userId: string) {
    const member = await prisma.employerMember.findFirst({
      where: { userId },
      include: { employer: { include: { subscription: true } } },
    });
    if (!member) throw new NotFoundError('Employer');

    const sub = member.employer.subscription;
    if (!sub) {
      // Create free subscription
      return prisma.subscription.create({
        data: { employerId: member.employerId, plan: 'FREE', jobPostsLimit: 3 },
      });
    }

    return sub;
  }

  async subscribe(userId: string, plan: BillingPlan) {
    const member = await prisma.employerMember.findFirst({
      where: { userId },
      include: { employer: { include: { subscription: true } } },
    });
    if (!member) throw new NotFoundError('Employer');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const planDetails = PLANS[plan];

    const result = await provider.createSubscription(member.employerId, user!.email, plan);

    const sub = await prisma.subscription.upsert({
      where: { employerId: member.employerId },
      update: {
        plan,
        status: result.status as 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED',
        provider: config.billing.provider,
        providerSubId: result.providerSubId,
        jobPostsLimit: planDetails.jobPostsLimit,
        featuredPostsLimit: planDetails.featuredPostsLimit,
        candidateSearchEnabled: planDetails.candidateSearchEnabled,
        currentPeriodEnd: result.currentPeriodEnd,
        currentPeriodStart: new Date(),
        jobPostsUsed: 0, // Reset quota on plan change
      },
      create: {
        employerId: member.employerId,
        plan,
        status: result.status as 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED',
        provider: config.billing.provider,
        providerSubId: result.providerSubId,
        jobPostsLimit: planDetails.jobPostsLimit,
        featuredPostsLimit: planDetails.featuredPostsLimit,
        candidateSearchEnabled: planDetails.candidateSearchEnabled,
        currentPeriodEnd: result.currentPeriodEnd,
      },
    });

    return { subscription: sub, checkoutUrl: result.checkoutUrl };
  }

  async cancel(userId: string) {
    const member = await prisma.employerMember.findFirst({
      where: { userId },
      include: { employer: { include: { subscription: true } } },
    });
    if (!member?.employer.subscription) throw new NotFoundError('Subscription');

    const sub = member.employer.subscription;
    if (sub.providerSubId) {
      await provider.cancelSubscription(sub.providerSubId);
    }

    await prisma.subscription.update({
      where: { employerId: member.employerId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    return { message: 'Subscription cancelled' };
  }

  async getPlans() {
    return Object.values(PLANS);
  }
}
