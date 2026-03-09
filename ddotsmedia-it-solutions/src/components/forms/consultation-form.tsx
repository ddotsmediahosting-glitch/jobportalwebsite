"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  consultationSchema,
  type ConsultationInput,
} from "@/validation/consultation";

export function ConsultationForm() {
  const [message, setMessage] = useState("");
  const [submittedAt] = useState(() => Date.now().toString());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      website: "",
      submittedAt,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage("");
    const response = await fetch("/api/consultation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    setMessage(
      response.ok
        ? "Consultation request sent. We will reach out to confirm the next step."
        : "Consultation request failed. Please try again.",
    );

    if (response.ok) {
      reset();
    }
  });

  return (
    <form className="panel rounded-[1.75rem] p-6" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Full Name</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("fullName")}
          />
          {errors.fullName && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.fullName.message}
            </span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("email")}
          />
          {errors.email && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Phone</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("phone")}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Company</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("company")}
          />
        </label>
      </div>
      <input type="hidden" {...register("website")} />
      <input type="hidden" {...register("submittedAt")} />
      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Project Scope</span>
        <textarea
          className="min-h-36 w-full rounded-[1.5rem] border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
          {...register("projectScope")}
        />
      </label>
      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Preferred Timeline</span>
        <input
          className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
          {...register("preferredTimeline")}
          placeholder="e.g. launch in 6 weeks"
        />
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-ink)]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting..." : "Request Consultation"}
        </button>
        {message ? (
          <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        ) : null}
      </div>
    </form>
  );
}
