import { useEmployerDashboard } from "../features/employer/hooks";

export function EmployerDashboardPage() {
  const { data } = useEmployerDashboard();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Employer Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border bg-white p-3">Views: {data?.analytics?.views ?? 0}</div>
        <div className="rounded border bg-white p-3">Applies: {data?.analytics?.applies ?? 0}</div>
        <div className="rounded border bg-white p-3">Conversion: {(data?.analytics?.conversion ?? 0).toFixed(2)}</div>
      </div>
    </div>
  );
}
