import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module.js';
import { configureApp } from '../src/config/app.setup.js';
import { ProponentsModule } from '../src/modules/proponents/proponents.module.js';
import { ProponentsRepository } from '../src/modules/proponents/proponents.repository.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Contrato HTTP do módulo de proponentes (critérios de aceitação da issue #27):
 *
 * 1. todas as rotas exigem Bearer válido (`JwtAuthGuard`) → 401 sem token;
 * 2. `GET /proponents` devolve `200 []` sem registros e repassa o `?search=`;
 * 3. `POST /proponents` → 201; 400 para payload inválido; 409 para e-mail duplicado;
 * 4. `GET /proponents/:id` → 200/404/400 (id não-UUID);
 * 5. `PATCH /proponents/:id` → 200, 404 e 409 de e-mail;
 * 6. `DELETE /proponents/:id` → 204 (soft delete); 409 com projetos/usuários.
 *
 * O repositório é substituído por um stub (mesma estratégia de
 * `users.e2e-spec.ts`): validamos status/contrato sem depender de banco. As
 * verificações com o Postgres real ficam em `proponents.integration-spec.ts`.
 *
 * O `AuthModule` é importado junto do `ProponentsModule` de propósito: ele
 * registra a estratégia `jwt` (`JwtStrategy`) que o `JwtAuthGuard` consome.
 */
const TEST_SECRET = 'e2e-jwt-secret-0123456789-abcdefghijklmnopqrstuv';
const PROPONENT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_PROPONENT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

// Definido ANTES do boot: o `JwtModule.registerAsync` do AuthModule lê
// `JWT_SECRET` via ConfigService quando o módulo é compilado no beforeAll.
process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_EXPIRES_IN = '24h';

