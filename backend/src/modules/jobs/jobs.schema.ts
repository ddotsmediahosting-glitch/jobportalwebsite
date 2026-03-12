import { z } from 'zod';
import { createJobSchema, updateJobSchema, jobFiltersSchema } from '@uaejobs/shared';

export { createJobSchema, updateJobSchema, jobFiltersSchema };

export const reportJobSchema = z.object({
  reason: z.string().min(5).max(500),
  details: z.string().max(2000).optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'PAUSED', 'CLOSED']),
});
