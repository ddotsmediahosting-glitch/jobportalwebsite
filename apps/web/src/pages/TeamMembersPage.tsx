import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";

export function TeamMembersPage() {
  const [email, setEmail] = useState("");
  const { data } = useQuery({ queryKey: ["team"], queryFn: async () => (await api.get("/api/v1/employers/me")).data });
  const invite = useMutation({ mutationFn: async () => (await api.post("/api/v1/employers/members/invite", { email, role: "RECRUITER" })).data });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Team Members</h1>
      <div className="flex gap-2">
        <input className="rounded border p-2" placeholder="recruiter@company.ae" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="rounded bg-brand-700 px-3 py-2 text-white" onClick={() => invite.mutate()}>Invite</button>
      </div>
      <ul className="space-y-2">
        {(data?.members || []).map((m: any) => (
          <li key={m.id} className="rounded border bg-white p-2 text-sm">{m.user?.email} - {m.role}</li>
        ))}
      </ul>
    </div>
  );
}
