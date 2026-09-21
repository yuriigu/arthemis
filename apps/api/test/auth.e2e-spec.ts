import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('AuthModule (e2e) - Critérios de Aceitação', () => {
  let app: INestApplication;
  let validToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Habilita as validações do class-validator nos testes e2e
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // CRITÉRIO 1: Credenciais corretas -> 200 e token JWT válido
  // ============================================================
  it('1. POST /auth/login deve retornar status 200 e um token JWT válido ao enviar credenciais corretas', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@arthemis.com',
        password: 'senha123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
    expect(response.body.access_token.split('.').length).toBe(3); // Estrutura de token JWT (header.payload.signature)
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('admin@arthemis.com');
    expect(response.body.user.role).toBe('admin');

    // Guarda o token para testar a rota protegida
    validToken = response.body.access_token;
  });

  // ============================================================
  // CRITÉRIO 2: Senha incorreta -> 401 Unauthorized
  // ============================================================
  it('2. POST /auth/login deve retornar status 401 (Unauthorized) ao enviar senha incorreta', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@arthemis.com',
        password: 'senha_completamente_errada',
      })
      .expect(401);

    expect(response.body.message).toContain('Credenciais inválidas');
  });

  // ============================================================
  // CRITÉRIO 3: E-mail não cadastrado -> 401 Unauthorized
  // ============================================================
  it('3. POST /auth/login deve retornar status 401 ao enviar um e-mail não cadastrado', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'naoexiste@arthemis.com',
        password: 'senha123',
      })
      .expect(401);

    expect(response.body.message).toContain('Credenciais inválidas');
  });

  // ============================================================
  // CRITÉRIO 4: Formato inválido -> 400 Bad Request barrado pelo DTO
  // ============================================================
  it('4. POST /auth/login deve retornar status 400 (Bad Request) quando faltar o e-mail', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        password: 'senha123',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('5. POST /auth/login deve retornar status 400 (Bad Request) quando o formato do e-mail for inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'email_invalido_sem_arroba',
        password: 'senha123',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('6. POST /auth/login deve retornar status 400 (Bad Request) quando a senha tiver menos de 6 caracteres', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@arthemis.com',
        password: '123',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  // ============================================================
  // BÔNUS: ROTA PROTEGIDA GET /auth/me
  // ============================================================
  it('7. GET /auth/me deve retornar status 200 com os dados do usuário ao enviar token válido', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.email).toBe('admin@arthemis.com');
    expect(response.body.role).toBe('admin');
  });

  it('8. GET /auth/me deve retornar status 401 ao tentar acessar sem token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });
});
