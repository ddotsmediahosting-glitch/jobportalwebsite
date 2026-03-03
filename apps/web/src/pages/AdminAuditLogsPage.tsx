import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function AdminAuditLogsPage() {
  const { data } = useQuery({ queryKey: ["audit"], queryFn: async () => (await api.get("/admin/api/v1/audit-logs")).data });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      {(data?.items || []).map((log: any) => (
        <div key={log.id} className="rounded border bg-white p-2 text-xs">
          {new Date(log.createdAt).toLocaleString()} | {log.actorRole} | {log.action}
        </div>
      ))}
    </div>
  );
}
