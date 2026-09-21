import type { PrismaService } from '../prisma/prisma.service.js';
import { UsersRepository } from './users.repository.js';

describe('UsersRepository', () => {
  const storedUser = {
    id: '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60',
    email: 'user@arthemis.test',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    role: 'visitor',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let prisma: {
    user: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let repository: UsersRepository;

  beforeEach(() => {
    prisma = { user: { create: vi.fn(), findUnique: vi.fn() } };
    repository = new UsersRepository(prisma as unknown as PrismaService);
  });

  it('persiste com e-mail normalizado e o hash recebido', async () => {
    prisma.user.create.mockResolvedValue(storedUser);

    await repository.create({
      email: '  USER@Arthemis.Test ',
      passwordHash: storedUser.passwordHash,
      role: 'visitor',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@arthemis.test',
        passwordHash: storedUser.passwordHash,
        role: 'visitor',
      },
    });
  });

  it('busca por e-mail normalizado (uso interno do login)', async () => {
    prisma.user.findUnique.mockResolvedValue(storedUser);

    await expect(repository.findByEmail('USER@arthemis.test')).resolves.toEqual(
      storedUser,
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@arthemis.test' },
    });
  });

  it('não seleciona password_hash na busca por id', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...storedUser });

    await repository.findById(storedUser.id);

    const [args] = prisma.user.findUnique.mock.calls[0] as [
      { select: Record<string, boolean> },
    ];

    expect(Object.keys(args.select)).toEqual([
      'id',
      'email',
      'role',
      'createdAt',
      'updatedAt',
    ]);
    expect(args.select).not.toHaveProperty('passwordHash');
  });
});
