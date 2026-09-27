import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module.js';
import { configureApp } from '../src/config/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import type { UserRecord } from '../src/users/models/i-user.js';
import { UsersRepository } from '../src/users/users.repository.js';
import { hashPassword } from '../src/users/utils/password.util.js';

/**
 * Contrato HTTP do módulo de autenticação (critérios de aceitação):
 *
 * 1. POST /auth/login com credenciais válidas → 200 + JWT assinado (HS256);
 * 2. senha incorreta → 401;
 * 3. e-mail não cadastrado → 401 (mesma resposta do caso 2, anti-enumeração);
 * 4. payload inválido → 400 pelo ValidationPipe global;
 * 5. GET /auth/me → 200 com Bearer válido; 401 sem token/inválido/expirado.
 *
 * O repositório é substituído por um stub (mesma estratégia de
 * `users.e2e-spec.ts`): aqui validamos códigos de status e formato da
 * resposta sem depender de banco.
 */
const TEST_SECRET = 'e2e-jwt-secret-0123456789-abcdefghijklmnopqrstuv';
const PLAIN_PASSWORD = 'senha-secreta-123';
const USER_ID = '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60';

// Definido ANTES do boot do módulo: `JwtModule.registerAsync` lê JWT_SECRET
// via ConfigService quando o AuthModule é compilado no beforeAll.
process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_EXPIRES_IN = '24h';

describe('Auth (e2e)', () => {
  const storedUser: UserRecord = {
    id: USER_ID,
    email: 'user@arthemis.test',
    passwordHash: '',
    role: 'visitor',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const validBody = { email: storedUser.email, password: PLAIN_PASSWORD };

  const repository = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  };

  let app: INestApplication;
  let verificationJwt: JwtService;

  /** Assina um token fora do fluxo de login (para cenários do /auth/me). */
  function signToken(
    payload: Record<string, unknown>,
    secret = TEST_SECRET,
    // `JwtSignOptions['expiresIn']`: o @nestjs/jwt usa o `StringValue`
    // (template literal) do `ms`, não `string` simples (mesmo critério de
    // `auth.module.ts`).
    expiresIn: JwtSignOptions['expiresIn'] = '1h',
  ): Promise<string> {
    return new JwtService({ secret }).signAsync(payload, { expiresIn });
  }

  beforeAll(async () => {
    storedUser.passwordHash = await hashPassword(PLAIN_PASSWORD);

    const moduleFixture = await Test.createTestingModule({
      imports: [
        // ignoreEnvFile: o segredo vem 100% de process.env (definido acima).
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
      ],
    })
      // PrismaService sai do caminho: nenhum teste abre conexão real.
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: vi.fn() } })
      .overrideProvider(UsersRepository)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // mesmo pipeline de validação de produção
    await app.init();

    verificationJwt = new JwtService({ secret: TEST_SECRET });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findByEmail.mockImplementation(
      async (email: string): Promise<UserRecord | null> =>
        email === storedUser.email ? storedUser : null,
    );
    repository.findById.mockImplementation(
      async (id: string): Promise<Omit<UserRecord, 'passwordHash'> | null> => {
        if (id !== storedUser.id) {
          return null;
        }
        const { passwordHash: _ignored, ...publicUser } = storedUser;
        return publicUser;
      },
    );
  });
  describe('POST /auth/login', () => {
    it('responde 200 com um JWT HS256 assinado e válido (sub/email/role)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(200);

      expect(Object.keys(response.body)).toEqual(['access_token']);
      expect(typeof response.body.access_token).toBe('string');

      // Cabeçalho: HS256 (mesmo algoritmo do auth legado).
      const header = JSON.parse(
        Buffer.from(
          response.body.access_token.split('.')[0],
          'base64url',
        ).toString('utf8'),
      );
      expect(header).toMatchObject({ alg: 'HS256', typ: 'JWT' });

      // Payload: claims sub/email/role + exp 24h à frente do iat.
      const claims = await verificationJwt.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      }>(response.body.access_token);

      expect(claims).toMatchObject({
        sub: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      expect(claims.exp - claims.iat).toBe(24 * 60 * 60);
      // Nunca vaza credencial no token.
      expect(JSON.stringify(claims)).not.toContain(PLAIN_PASSWORD);
      expect(JSON.stringify(claims)).not.toContain(storedUser.passwordHash);
    });

    it('responde 401 para senha incorreta', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validBody, password: 'senha-errada-456' })
        .expect(401);

      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('responde 401 para e-mail não cadastrado, com a MESMA resposta do caso anterior', async () => {
      const wrongPassword = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validBody, password: 'senha-errada-456' })
        .expect(401);
      const unknownEmail = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ninguem@arthemis.test', password: PLAIN_PASSWORD })
        .expect(401);

      // Anti-enumeração: não dá para distinguir "senha errada" de "não existe".
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
      expect(unknownEmail.body.message).toBe('Credenciais inválidas');
    });

    it('responde 400 para payload inválido (ValidationPipe global)', async () => {
      const invalidPayloads = [
        { password: PLAIN_PASSWORD }, // sem e-mail
        { email: 'email-invalido', password: PLAIN_PASSWORD }, // formato
        { email: validBody.email }, // sem senha
        { ...validBody, password: 123 }, // senha não-string
        { ...validBody, role: 'admin' }, // campo fora do contrato
      ];

      for (const payload of invalidPayloads) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(payload)
          .expect(400);
      }

      // Nenhuma tentativa chega ao repositório.
      expect(repository.findByEmail).not.toHaveBeenCalled();
    });
  });
  describe('GET /auth/me', () => {
    /** Obtém um token válido pelo próprio fluxo de login. */
    async function login(): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(200);

      return response.body.access_token as string;
    }

    it('responde 200 com o perfil do usuário autenticado (sem passwordHash)', async () => {
      const token = await login();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Object.keys(response.body).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'role',
        'updatedAt',
      ]);
      expect(response.body).toMatchObject({
        id: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(repository.findById).toHaveBeenCalledWith(storedUser.id);
    });

    it('responde 401 sem o header Authorization', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('responde 401 para token malformado', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer token.invalido.aqui')
        .expect(401);
    });

    it('responde 401 para token assinado com outro segredo', async () => {
      const forged = await signToken(
        { sub: storedUser.id, email: storedUser.email, role: 'admin' },
        'outro-segredo-completamente-diferente-0123456789',
      );

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('responde 401 para token expirado', async () => {
      const expired = await signToken(
        { sub: storedUser.id, email: storedUser.email, role: storedUser.role },
        TEST_SECRET,
        -10, // expirado há 10s
      );

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('responde 404 quando o usuário do token não existe mais', async () => {
      const token = await login();
      repository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
