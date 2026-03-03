import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function BillingPage() {
  const { data } = useQuery({ queryKey: ["employer"], queryFn: async () => (await api.get("/api/v1/employers/me")).data });
  const upgrade = useMutation({ mutationFn: async (plan: string) => (await api.post("/api/v1/employers/subscription", { plan })).data });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Billing & Plans</h1>
      <p>Current: {data?.subscription?.plan || "FREE"}</p>
      <div className="flex gap-2">
        <button className="rounded border px-3 py-1" onClick={() => upgrade.mutate("FREE")}>Free</button>
        <button className="rounded border px-3 py-1" onClick={() => upgrade.mutate("STANDARD")}>Standard</button>
        <button className="rounded border px-3 py-1" onClick={() => upgrade.mutate("PREMIUM")}>Premium</button>
      </div>
    </div>
  );
}
