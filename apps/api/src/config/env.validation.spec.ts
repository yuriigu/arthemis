import { envValidationSchema } from './env.validation.js';

describe('envValidationSchema', () => {
  const requiredValues = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/arthemis',
    JWT_SECRET: 'a-secret-that-is-at-least-thirty-two-characters',
  };

  it('provides defaults for the global rate limiter', () => {
    const config = envValidationSchema.parse(requiredValues);

    expect(config.THROTTLE_TTL).toBe(60_000);
    expect(config.THROTTLE_LIMIT).toBe(100);
  });

  it('rejects non-positive rate limiter values', () => {
    expect(() =>
      envValidationSchema.parse({
        ...requiredValues,
        THROTTLE_TTL: '0',
      }),
    ).toThrow();
    expect(() =>
      envValidationSchema.parse({
        ...requiredValues,
        THROTTLE_LIMIT: '-1',
      }),
    ).toThrow();
  });
});
