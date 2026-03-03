import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";

export function CompanyProfilePage() {
  const { data } = useQuery({ queryKey: ["employer-me"], queryFn: async () => (await api.get("/api/v1/employers/me")).data });
  const [companyName, setCompanyName] = useState("");
  const save = useMutation({ mutationFn: async () => (await api.put("/api/v1/employers/me", { companyName })).data });

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Company Profile</h1>
      <p>Current: {data?.companyName}</p>
      <input className="rounded border p-2" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      <button className="rounded bg-brand-700 px-3 py-2 text-white" onClick={() => save.mutate()}>Save</button>
      <p className="text-sm">Verification: {data?.verifiedStatus}</p>
    </div>
  );
}
