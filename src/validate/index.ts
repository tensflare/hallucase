import { ZodError, ZodSchema } from 'zod'
import { CreateReportInput, SearchFilters } from '../schema.js'

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: Array<{ path: string; message: string }>,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = formatZodError(result.error)
    throw new ValidationError('Validation failed', issues)
  }
  return result.data
}

export function validateCreateReport(data: unknown): CreateReportInput {
  return validateOrThrow(CreateReportInput, data)
}

export function validateSearchFilters(data: unknown) {
  return validateOrThrow(SearchFilters, data)
}

export function validatePartialReport(data: unknown): Partial<CreateReportInput> {
  return validateOrThrow(CreateReportInput.partial(), data)
}
