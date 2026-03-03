import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white">
        <h1 className="text-3xl font-bold">Online UAE Job Portal</h1>
        <p className="mt-2 text-white/90">Find jobs by emirate, category, visa policy, salary range, and experience.</p>
        <div className="mt-4 flex gap-3">
          <Link className="rounded bg-white px-4 py-2 font-semibold text-brand-700" to="/jobs">Browse Jobs</Link>
          <Link className="rounded border border-white px-4 py-2" to="/employer/post-job">Post a Job</Link>
        </div>
      </section>
    </div>
  );
}
