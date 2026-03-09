import { sendAdminLeadNotification } from "@/server/email";
import type { RequestContext } from "@/server/http/request-context";
import { persistLead } from "@/server/leads/store";
import { logEvent } from "@/server/logging/logger";

export async function submitLead(
  channel: string,
  payload: unknown,
  context: RequestContext,
) {
  const reference = `lead_${Date.now()}`;

  await persistLead({
    id: reference,
    channel,
    createdAt: new Date().toISOString(),
    payload,
    context,
  });

  await sendAdminLeadNotification({
    channel,
    reference,
    payload,
  });

  logEvent("info", `Lead received via ${channel}`, { reference, context, payload });

  return {
    ok: true,
    reference,
  };
}
