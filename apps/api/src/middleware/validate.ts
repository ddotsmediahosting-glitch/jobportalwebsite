import type { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>, source: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({ message: "Validation error", errors: result.error.flatten() });
    }
    req[source] = result.data as never;
    next();
  };
}
