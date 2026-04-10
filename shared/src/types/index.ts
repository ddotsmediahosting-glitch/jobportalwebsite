// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';

export type Emirates =
  | 'ABU_DHABI'
  | 'DUBAI'
  | 'SHARJAH'
  | 'AJMAN'
  | 'UMM_AL_QUWAIN'
  | 'RAS_AL_KHAIMAH'
  | 'FUJAIRAH';

export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'TEMPORARY'
  | 'INTERNSHIP'
  | 'FREELANCE';

export type VisaStatus =
  | 'PROVIDED'
  | 'TRANSFER_AVAILABLE'
  | 'NOT_PROVIDED'
  | 'NOT_REQUIRED';

export type JobStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'REJECTED';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubscriptionPlan = 'FREE' | 'STANDARD' | 'PREMIUM';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'JOB' | 'EMPLOYER' | 'USER';

// ─── Const maps (used in both front and back) ─────────────────────────────────

export const EMIRATES_LABELS: Record<Emirates, string> = {
  ABU_DHABI: 'Abu Dhabi',
  DUBAI: 'Dubai',
  SHARJAH: 'Sharjah',
  AJMAN: 'Ajman',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  PROVIDED: 'Visa Provided',
  TRANSFER_AVAILABLE: 'Transfer Available',
  NOT_PROVIDED: 'Not Provided',
  NOT_REQUIRED: 'Not Required',
};

export const JOB_LEVEL_OPTIONS = ['Junior', 'Mid', 'Senior', 'Manager', 'Director', 'C-Level'];

// ─── API response shapes ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Domain types ──────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verifiedAt: string | null;
  createdAt: string;
}

export interface JobSeekerProfilePublic {
  id: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  emirate: Emirates | null;
  skills: string[];
  languages: string[];
  avatarUrl: string | null;
}

export interface EmployerPublic {
  id: string;
  companyName: string;
  slug: string;
  industry: string | null;
  emirate: Emirates | null;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  iconUrl: string | null;
  children: CategoryNode[];
  _count?: { jobs: number };
}

export interface JobListItem {
  id: string;
  title: string;
  slug: string;
  emirate: Emirates;
  workMode: WorkMode;
  employmentType: EmploymentType;
  visaStatus: VisaStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryNegotiable: boolean;
  experienceMin: number;
  experienceMax: number | null;
  level: string | null;
  skills: string[];
  isFeatured: boolean;
  isUrgent: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  employer: Pick<EmployerPublic, 'id' | 'companyName' | 'slug' | 'logoUrl' | 'emirate'>;
  category: { id: string; name: string; slug: string; parent?: { id: string; name: string; slug: string } | null };
  _count?: { applications: number };
}

export interface JobFilters {
  q?: string;
  categoryId?: string;
  emirate?: Emirates;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  visaStatus?: VisaStatus;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  level?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'salaryMin' | 'relevance';
}

export interface ApplicationWithJob {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job: JobListItem;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: string;
  jobPostsLimit: number;
  jobPostsUsed: number;
  featuredPostsLimit: number;
  candidateSearchEnabled: boolean;
  currentPeriodEnd: string | null;
}
