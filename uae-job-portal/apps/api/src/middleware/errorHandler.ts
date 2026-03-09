import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(errors: string[]) {
    super(422, 'Validation failed', errors);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      errors: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Prisma unique constraint
  if ((err as { code?: string }).code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'A record with these details already exists',
    });
    return;
  }

  // Prisma not-found
  if ((err as { code?: string }).code === 'P2025') {
    res.status(404).json({ success: false, error: 'Record not found' });
    return;
  }

  // ── Anthropic / AI SDK errors ─────────────────────────────────────────────
  const anyErr = err as { status?: number; name?: string; message?: string };

  if (anyErr.name === 'AuthenticationError' || anyErr.status === 401) {
    res.status(503).json({
      success: false,
      error: 'AI service is not configured. Please add a valid ANTHROPIC_API_KEY in your .env file.',
    });
    return;
  }
  if (anyErr.name === 'RateLimitError' || anyErr.status === 429) {
    res.status(429).json({
      success: false,
      error: 'AI rate limit reached. Please wait a moment and try again.',
    });
    return;
  }
  if (anyErr.status === 529) {
    res.status(503).json({
      success: false,
      error: 'AI service is temporarily overloaded. Please try again in a moment.',
    });
    return;
  }
  if (
    anyErr.name === 'APIError' ||
    anyErr.name === 'APIConnectionError' ||
    anyErr.name === 'APITimeoutError'
  ) {
    console.error('[AI Error]', err);
    res.status(502).json({
      success: false,
      error: 'AI service returned an error. Please try again.',
      ...(config.env === 'development' ? { detail: anyErr.message } : {}),
    });
    return;
  }

  console.error('[Error]', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(config.env === 'development' ? { detail: String(err) } : {}),
  });
}
