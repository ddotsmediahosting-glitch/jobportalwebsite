import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role as "JOB_SEEKER" | "EMPLOYER" | "ADMIN" | "SUB_ADMIN",
      employerId: payload.employerId
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
