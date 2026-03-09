"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin#12345");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Login failed. Check the admin credentials.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin" as Route);
    router.refresh();
  }

  return (
    <form className="panel rounded-[2rem] p-8" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Admin Access</p>
          <h1 className="section-title mt-3">Sign in to manage site content.</h1>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Username</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        <button
          className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-ink)]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      </div>
    </form>
  );
}
