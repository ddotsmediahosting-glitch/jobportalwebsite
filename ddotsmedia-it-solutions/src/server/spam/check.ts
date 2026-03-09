type SpamInput = {
  website?: string;
  submittedAt?: string;
};

export function isSpamSubmission(input: SpamInput) {
  if (input.website && input.website.trim().length > 0) {
    return { spam: true, reason: "honeypot_triggered" };
  }

  if (input.submittedAt) {
    const submittedAt = Number(input.submittedAt);

    if (Number.isFinite(submittedAt)) {
      const elapsed = Date.now() - submittedAt;

      if (elapsed < 1500) {
        return { spam: true, reason: "submitted_too_fast" };
      }
    }
  }

  return { spam: false as const };
}
