import type { UserRole } from "@uaejobs/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
        employerId?: string;
      };
    }
  }
}

export {};
