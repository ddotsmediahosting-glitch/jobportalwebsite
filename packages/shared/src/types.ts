export type UserRole = "JOB_SEEKER" | "EMPLOYER" | "ADMIN" | "SUB_ADMIN";

export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "TEMPORARY"
  | "INTERNSHIP"
  | "FREELANCE";

export type VisaPolicy = "VISA_PROVIDED" | "TRANSFER_AVAILABLE" | "NOT_PROVIDED" | "NOT_REQUIRED";

export const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah"
] as const;
