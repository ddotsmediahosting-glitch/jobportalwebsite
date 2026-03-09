import { apiSuccess } from "@/server/http/api-response";
import { listLeads } from "@/server/leads/store";

export async function GET() {
  const leads = await listLeads();

  return apiSuccess({
    status: "ok",
    service: "ddotsmedia-it-solutions",
    timestamp: new Date().toISOString(),
    leadCount: leads.length,
  });
}
