import { useAdminUsers } from "../features/admin/hooks";

export function AdminUsersPage() {
  const { data } = useAdminUsers();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Users Management</h1>
      {(data?.items || []).map((u: any) => (
        <div key={u.id} className="rounded border bg-white p-2 text-sm">
          {u.email} | {u.role} | {u.status}
        </div>
      ))}
    </div>
  );
}
