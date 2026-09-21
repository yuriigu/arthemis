import { ConflictException, NotFoundException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { DEFAULT_USER_ROLE } from './models/i-user.js';
import type { UserRecord } from './models/i-user.js';
import type { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

const PLAIN_PASSWORD = 'senha-secreta-123';

describe('UsersService', () => {
  const storedUser: UserRecord = {
    id: '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60',
    email: 'user@arthemis.test',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    role: 'visitor',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let repository: {
    create: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    service = new UsersService(repository as unknown as UsersRepository);
  });

  describe('createUser', () => {
    beforeEach(() => {
      repository.create.mockImplementation(
        async (data: { email: string; passwordHash: string; role: string }) => ({
          ...storedUser,
          ...data,
        }),
      );
    });

    it('grava hash bcrypt e nunca a senha em texto limpo', async () => {
      repository.findByEmail.mockResolvedValue(null);

      const created = await service.createUser({
        email: 'New.User@Arthemis.Test',
        password: PLAIN_PASSWORD,
      });

      const [data] = repository.create.mock.calls[0] as [
        { email: string; passwordHash: string; role: string },
      ];

      expect(data.email).toBe('new.user@arthemis.test');
      expect(data.passwordHash).not.toBe(PLAIN_PASSWORD);
      expect(data.passwordHash.startsWith('$2b$10$')).toBe(true);
      await expect(compare(PLAIN_PASSWORD, data.passwordHash)).resolves.toBe(
        true,
      );
      // Nenhum campo enviado ao banco contém a senha limpa.
      expect(JSON.stringify(data)).not.toContain(PLAIN_PASSWORD);
      // A resposta não expõe o hash.
      expect(created).not.toHaveProperty('passwordHash');
    });

    it('define o papel no servidor (cliente não escolhe admin)', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await service.createUser({
        email: 'novo@arthemis.test',
        password: PLAIN_PASSWORD,
      });

      const [data] = repository.create.mock.calls[0] as [{ role: string }];
      expect(data.role).toBe(DEFAULT_USER_ROLE);
    });

    it('responde 409 para e-mail já cadastrado', async () => {
      repository.findByEmail.mockResolvedValue(storedUser);

      await expect(
        service.createUser({
          email: storedUser.email,
          password: PLAIN_PASSWORD,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('converte violação de unicidade (corrida no INSERT) em 409', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(
        service.createUser({
          email: 'corrida@arthemis.test',
          password: PLAIN_PASSWORD,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('propaga outros erros de banco sem mascará-los', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockRejectedValue(new Error('connection lost'));

      await expect(
        service.createUser({
          email: 'erro@arthemis.test',
          password: PLAIN_PASSWORD,
        }),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('findById', () => {
    it('devolve o usuário sem passwordHash', async () => {
      const { passwordHash: _ignored, ...publicUser } = storedUser;
      repository.findById.mockResolvedValue(publicUser);

      await expect(service.findById(storedUser.id)).resolves.toEqual(publicUser);
    });

    it('responde 404 quando o usuário não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findById('9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('devolve o registro com hash (uso interno do login)', async () => {
      repository.findByEmail.mockResolvedValue(storedUser);

      await expect(
        service.findByEmail('USER@arthemis.test'),
      ).resolves.toMatchObject({
        id: storedUser.id,
        passwordHash: storedUser.passwordHash,
      });
    });

    it('devolve null quando não encontra', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmail('ninguem@arthemis.test')).resolves.toBeNull();
    });
  });
});
