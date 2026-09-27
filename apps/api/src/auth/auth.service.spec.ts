import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PublicUser, UserRecord } from '../users/models/i-user.js';
import type { UsersService } from '../users/users.service.js';
import { hashPassword } from '../users/utils/password.util.js';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service.js';

const TEST_SECRET = 'unit-test-jwt-secret-0123456789-abcdefghijklmn';
const PLAIN_PASSWORD = 'senha-secreta-123';
const USER_ID = '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60';

describe('AuthService', () => {
  const storedUser: UserRecord = {
    id: USER_ID,
    email: 'user@arthemis.test',
    passwordHash: '',
    role: 'visitor',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(async () => {
    storedUser.passwordHash = await hashPassword(PLAIN_PASSWORD);

    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    // JwtService real (mesma config do JwtModule): o token gerado é verificado
    // de verdade em vez de apenas mockado.
    jwtService = new JwtService({
      secret: TEST_SECRET,
      signOptions: { expiresIn: '24h' },
    });
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
    );
  });

  describe('validateCredentials', () => {
    it('devolve o registro (com hash) quando e-mail e senha conferem', async () => {
      usersService.findByEmail.mockResolvedValue(storedUser);

      await expect(
        service.validateCredentials(storedUser.email, PLAIN_PASSWORD),
      ).resolves.toEqual(storedUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith(storedUser.email);
    });

    it('responde 401 quando o e-mail não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateCredentials('ninguem@arthemis.test', PLAIN_PASSWORD),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('responde 401 com a MESMA mensagem para senha errada e e-mail inexistente', async () => {
      usersService.findByEmail
        .mockResolvedValueOnce(storedUser)
        .mockResolvedValueOnce(null);

      const wrongPassword = await service
        .validateCredentials(storedUser.email, 'senha-errada-456')
        .catch((error: unknown) => error);
      const unknownEmail = await service
        .validateCredentials('ninguem@arthemis.test', PLAIN_PASSWORD)
        .catch((error: unknown) => error);

      expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
      // Resposta idêntica nos dois casos: não revela se o e-mail existe.
      expect((wrongPassword as Error).message).toBe(
        INVALID_CREDENTIALS_MESSAGE,
      );
      expect((unknownEmail as Error).message).toBe(
        (wrongPassword as Error).message,
      );
    });

    it('responde 401 quando o hash armazenado está corrompido', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...storedUser,
        passwordHash: 'nao-e-um-hash-bcrypt',
      });

      await expect(
        service.validateCredentials(storedUser.email, PLAIN_PASSWORD),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
  describe('login', () => {
    beforeEach(() => {
      usersService.findByEmail.mockResolvedValue(storedUser);
    });

    it('devolve access_token JWT com as claims sub, email e role', async () => {
      const result = await service.login({
        email: storedUser.email,
        password: PLAIN_PASSWORD,
      });

      expect(Object.keys(result)).toEqual(['access_token']);

      const claims = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      }>(result.access_token);

      expect(claims).toMatchObject({
        sub: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      // Validade de 24h (exp - iat), igual ao login legado.
      expect(claims.exp - claims.iat).toBe(24 * 60 * 60);
    });

    it('nunca embute senha ou hash no token', async () => {
      const { access_token } = await service.login({
        email: storedUser.email,
        password: PLAIN_PASSWORD,
      });

      const claims =
        await jwtService.verifyAsync<Record<string, unknown>>(access_token);

      expect(Object.keys(claims).sort()).toEqual([
        'email',
        'exp',
        'iat',
        'role',
        'sub',
      ]);
      expect(JSON.stringify(claims)).not.toContain(PLAIN_PASSWORD);
      expect(JSON.stringify(claims)).not.toContain(storedUser.passwordHash);
    });

    it('não assina token quando as credenciais são inválidas', async () => {
      const signSpy = vi.spyOn(jwtService, 'signAsync');

      await expect(
        service.login({ email: storedUser.email, password: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(
        service.login({ email: 'ninguem@arthemis.test', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(signSpy).not.toHaveBeenCalled();
      signSpy.mockRestore();
    });
  });

  describe('getProfile', () => {
    it('devolve o usuário público (sem passwordHash)', async () => {
      const { passwordHash: _ignored, ...publicUser } = storedUser;
      usersService.findById.mockResolvedValue(publicUser as PublicUser);

      await expect(service.getProfile(storedUser.id)).resolves.toEqual(
        publicUser,
      );
      expect(usersService.findById).toHaveBeenCalledWith(storedUser.id);
    });

    it('propaga 404 quando o usuário do token não existe mais', async () => {
      usersService.findById.mockRejectedValue(
        new NotFoundException('user not found'),
      );

      await expect(service.getProfile(storedUser.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
