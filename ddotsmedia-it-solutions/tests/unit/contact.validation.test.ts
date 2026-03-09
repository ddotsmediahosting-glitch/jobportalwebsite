import { describe, expect, it } from "vitest";
import { contactSchema } from "@/validation/contact";

describe("contactSchema", () => {
  it("accepts a valid contact submission", () => {
    const result = contactSchema.safeParse({
      fullName: "Amina Rahman",
      email: "amina@example.com",
      company: "Northstar Group",
      serviceInterest: "Web Development",
      message: "We need a new company website with lead capture and analytics.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a submission with a short message", () => {
    const result = contactSchema.safeParse({
      fullName: "Amina Rahman",
      email: "amina@example.com",
      company: "Northstar Group",
      serviceInterest: "Web Development",
      message: "Too short",
    });

    expect(result.success).toBe(false);
  });
});
