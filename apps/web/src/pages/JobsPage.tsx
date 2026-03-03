import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useJobs } from "../features/jobs/hooks";

export function JobsPage() {
  const [q, setQ] = useState("");
  const [emirate, setEmirate] = useState("");
  const params = useMemo(() => ({ q, emirate }), [q, emirate]);
  const { data, isLoading } = useJobs(params);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded border p-2" placeholder="Keyword" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="rounded border p-2" value={emirate} onChange={(e) => setEmirate(e.target.value)}>
          <option value="">All Emirates</option>
          <option>Dubai</option>
          <option>Abu Dhabi</option>
          <option>Sharjah</option>
          <option>Ajman</option>
          <option>Umm Al Quwain</option>
          <option>Ras Al Khaimah</option>
          <option>Fujairah</option>
        </select>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      <div className="grid gap-3">
        {(data?.items || []).map((job: any) => (
          <article key={job.id} className="rounded border bg-white p-4">
            <h2 className="text-lg font-semibold">{job.title}</h2>
            <p className="text-sm text-slate-600">{job.emirate} | {job.workMode} | {job.salaryMin}-{job.salaryMax} AED</p>
            <Link className="mt-2 inline-block text-brand-700" to={`/jobs/${job.slug}`}>View job</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
