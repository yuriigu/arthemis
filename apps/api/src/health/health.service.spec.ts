import { HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

const SERVICE_NAME = 'arthemis-api';

/** Erro no formato devolvido pelo Prisma 7 com driver adapter (código P2010). */
function createDriverAdapterError(cause: Record<string, unknown>): Error {
  const error = new Error(
    '\nInvalid `prisma.$queryRaw()` invocation:\n\n\nRaw query failed.',
  );

  Object.assign(error, {
    code: 'P2010',
    meta: { driverAdapterError: { name: 'DriverAdapterError', cause } },
  });

  return error;
}

describe('HealthService', () => {
  let queryRaw: ReturnType<typeof vi.fn>;
  let service: HealthService;

  beforeEach(() => {
    queryRaw = vi.fn();

    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const configService = {
      get: vi.fn((key: string, defaultValue: unknown) =>
        key === 'SERVICE_NAME' ? SERVICE_NAME : defaultValue,
      ),
    } as unknown as ConfigService;

    service = new HealthService(prisma, configService);

    // Sem ruído: o erro do banco é esperado nos cenários de degradação.
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns 200 + status ok when the database ping succeeds', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.body).toEqual({
      status: 'ok',
      service: SERVICE_NAME,
      timestamp: expect.any(String),
      checks: { database: { status: 'up', message: expect.any(String) } },
    });
  });

  it('returns 503 + status degraded when the database is unreachable', async () => {
    queryRaw.mockRejectedValue(
      createDriverAdapterError({
        kind: 'DatabaseNotReachable',
        host: '127.0.0.1',
        port: 5432,
      }),
    );

    const result = await service.check();

    expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(result.body.status).toBe('degraded');
    expect(result.body.checks.database).toEqual({
      status: 'down',
      message: 'database is unreachable at 127.0.0.1:5432',
    });
  });

  it('returns 503 + the driver reason when the credentials are invalid', async () => {
    queryRaw.mockRejectedValue(
      createDriverAdapterError({
        kind: 'AuthenticationFailed',
        originalCode: '28P01',
        originalMessage:
          'password authentication failed for user "arthemis_user"',
      }),
    );

    const result = await service.check();

    expect(result.body.checks.database).toEqual({
      status: 'down',
      message:
        'database ping failed: password authentication failed for user "arthemis_user"',
    });
  });

  it('never returns a multiline message', async () => {
    queryRaw.mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:5432\n\nsecond line'),
    );

    const result = await service.check();

    expect(result.body.checks.database.message).toBe(
      'connect ECONNREFUSED 127.0.0.1:5432 second line',
    );
  });

  it('returns 503 with a timeout message when the ping exceeds 2s', async () => {
    vi.useFakeTimers();
    // Ping que nunca resolve: simula o banco pendurado/travado.
    queryRaw.mockReturnValue(new Promise(() => undefined));

    const pending = service.check();
    await vi.advanceTimersByTimeAsync(2_000);
    const result = await pending;

    expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(result.body.status).toBe('degraded');
    expect(result.body.checks.database).toEqual({
      status: 'down',
      message: 'database ping timed out after 2000ms',
    });
  });

  it('returns an ISO 8601 timestamp', async () => {
    queryRaw.mockResolvedValue([]);

    const result = await service.check();

    expect(new Date(result.body.timestamp).toISOString()).toBe(
      result.body.timestamp,
    );
  });
});
