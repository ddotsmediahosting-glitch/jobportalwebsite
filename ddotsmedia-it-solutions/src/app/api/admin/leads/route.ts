import { isAdminAuthenticated } from "@/server/admin/auth";
import { apiError, apiSuccess } from "@/server/http/api-response";
import { listLeads } from "@/server/leads/store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized", 401);
  }

  const leads = await listLeads();
  return apiSuccess({ leads });
}
