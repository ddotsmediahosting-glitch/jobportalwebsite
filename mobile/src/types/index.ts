// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export type Emirate =
  | 'ABU_DHABI' | 'DUBAI' | 'SHARJAH' | 'AJMAN'
  | 'UMM_AL_QUWAIN' | 'RAS_AL_KHAIMAH' | 'FUJAIRAH';

export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type EmploymentType =
  | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
  | 'TEMPORARY' | 'INTERNSHIP' | 'FREELANCE';
export type JobStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED'
  | 'PAUSED' | 'EXPIRED' | 'CLOSED' | 'REJECTED';
export type VisaStatus =
  | 'PROVIDED' | 'TRANSFER_AVAILABLE' | 'NOT_PROVIDED' | 'NOT_REQUIRED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  _count?: { jobs: number };
}

export interface Employer {
  id: string;
  companyName: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  emirate?: string | null;
  description?: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  emirate: Emirate;
  location?: string | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  status: JobStatus;
  isFeatured: boolean;
  isUrgent: boolean;
  isEmiratization: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  experienceMin?: number | null;
  experienceMax?: number | null;
  skills: string[];
  requirements?: string | null;
  benefits?: string | null;
  applicationDeadline?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  viewCount: number;
  employer: Employer;
  category: Category;
  isSaved?: boolean;
  hasApplied?: boolean;
}

export interface JobFilters {
  q?: string;
  categoryId?: string;
  emirate?: Emirate;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Seeker Profile ────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface SeekerProfile {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  emirate?: string | null;
  nationality?: string | null;
  avatarUrl?: string | null;
  skills: string[];
  languages: string[];
  portfolioUrl?: string | null;
  linkedInUrl?: string | null;
  desiredRole?: string | null;
  yearsOfExperience?: number | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  noticePeriod?: string | null;
  resumes: Resume[];
  profileViews: number;
}

// ── Applications ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'SUBMITTED' | 'VIEWED' | 'SHORTLISTED'
  | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter?: string | null;
  createdAt: string;
  updatedAt: string;
  job: Pick<Job, 'id' | 'title' | 'slug' | 'emirate' | 'workMode' | 'employer'>;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'APPLICATION_UPDATE' | 'JOB_ALERT' | 'PROFILE_VIEW'
  | 'INTERVIEW_INVITE' | 'SYSTEM' | 'PROMOTION';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  payloadJson?: Record<string, unknown> | null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  errors?: string[];
}
