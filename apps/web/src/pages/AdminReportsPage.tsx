import { useAdminReports } from "../features/admin/hooks";

export function AdminReportsPage() {
  const { data } = useAdminReports();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Reports</h1>
      {(data || []).map((r: any) => (
        <div key={r.id} className="rounded border bg-white p-2">{r.targetType} | {r.reason} | {r.status}</div>
      ))}
    </div>
  );
}
