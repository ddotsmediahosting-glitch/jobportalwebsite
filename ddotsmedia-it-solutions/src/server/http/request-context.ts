import { headers } from "next/headers";

export type RequestContext = {
  ip: string;
  userAgent: string;
  referer: string;
  correlationId: string;
};

export async function getRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();

  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "unknown",
    userAgent: headerStore.get("user-agent") ?? "unknown",
    referer: headerStore.get("referer") ?? "",
    correlationId:
      headerStore.get("x-request-id") ??
      `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}
