import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service.js';

const DATABASE_URL =
  'postgresql://arthemis_user:arthemis_password@localhost:5432/arthemis_db?schema=public';

describe('PrismaService', () => {
  let configService: ConfigService;
  let service: PrismaService;
  let connect: ReturnType<typeof vi.fn>;
  let queryRaw: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    configService = {
      getOrThrow: vi.fn().mockReturnValue(DATABASE_URL),
    } as unknown as ConfigService;

    service = new PrismaService(configService);
    connect = vi.spyOn(service, '$connect') as unknown as ReturnType<
      typeof vi.fn
    >;
    queryRaw = vi.spyOn(service, '$queryRaw') as unknown as ReturnType<
      typeof vi.fn
    >;
    disconnect = vi.spyOn(service, '$disconnect') as unknown as ReturnType<
      typeof vi.fn
    >;

    connect.mockResolvedValue(undefined);
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    disconnect.mockResolvedValue(undefined);

    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads DATABASE_URL from the configuration', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('connects and pings the database on module init', async () => {
    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('aborts the bootstrap when the database is unreachable (fail-fast)', async () => {
    queryRaw.mockRejectedValue(
      new Error("Can't reach database server at 127.0.0.1:5432"),
    );

    await expect(service.onModuleInit()).rejects.toThrow(
      'Database is unreachable during startup',
    );
  });

  it('closes the connection pool on module destroy', async () => {
    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
