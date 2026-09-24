import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';

/**
 * Fluxo completo de autenticação com o PostgreSQL real do `docker compose`.
 *
 * Rode `npm run test:integration` (o banco precisa estar de pé; sem ele o boot
 * falha de propósito, por causa do fail-fast do PrismaService).
 *
 * Cobre os critérios de aceitação de ponta a ponta: login 200 + token JWT
 * assinado, 401 uniforme para credenciais inválidas, 400 para payload inválido
 * e o ciclo login → `/auth/me` com Bearer (401 sem/expirado o token).
 */
describe('AuthModule (integração com Postgres real)', () => {
  const PASSWORD = 'senha-integracao-123';

  let app: INestApplication;
  let usersService: UsersService;
  let prisma: PrismaService;
  let jwt: JwtService;
  let email: string;
  let userId: string;

  const buildEmail = (): string => `auth.${randomUUID()}@arthemis.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app); // mesmo ValidationPipe de produção
    await app.init();

    usersService = app.get(UsersService);
    prisma = app.get(PrismaService);
    // Verificação independente do módulo: mesmo segredo lido do .env.
    jwt = new JwtService({ secret: process.env.JWT_SECRET });

    email = buildEmail();
    const created = await usersService.createUser({
      email,
      password: PASSWORD,
    });
    userId = created.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user
        .delete({ where: { id: userId } })
        .catch(() => undefined);
    }
    await app.close();
  });

  it('login devolve access_token válido e /auth/me devolve o perfil', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    expect(Object.keys(login.body)).toEqual(['access_token']);

    const claims = await jwt.verifyAsync<{
      sub: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    }>(login.body.access_token);

    expect(claims).toMatchObject({ sub: userId, email, role: 'visitor' });
    expect(claims.exp - claims.iat).toBe(24 * 60 * 60);
    expect(JSON.stringify(claims)).not.toContain(PASSWORD);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200);

    expect(me.body).toMatchObject({ id: userId, email, role: 'visitor' });
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('senha incorreta e e-mail desconhecido respondem 401 uniforme', async () => {
    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'senha-errada-456' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: buildEmail(), password: PASSWORD })
      .expect(401);

    expect(wrongPassword.body.message).toBe('Credenciais inválidas');
    // Anti-enumeração: resposta idêntica nos dois casos.
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('payload inválido responde 400 sem tocar o banco', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: PASSWORD })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'email-invalido', password: PASSWORD })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, role: 'admin' })
      .expect(400);
  });

  it('/auth/me responde 401 sem token ou com token expirado', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const expired = await jwt.signAsync(
      { sub: userId, email, role: 'visitor' },
      { expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
  });
});
