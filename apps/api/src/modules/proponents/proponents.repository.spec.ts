import type { PrismaService } from '../../prisma/prisma.service.js';
import { ProponentsRepository } from './proponents.repository.js';

/**
 * Testes do repositório isolando o Prisma.
 *
 * Garantem o que o serviço não vê: normalização de e-mail/nome, o `SELECT`
 * público (sem `deletedAt`), o filtro `deletedAt: null` nas leituras, a busca
 * case-insensitive, o `PATCH` que omite campos ausentes e as contagens usadas na
 * política de exclusão.
 */
const PROPONENT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

/** Espelho do `PUBLIC_PROPONENT_SELECT` do repositório. */
const PUBLIC_PROPONENT_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

describe('ProponentsRepository', () => {
  const storedProponent = {
    id: PROPONENT_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let prisma: {
    proponent: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    project: { count: ReturnType<typeof vi.fn> };
    user: { count: ReturnType<typeof vi.fn> };
  };
  let repository: ProponentsRepository;

  beforeEach(() => {
    prisma = {
      proponent: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      project: { count: vi.fn() },
      user: { count: vi.fn() },
    };
    repository = new ProponentsRepository(prisma as unknown as PrismaService);
  });

  it('persiste com nome aparado, e-mail normalizado e select público', async () => {
    prisma.proponent.create.mockResolvedValue(storedProponent);

    await repository.create({
      name: '  Instituto Arthemis  ',
      email: '  CONTATO@Arthemis.Test ',
    });

    expect(prisma.proponent.create).toHaveBeenCalledWith({
      data: {
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('não seleciona deleted_at e só enxerga ativos no findById', async () => {
    prisma.proponent.findFirst.mockResolvedValue(storedProponent);

    await expect(repository.findById(PROPONENT_ID)).resolves.toEqual(
      storedProponent,
    );

    const [args] = prisma.proponent.findFirst.mock.calls[0] as [
      { where: Record<string, unknown>; select: Record<string, boolean> },
    ];

    expect(args.where).toEqual({ id: PROPONENT_ID, deletedAt: null });
    expect(args.select).not.toHaveProperty('deletedAt');
  });

  it('lista ativos ordenados por nome, sem filtro quando o search é vazio', async () => {
    prisma.proponent.findMany.mockResolvedValue([]);

    await expect(repository.findMany()).resolves.toEqual([]);

    expect(prisma.proponent.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('filtra por nome case-insensitive quando há search', async () => {
    prisma.proponent.findMany.mockResolvedValue([storedProponent]);

    await repository.findMany({ search: '  arte  ' });

    expect(prisma.proponent.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        name: { contains: 'arte', mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('busca por e-mail normalizado considerando apenas ativos', async () => {
    prisma.proponent.findFirst.mockResolvedValue(storedProponent);

    await repository.findByEmail('  CONTATO@Arthemis.Test ');

    expect(prisma.proponent.findFirst).toHaveBeenCalledWith({
      where: { email: 'contato@arthemis.test', deletedAt: null },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('no update envia apenas os campos presentes no PATCH', async () => {
    prisma.proponent.update.mockResolvedValue(storedProponent);

    await repository.update(PROPONENT_ID, { name: '  Instituto Renomeado  ' });

    expect(prisma.proponent.update).toHaveBeenCalledWith({
      where: { id: PROPONENT_ID },
      data: { name: 'Instituto Renomeado' },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('no update normaliza o e-mail quando presente', async () => {
    prisma.proponent.update.mockResolvedValue(storedProponent);

    await repository.update(PROPONENT_ID, { email: ' NOVO@Arthemis.Test ' });

    expect(prisma.proponent.update).toHaveBeenCalledWith({
      where: { id: PROPONENT_ID },
      data: { email: 'novo@arthemis.test' },
      select: PUBLIC_PROPONENT_SELECT,
    });
  });

  it('aplica soft delete preenchendo deleted_at', async () => {
    prisma.proponent.update.mockResolvedValue(storedProponent);

    await repository.softDelete(PROPONENT_ID);

    const [args] = prisma.proponent.update.mock.calls[0] as [
      { where: Record<string, unknown>; data: { deletedAt: Date } },
    ];

    expect(args.where).toEqual({ id: PROPONENT_ID });
    expect(args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('conta apenas projetos ativos vinculados', async () => {
    prisma.project.count.mockResolvedValue(2);

    await expect(repository.countActiveProjects(PROPONENT_ID)).resolves.toBe(2);

    expect(prisma.project.count).toHaveBeenCalledWith({
      where: { proponentId: PROPONENT_ID, deletedAt: null },
    });
  });

  it('conta usuários vinculados (users não possui soft delete)', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(repository.countActiveUsers(PROPONENT_ID)).resolves.toBe(1);

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { proponentId: PROPONENT_ID },
    });
  });
});
