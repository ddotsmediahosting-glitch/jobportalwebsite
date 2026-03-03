import { useParams } from "react-router-dom";
import { useApplyJob, useJobDetail } from "../features/jobs/hooks";
import { useState } from "react";

export function JobDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useJobDetail(slug);
  const [coverLetter, setCoverLetter] = useState("");
  const apply = useApplyJob(data?.id || "");

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Job not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <p>{data.description}</p>
      <p className="text-sm text-slate-600">{data.emirate} | {data.locationText} | Visa: {data.visa}</p>
      <textarea
        className="w-full rounded border p-2"
        rows={4}
        placeholder="Optional cover letter"
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
      />
      <button
        className="rounded bg-brand-700 px-4 py-2 text-white"
        onClick={() => apply.mutate({ coverLetter })}
      >
        One-click apply
      </button>
      {apply.isSuccess ? <p className="text-green-700">Application submitted.</p> : null}
    </div>
  );
}
