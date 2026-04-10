import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError, UnauthorizedError } from './errorHandler';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// ─── Employer ownership / membership check ─────────────────────────────────────

export async function requireEmployerAccess(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) throw new UnauthorizedError();

  // Admins bypass employer checks
  if (req.user.role === 'ADMIN' || req.user.role === 'SUB_ADMIN') {
    return next();
  }

  // Find the employer associated with this user
  const member = await prisma.employerMember.findFirst({
    where: { userId: req.user.sub, employer: { isActive: true } },
    include: { employer: true },
  });

  if (!member) throw new ForbiddenError('Not a member of any employer organisation');

  // Attach employer info to request
  (req as AuthRequest & { employer: typeof member.employer; employerRole: string }).employer =
    member.employer;
  (req as AuthRequest & { employer: typeof member.employer; employerRole: string }).employerRole =
    member.role;

  next();
}

// ─── Require specific employer team role ───────────────────────────────────────

export function requireEmployerRole(...roles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === 'ADMIN' || req.user.role === 'SUB_ADMIN') return next();

    const member = await prisma.employerMember.findFirst({
      where: { userId: req.user.sub },
    });

    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenError('Insufficient employer permissions');
    }

    next();
  };
}

// ─── Audit log helper ──────────────────────────────────────────────────────────

export async function auditLog(
  actorUserId: string | null,
  actorRole: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: Record<string, unknown>,
  req?: AuthRequest
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole,
        action,
        targetType,
        targetId,
        metaJson: meta as Prisma.InputJsonValue | undefined,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    });
  } catch (err) {
    console.error('[auditLog] failed to write audit entry:', err);
  }
}
