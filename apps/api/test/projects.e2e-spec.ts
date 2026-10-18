import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module.js';
import { configureApp } from '../src/config/app.setup.js';
import { ProjectsModule } from '../src/modules/projects/projects.module.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProponentsModule } from '../src/modules/proponents/proponents.module.js';
import { ProponentsRepository } from '../src/modules/proponents/proponents.repository.js';
import { SdgsModule } from '../src/modules/sdgs/sdgs.module.js';
import { SdgsRepository } from '../src/modules/sdgs/sdgs.repository.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Testes end-to-end do contrato HTTP de projetos (Issue #28).
 *
 * Valida o pipeline HTTP completo: rotas, autenticação JWT, validação de DTOs
 * com ValidationPipe global (status 400), códigos de status 201/200/204/404/409,
 * envelope padronizado de paginação e integridade de formato de data civil.
 */
const TEST_SECRET = 'e2e-jwt-secret-0123456789-abcdefghijklmnopqrstuv';
const MAIN_PROPONENT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const SECONDARY_PROPONENT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const PROJECT_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';

process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_EXPIRES_IN = '24h';

describe('Projects (e2e)', () => {
  const sampleMainProponent = {
    id: MAIN_PROPONENT_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleSecondaryProponent = {
    id: SECONDARY_PROPONENT_ID,
    name: 'Parceiro Sustentável',
    email: 'parceiro@sustentavel.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleSdg1 = {
    id: 'sdg-uuid-1',
    number: 1,
    name: 'No Poverty',
    iconUrl: 'https://exemplo.org/sdg/1.png',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleProjectRecord = {
    id: PROJECT_ID,
    name: 'Reflorestamento Comunitário',
    lifetimeStart: new Date(Date.UTC(2026, 0, 15, 0, 0, 0, 0)),
    lifetimeEnd: new Date(Date.UTC(2026, 11, 31, 0, 0, 0, 0)),
    justification: 'Recuperação de mata nativa',
    proponentId: MAIN_PROPONENT_ID,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    proponent: sampleMainProponent,
    projectProponents: [
      {
        id: 'pp-uuid-1',
        projectId: PROJECT_ID,
        proponentId: SECONDARY_PROPONENT_ID,
        role: 'Co-executor',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
        proponent: sampleSecondaryProponent,
      },
    ],
    projectSdgs: [
      {
        id: 'ps-uuid-1',
        projectId: PROJECT_ID,
        sdgId: sampleSdg1.id,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
        sdg: sampleSdg1,
      },
    ],
  };

  const projectsRepoMock = {
    createTransactional: vi.fn(),
    findPaginated: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    updateTransactional: vi.fn(),
    softDelete: vi.fn(),
  };

  const proponentsRepoMock = {
    findById: vi.fn(),
  };

  const sdgsRepoMock = {
    findByNumbers: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNumber: vi.fn(),
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
        ProponentsModule,
        SdgsModule,
        ProjectsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: vi.fn() } })
      .overrideProvider(ProjectsRepository)
      .useValue(projectsRepoMock)
      .overrideProvider(ProponentsRepository)
      .useValue(proponentsRepoMock)
      .overrideProvider(SdgsRepository)
      .useValue(sdgsRepoMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    token = await new JwtService({ secret: TEST_SECRET }).signAsync({
      sub: MAIN_PROPONENT_ID,
      email: 'admin@arthemis.test',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    proponentsRepoMock.findById.mockImplementation((id: string) => {
      if (id === MAIN_PROPONENT_ID) return Promise.resolve(sampleMainProponent);
      if (id === SECONDARY_PROPONENT_ID) return Promise.resolve(sampleSecondaryProponent);
      return Promise.resolve(null);
    });

    sdgsRepoMock.findByNumbers.mockResolvedValue([sampleSdg1]);
    projectsRepoMock.createTransactional.mockResolvedValue(sampleProjectRecord);
    projectsRepoMock.findById.mockResolvedValue(sampleProjectRecord);
    projectsRepoMock.findPaginated.mockResolvedValue([sampleProjectRecord]);
    projectsRepoMock.count.mockResolvedValue(1);
    projectsRepoMock.updateTransactional.mockResolvedValue(sampleProjectRecord);
    projectsRepoMock.softDelete.mockResolvedValue(undefined);
  });

  describe('Autenticação de rotas (JwtAuthGuard)', () => {
    it('todas as rotas respondem 401 sem token Bearer', async () => {
      await request(app.getHttpServer()).get('/projects').expect(401);
      await request(app.getHttpServer()).post('/projects').send({}).expect(401);
      await request(app.getHttpServer()).get(`/projects/${PROJECT_ID}`).expect(401);
      await request(app.getHttpServer()).patch(`/projects/${PROJECT_ID}`).send({}).expect(401);
      await request(app.getHttpServer()).delete(`/projects/${PROJECT_ID}`).expect(401);
    });
  });

  describe('POST /projects', () => {
    const validPayload = {
      name: 'Reflorestamento Comunitário',
      lifetimeStart: '2026-01-15',
      lifetimeEnd: '2026-12-31',
      justification: 'Recuperação florestal',
      proponentId: MAIN_PROPONENT_ID,
      proponents: [{ proponentId: SECONDARY_PROPONENT_ID, role: 'Co-executor' }],
      sdgIds: [1],
    };

    it('responde 201 Created para criação válida com proponente principal, secundários e ODS', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send(validPayload)
        .expect(201);

      expect(response.body).toHaveProperty('id', PROJECT_ID);
      expect(response.body.lifetimeStart).toBe('2026-01-15');
      expect(response.body.lifetimeEnd).toBe('2026-12-31');
      expect(response.body.proponent.id).toBe(MAIN_PROPONENT_ID);
      expect(response.body.proponents).toHaveLength(1);
      expect(response.body.sdgs).toHaveLength(1);
    });

    it('rejeita formato de data civil inválido com 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send({ ...validPayload, lifetimeStart: '15/01/2026' })
        .expect(400);
    });

    it('rejeita data civil inexistente com 400 Bad Request (ex: 2026-02-30)', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send({ ...validPayload, lifetimeStart: '2026-02-30' })
        .expect(400);
    });

    it('rejeita lifetimeEnd anterior a lifetimeStart com 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send({
          ...validPayload,
          lifetimeStart: '2026-06-01',
          lifetimeEnd: '2026-05-31',
        })
        .expect(400);
    });

    it('rejeita lista de sdgIds vazia com 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send({ ...validPayload, sdgIds: [] })
        .expect(400);
    });

    it('responde 404 quando o proponente principal não existir', async () => {
      proponentsRepoMock.findById.mockImplementation((id: string) => {
        if (id === MAIN_PROPONENT_ID) return Promise.resolve(null);
        return Promise.resolve(sampleSecondaryProponent);
      });

      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send(validPayload)
        .expect(404);
    });

    it('responde 404 quando o proponente secundário não existir', async () => {
      proponentsRepoMock.findById.mockImplementation((id: string) => {
        if (id === MAIN_PROPONENT_ID) return Promise.resolve(sampleMainProponent);
        return Promise.resolve(null);
      });

      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send(validPayload)
        .expect(404);
    });

    it('responde 404 quando o ODS informado não existir', async () => {
      sdgsRepoMock.findByNumbers.mockResolvedValue([]);

      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send(validPayload)
        .expect(404);
    });

    it('responde 409 quando houver duplicidade de vínculos nos proponentes secundários', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set(...auth())
        .send({
          ...validPayload,
          proponents: [
            { proponentId: SECONDARY_PROPONENT_ID, role: 'Role A' },
            { proponentId: SECONDARY_PROPONENT_ID, role: 'Role B' },
          ],
        })
        .expect(409);
    });
  });

  describe('GET /projects', () => {
    it('responde 200 com envelope padronizado de paginação { data, meta }', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects?page=1&limit=10')
        .set(...auth())
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('proponent');
      expect(response.body.data[0]).toHaveProperty('sdgs');
    });

    it('rejeita parâmetro page inválido (0) com 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/projects?page=0')
        .set(...auth())
        .expect(400);
    });

    it('rejeita parâmetro limit excessivo (200) com 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/projects?limit=200')
        .set(...auth())
        .expect(400);
    });
  });

  describe('GET /projects/:id', () => {
    it('responde 200 com os dados completos do projeto', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .expect(200);

      expect(response.body.id).toBe(PROJECT_ID);
      expect(response.body.proponent.id).toBe(MAIN_PROPONENT_ID);
      expect(response.body.proponents).toHaveLength(1);
      expect(response.body.sdgs).toHaveLength(1);
    });

    it('responde 400 para id que não é UUID válido', async () => {
      await request(app.getHttpServer())
        .get('/projects/id-nao-uuid')
        .set(...auth())
        .expect(400);
    });

    it('responde 404 quando o projeto não for localizado', async () => {
      projectsRepoMock.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .expect(404);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('responde 200 atualizando campos parciais com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect(response.body.id).toBe(PROJECT_ID);
    });

    it('responde 404 quando o projeto a ser atualizado não existir', async () => {
      projectsRepoMock.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .send({ name: 'Novo Nome' })
        .expect(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('responde 204 No Content aplicando soft delete', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .expect(204);

      expect(projectsRepoMock.softDelete).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('responde 404 quando o projeto não existir', async () => {
      projectsRepoMock.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/projects/${PROJECT_ID}`)
        .set(...auth())
        .expect(404);
    });
  });
});
