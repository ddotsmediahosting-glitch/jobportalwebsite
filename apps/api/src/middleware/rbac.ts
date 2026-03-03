import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@uaejobs/shared";

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