describe('Proponents (e2e)', () => {
  const storedProponent = {
    id: PROPONENT_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const repository = {
    create: vi.fn(),
    findMany: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    countActiveProjects: vi.fn(),
    countActiveUsers: vi.fn(),
  };

  let app: INestApplication;
  let token: string;

  /** Header `Authorization` do token válido emitido no beforeAll. */
  const auth = (): [string, string] => ['Authorization', `Bearer ${token}`];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        // ignoreEnvFile: o segredo vem 100% de process.env (definido acima).
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
        ProponentsModule,
      ],
    })
      // PrismaService sai do caminho: nenhum teste abre conexão real.
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: vi.fn() } })
      .overrideProvider(ProponentsRepository)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // mesmo pipeline de validação de produção
    await app.init();

    token = await new JwtService({ secret: TEST_SECRET }).signAsync({
      sub: PROPONENT_ID,
      email: 'admin@arthemis.test',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findByEmail.mockResolvedValue(null);
    repository.findMany.mockResolvedValue([]);
    repository.findById.mockResolvedValue(storedProponent);
    repository.create.mockResolvedValue(storedProponent);
    repository.update.mockResolvedValue(storedProponent);
    repository.softDelete.mockResolvedValue(storedProponent);
    repository.countActiveProjects.mockResolvedValue(0);
    repository.countActiveUsers.mockResolvedValue(0);
  });

  describe('proteção do JwtAuthGuard', () => {
    it('responde 401 sem token em todas as rotas', async () => {
      const server = app.getHttpServer();

      await request(server).get('/proponents').expect(401);
      await request(server)
        .post('/proponents')
        .send({ name: 'Instituto', email: 'novo@arthemis.test' })
        .expect(401);
      await request(server).get(`/proponents/${PROPONENT_ID}`).expect(401);
      await request(server)
        .patch(`/proponents/${PROPONENT_ID}`)
        .send({ name: 'Instituto' })
        .expect(401);
      await request(server).delete(`/proponents/${PROPONENT_ID}`).expect(401);

      // O guard barra antes de qualquer acesso à camada de domínio.
      expect(repository.findMany).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 401 para token assinado com outro segredo', async () => {
      const forged = await new JwtService({
        secret: 'outro-segredo',
      }).signAsync({
        sub: PROPONENT_ID,
        email: 'admin@arthemis.test',
        role: 'admin',
      });

      await request(app.getHttpServer())
        .get('/proponents')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });
  });

  describe('GET /proponents', () => {
    it('responde 200 [] quando não há registros', async () => {
      repository.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/proponents')
        .set(...auth())
        .expect(200);

      expect(response.body).toEqual([]);
      // Busca sem paginação: vai direto ao repositório.
      expect(repository.findMany).toHaveBeenCalledWith({ search: undefined });
    });

    it('devolve a lista de proponentes ativos', async () => {
      repository.findMany.mockResolvedValue([storedProponent]);

      const response = await request(app.getHttpServer())
        .get('/proponents')
        .set(...auth())
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: PROPONENT_ID,
        name: storedProponent.name,
        email: storedProponent.email,
      });
      // O contrato não expõe o soft delete.
      expect(response.body[0]).not.toHaveProperty('deletedAt');
    });

    it('repassa o ?search= para a camada de domínio', async () => {
      await request(app.getHttpServer())
        .get('/proponents?search=arte')
        .set(...auth())
        .expect(200);

      expect(repository.findMany).toHaveBeenCalledWith({ search: 'arte' });
    });

    it('responde 400 para parâmetro de query fora do contrato', async () => {
      await request(app.getHttpServer())
        .get('/proponents?page=1')
        .set(...auth())
        .expect(400);

      expect(repository.findMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /proponents', () => {
    it('responde 201 com o proponente criado (e-mail normalizado)', async () => {
      const response = await request(app.getHttpServer())
        .post('/proponents')
        .set(...auth())
        .send({ name: 'Instituto Arthemis', email: 'Contato@Arthemis.Test' })
        .expect(201);

      expect(Object.keys(response.body).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'name',
        'updatedAt',
      ]);
      expect(response.body).toMatchObject({
        id: PROPONENT_ID,
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });
      // O e-mail já chega normalizado ao repositório.
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });
    });

    it('responde 400 para e-mail inválido', async () => {
      await request(app.getHttpServer())
        .post('/proponents')
        .set(...auth())
        .send({ name: 'Instituto', email: 'email-invalido' })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 400 quando falta o nome', async () => {
      await request(app.getHttpServer())
        .post('/proponents')
        .set(...auth())
        .send({ email: 'novo@arthemis.test' })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 400 para campos fora do contrato', async () => {
      await request(app.getHttpServer())
        .post('/proponents')
        .set(...auth())
        .send({
          name: 'Instituto',
          email: 'novo@arthemis.test',
          role: 'admin',
        })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 409 quando o e-mail já está cadastrado', async () => {
      repository.findByEmail.mockResolvedValue(storedProponent);

      await request(app.getHttpServer())
        .post('/proponents')
        .set(...auth())
        .send({ name: 'Duplicado', email: storedProponent.email })
        .expect(409);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /proponents/:id', () => {
    it('responde 200 com o proponente (sem deletedAt)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(200);

      expect(response.body).toEqual({
        id: PROPONENT_ID,
        name: storedProponent.name,
        email: storedProponent.email,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('deletedAt');
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(404);
    });

    it('responde 400 quando o id não é UUID', async () => {
      await request(app.getHttpServer())
        .get('/proponents/abc')
        .set(...auth())
        .expect(400);

      expect(repository.findById).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /proponents/:id', () => {
    it('responde 200 na atualização parcial (só o nome)', async () => {
      repository.update.mockResolvedValue({
        ...storedProponent,
        name: 'Instituto Renomeado',
      });

      const response = await request(app.getHttpServer())
        .patch(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .send({ name: 'Instituto Renomeado' })
        .expect(200);

      expect(response.body.name).toBe('Instituto Renomeado');
      expect(repository.update).toHaveBeenCalledWith(PROPONENT_ID, {
        name: 'Instituto Renomeado',
        email: undefined,
      });
    });

    it('responde 409 quando o e-mail pertence a outro proponente', async () => {
      repository.findByEmail.mockResolvedValue({
        ...storedProponent,
        id: OTHER_PROPONENT_ID,
        email: 'outro@arthemis.test',
      });

      await request(app.getHttpServer())
        .patch(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .send({ email: 'outro@arthemis.test' })
        .expect(409);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .send({ name: 'Qualquer' })
        .expect(404);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('responde 400 para e-mail inválido e para id não-UUID', async () => {
      await request(app.getHttpServer())
        .patch(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .send({ email: 'email-invalido' })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/proponents/abc')
        .set(...auth())
        .send({ name: 'Qualquer' })
        .expect(400);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /proponents/:id', () => {
    it('responde 204 e aplica soft delete quando não há vínculos', async () => {
      await request(app.getHttpServer())
        .delete(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(204);

      expect(repository.softDelete).toHaveBeenCalledWith(PROPONENT_ID);
    });

    it('responde 409 quando há projetos ativos vinculados', async () => {
      repository.countActiveProjects.mockResolvedValue(1);

      await request(app.getHttpServer())
        .delete(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(409);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 409 quando há usuários vinculados', async () => {
      repository.countActiveUsers.mockResolvedValue(1);

      await request(app.getHttpServer())
        .delete(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(409);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/proponents/${PROPONENT_ID}`)
        .set(...auth())
        .expect(404);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
