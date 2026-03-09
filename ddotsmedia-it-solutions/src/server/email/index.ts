import { logEvent } from "@/server/logging/logger";

export async function sendAdminLeadNotification(input: {
  channel: string;
  reference: string;
  payload: unknown;
}) {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "console") {
    logEvent("info", `Email notification (${input.channel})`, input);
    return;
  }

  logEvent("warn", "Non-console email provider not implemented yet", { provider });
}
