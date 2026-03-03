import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function AdminCategoriesPage() {
  const { data } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await api.get("/api/v1/categories")).data });
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Categories</h1>
      {(data || []).map((c: any) => (
        <div key={c.id} className="rounded border bg-white p-2">{c.name} ({c.slug})</div>
      ))}
    </div>
  );
}
