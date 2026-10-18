import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module.js';
import { configureApp } from '../src/config/app.setup.js';
import { SdgsModule } from '../src/modules/sdgs/sdgs.module.js';
import { SdgsRepository } from '../src/modules/sdgs/sdgs.repository.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Testes end-to-end do módulo de ODS (GET /sdgs).
 *
 * Valida o contrato HTTP:
 * 1. Proteção de autenticação (JwtAuthGuard) -> 401 sem token;
 * 2. Retorno com 200 OK dos 17 ODS ordenados por number;
 * 3. Estrutura completa dos campos públicos.
 */
const TEST_SECRET = 'e2e-jwt-secret-0123456789-abcdefghijklmnopqrstuv';

process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_EXPIRES_IN = '24h';

describe('SDGs (e2e)', () => {
  const mockAllSdgs = Array.from({ length: 17 }, (_, index) => {
    const num = index + 1;
    return {
      id: `sdg-uuid-${num}`,
      number: num,
      name: `ODS ${num}`,
      iconUrl: `https://exemplo.org/sdg/${num}.png`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
  });

  const repository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNumber: vi.fn(),
    findByNumbers: vi.fn(),
    count: vi.fn(),
  };

  let app: INestApplication;
  let token: string;

  const auth = (): [string, string] => ['Authorization', `Bearer ${token}`];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
        SdgsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: vi.fn() } })
      .overrideProvider(SdgsRepository)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    token = await new JwtService({ secret: TEST_SECRET }).signAsync({
      sub: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      email: 'admin@arthemis.test',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findAll.mockResolvedValue(mockAllSdgs);
  });

  describe('GET /sdgs', () => {
    it('responde 401 Unauthorized quando nenhum token for informado', async () => {
      await request(app.getHttpServer()).get('/sdgs').expect(401);
    });

    it('responde 200 com a lista completa dos 17 ODS', async () => {
      const response = await request(app.getHttpServer())
        .get('/sdgs')
        .set(...auth())
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(17);
      expect(response.body[0].number).toBe(1);
      expect(response.body[16].number).toBe(17);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('iconUrl');
      expect(response.body[0]).not.toHaveProperty('deletedAt');
    });
  });
});
