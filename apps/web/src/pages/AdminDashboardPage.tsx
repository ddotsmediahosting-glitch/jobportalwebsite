import { useAdminDashboard } from "../features/admin/hooks";

export function AdminDashboardPage() {
  const { data } = useAdminDashboard();
  return (
    <div className="grid gap-3 md:grid-cols-5">
      <div className="rounded border bg-white p-3">Users: {data?.users ?? 0}</div>
      <div className="rounded border bg-white p-3">Employers: {data?.employers ?? 0}</div>
      <div className="rounded border bg-white p-3">Jobs: {data?.jobs ?? 0}</div>
      <div className="rounded border bg-white p-3">Applications: {data?.applications ?? 0}</div>
      <div className="rounded border bg-white p-3">Open Reports: {data?.openReports ?? 0}</div>
    </div>
  );
}
