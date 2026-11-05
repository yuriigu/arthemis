import { z } from 'zod';

const EnvironmentSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_TOKEN: z.string().min(1),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    API_PREFIX: z.string().default('api'),
    CORS_ORIGINS: z.string().default('http://localhost:3001'),
  })
  .passthrough();

export const environmentValidationSchema = {
  validate(config: Record<string, unknown>) {
    const result = EnvironmentSchema.safeParse(config);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return { error: new Error(message), value: config };
    }

    return { value: result.data };
  },
};
