"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  careerApplicationSchema,
  type CareerApplicationInput,
} from "@/validation/careers";

type CareerApplyFormProps = {
  roleSlug: string;
};

export function CareerApplyForm({ roleSlug }: CareerApplyFormProps) {
  const [message, setMessage] = useState("");
  const [submittedAt] = useState(() => Date.now().toString());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CareerApplicationInput>({
    resolver: zodResolver(careerApplicationSchema),
    defaultValues: {
      roleSlug,
      website: "",
      submittedAt,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage("");
    const response = await fetch("/api/careers/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    setMessage(
      response.ok
        ? "Application submitted successfully. Our hiring team will review it shortly."
        : "Application failed to send. Please try again.",
    );

    if (response.ok) {
      reset({ roleSlug });
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
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Phone</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("phone")}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Portfolio URL</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("portfolioUrl")}
            placeholder="https://"
          />
        </label>
      </div>
      <input type="hidden" {...register("website")} />
      <input type="hidden" {...register("submittedAt")} />
      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Cover Letter</span>
        <textarea
          className="min-h-36 w-full rounded-[1.5rem] border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
          {...register("coverLetter")}
        />
      </label>
      <input type="hidden" {...register("roleSlug")} />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-ink)]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting..." : "Apply Now"}
        </button>
        {message ? <p className="text-sm text-[var(--color-text-muted)]">{message}</p> : null}
      </div>
    </form>
  );
}
