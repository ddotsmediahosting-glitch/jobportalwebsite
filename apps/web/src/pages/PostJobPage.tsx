import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";

export function PostJobPage() {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/api/v1/categories")).data });
  const [title, setTitle] = useState("Frontend Engineer");
  const [description, setDescription] = useState("Build and maintain user interfaces for a UAE-based marketplace platform.");
  const [categoryId, setCategoryId] = useState("");

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/v1/jobs", {
          title,
          description,
          categoryId,
          emirate: "Dubai",
          locationText: "Dubai",
          salaryMin: 8000,
          salaryMax: 12000,
          currency: "AED",
          negotiable: false,
          workMode: "HYBRID",
          employmentType: "FULL_TIME",
          visa: "VISA_PROVIDED",
          experienceMin: 2,
          experienceMax: 4,
          immediateJoiner: false,
          languageRequirements: ["English"],
          skills: ["React", "TypeScript"],
          benefits: ["Medical"],
          screeningQuestions: [{ question: "Do you have UAE experience?", type: "YES_NO" }]
        })
      ).data
  });

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Post Job</h1>
      <input className="w-full rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full rounded border p-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
      <select className="w-full rounded border p-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Select category</option>
        {(categories || []).map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button className="rounded bg-brand-700 px-3 py-2 text-white" onClick={() => create.mutate()}>Create Draft</button>
      {create.data ? <pre className="rounded border bg-white p-2 text-xs">{JSON.stringify(create.data, null, 2)}</pre> : null}
    </div>
  );
}
