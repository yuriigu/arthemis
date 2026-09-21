import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppController } from './../src/app.controller.js';
import { AppService } from './../src/app.service.js';
import { HealthModule } from './../src/health/health.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * Stub do PrismaService: os testes e2e validam o contrato HTTP sem depender de
 * um banco real. A verificação com o Postgres de verdade é feita via
 * `docker compose up -d` + `curl http://localhost:8081/healthcheck`.
 */
function createPrismaStub(queryRaw: () => Promise<unknown>) {
  return {
    $queryRaw: vi.fn(queryRaw),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  async function initApp(prisma: unknown): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        HealthModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it('GET / responde "Hello World!"', async () => {
    await initApp(createPrismaStub(async () => [{ '?column?': 1 }]));

    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('GET /healthcheck', () => {
    it('retorna 200 + status ok quando o banco responde ao ping', async () => {
      await initApp(createPrismaStub(async () => [{ '?column?': 1 }]));

      const response = await request(app.getHttpServer())
        .get('/healthcheck')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'arthemis-api',
        timestamp: expect.any(String),
        checks: { database: { status: 'up', message: expect.any(String) } },
      });
    });

    it('retorna 503 + status degraded quando o banco está fora', async () => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      await initApp(
        createPrismaStub(async () => {
          throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/healthcheck')
        .expect(503);

      expect(response.body).toEqual({
        status: 'degraded',
        service: 'arthemis-api',
        timestamp: expect.any(String),
        checks: {
          database: {
            status: 'down',
            message: 'connect ECONNREFUSED 127.0.0.1:5432',
          },
        },
      });
    });
  });
});

