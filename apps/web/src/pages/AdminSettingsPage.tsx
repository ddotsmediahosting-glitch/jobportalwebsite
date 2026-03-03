export function AdminSettingsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Site Settings</h1>
      <p className="rounded border bg-white p-3 text-sm">
        Manage featured categories, homepage banners, legal content, and feature flags via `/admin/api/v1/settings`.
      </p>
    </div>
  );
}
