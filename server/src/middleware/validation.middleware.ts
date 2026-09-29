import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  service: z.string().min(2, 'Service name must be at least 2 characters').max(100),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  environment: z.enum(['Production', 'Staging', 'Development']),
  errorMessage: z.string().min(5, 'Error message is required'),
  logs: z.string().optional(),
  tags: z.array(z.string()).optional(),
  autoInvestigate: z.boolean().optional(),
});

export const resolveIncidentSchema = z.object({
  confirmedRootCause: z.string().min(5, 'Confirmed root cause is required'),
  resolutionSteps: z.string().min(5, 'Resolution steps are required'),
  worked: z.boolean().default(true),
  notes: z.string().optional(),
  lessonsLearned: z.string().optional(),
  failedApproaches: z.array(z.string()).optional(),
  resolvedBy: z.string().optional(),
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      next(err);
    }
  };
}
