import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container-shell flex min-h-[70vh] items-center justify-center py-20"
    >
      <div className="panel max-w-2xl rounded-[2rem] p-10 text-center">
        <p className="eyebrow">404</p>
        <h1 className="section-title mt-4">The page you requested is not available.</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          The route exists in the architecture, but this specific page could not be
          resolved.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-ink)]"
          href="/"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
