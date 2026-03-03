import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function ProfilePage() {
  const { data } = useQuery({ queryKey: ["profile"], queryFn: async () => (await api.get("/api/v1/users/me")).data });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <pre className="overflow-auto rounded border bg-white p-3 text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
