import { prisma } from "../config/prisma.js";

export async function logAudit(input: {
  actorUserId?: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  metaJson?: unknown;
}) {
  await prisma.auditLog.create({ data: input as never });
}
