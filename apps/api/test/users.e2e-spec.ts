import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcrypt';
import request from 'supertest';
import { configureApp } from './../src/config/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { UsersModule } from './../src/users/users.module.js';
import { UsersRepository } from './../src/users/users.repository.js';

/**
 * Contrato HTTP do módulo de usuários.
 *
 * O repositório é substituído por um stub: aqui validamos validação de entrada,
 * códigos de status e formato da resposta — sem depender de banco. As
 * verificações com o Postgres real ficam em `users.integration-spec.ts`.
 */
describe('Users (e2e)', () => {
  const userId = '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60';
  const validBody = {
    email: 'New.User@Arthemis.Test',
    password: 'senha-secreta-123',
  };

  const repository = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  };

  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [UsersModule],
    })
      // PrismaService sai do caminho para o teste não abrir conexão real.
      .overrideProvider(PrismaService)
      .useValue({ user: { create: vi.fn(), findUnique: vi.fn() } })
      .overrideProvider(UsersRepository)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // mesmo pipeline de validação de produção
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findByEmail.mockResolvedValue(null);
    repository.create.mockImplementation(
      async (data: { email: string; passwordHash: string; role: string }) => ({
        id: userId,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
    );
  });

  describe('POST /users', () => {
    it('responde 201 com o usuário criado, sem expor o hash', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(validBody)
        .expect(201);

      expect(Object.keys(response.body).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'role',
        'updatedAt',
      ]);
      expect(response.body.email).toBe('new.user@arthemis.test');
      expect(response.body.role).toBe('visitor');

      const [data] = repository.create.mock.calls[0] as [
        { passwordHash: string },
      ];
      expect(data.passwordHash).not.toBe(validBody.password);
      await expect(compare(validBody.password, data.passwordHash)).resolves.toBe(
        true,
      );
    });

    it('responde 400 para e-mail inválido', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'email-invalido', password: validBody.password })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 400 para senha curta', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ email: validBody.email, password: '123' })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 400 para campos fora do contrato (ex.: role)', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, role: 'admin' })
        .expect(400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('responde 409 quando o e-mail já está cadastrado', async () => {
      repository.findByEmail.mockResolvedValue({ id: userId });

      await request(app.getHttpServer())
        .post('/users')
        .send(validBody)
        .expect(409);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('responde 200 com o usuário (sem passwordHash)', async () => {
      repository.findById.mockResolvedValue({
        id: userId,
        email: 'new.user@arthemis.test',
        role: 'visitor',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(response.body).toEqual({
        id: userId,
        email: 'new.user@arthemis.test',
        role: 'visitor',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/users/${userId}`).expect(404);
    });

    it('responde 400 quando o id não é UUID', async () => {
      await request(app.getHttpServer()).get('/users/abc').expect(400);

      expect(repository.findById).not.toHaveBeenCalled();
    });
  });
});
