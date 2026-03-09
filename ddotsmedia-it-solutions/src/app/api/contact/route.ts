import { apiError, apiSuccess } from "@/server/http/api-response";
import { getRequestContext } from "@/server/http/request-context";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { submitLead } from "@/server/leads/submit-lead";
import { isSpamSubmission } from "@/server/spam/check";
import { contactSchema } from "@/validation/contact";

export async function POST(request: Request) {
  const context = await getRequestContext();
  const limit = enforceRateLimit(
    `contact:${context.ip}`,
    Number(process.env.RATE_LIMIT_MAX ?? 15),
    Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  );

  if (!limit.allowed) {
    return apiError("Too many requests", 429, { retryAfterMs: limit.retryAfterMs });
  }

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Validation failed", 400, parsed.error.flatten());
  }

  const spam = isSpamSubmission(parsed.data);
  if (spam.spam) {
    return apiError("Submission rejected", 400, spam);
  }

  const result = await submitLead("contact", parsed.data, context);

  return apiSuccess(result);
}
