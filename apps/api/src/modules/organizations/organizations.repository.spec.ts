import type { PrismaService } from '../../prisma/prisma.service.js';
import { OrganizationsRepository } from './organizations.repository.js';

/**
 * Testes do repositório isolando o Prisma.
 *
 * Garantem o que o serviço não vê: normalização de e-mail/nome, o `SELECT`
 * público (sem `deletedAt`), o filtro `deletedAt: null` nas leituras, a busca
 * case-insensitive, o `PATCH` que omite campos ausentes e as contagens usadas na
 * política de exclusão.
 */
const ORGANIZATION_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

/** Espelho do `PUBLIC_ORGANIZATION_SELECT` do repositório. */
const PUBLIC_ORGANIZATION_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

describe('OrganizationsRepository', () => {
  const storedOrganization = {
    id: ORGANIZATION_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let prisma: {
    organization: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    project: { count: ReturnType<typeof vi.fn> };
    user: { count: ReturnType<typeof vi.fn> };
  };
  let repository: OrganizationsRepository;

  beforeEach(() => {
    prisma = {
      organization: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      project: { count: vi.fn() },
      user: { count: vi.fn() },
    };
    repository = new OrganizationsRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('persiste com nome aparado, e-mail normalizado e select público', async () => {
    prisma.organization.create.mockResolvedValue(storedOrganization);

    await repository.create({
      name: '  Instituto Arthemis  ',
      email: '  CONTATO@Arthemis.Test ',
    });

    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: {
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('não seleciona deleted_at e só enxerga ativos no findById', async () => {
    prisma.organization.findFirst.mockResolvedValue(storedOrganization);

    await expect(repository.findById(ORGANIZATION_ID)).resolves.toEqual(
      storedOrganization,
    );

    const [args] = prisma.organization.findFirst.mock.calls[0] as [
      { where: Record<string, unknown>; select: Record<string, boolean> },
    ];

    expect(args.where).toEqual({ id: ORGANIZATION_ID, deletedAt: null });
    expect(args.select).not.toHaveProperty('deletedAt');
  });

  it('lista ativos na página solicitada, ordenados por nome', async () => {
    prisma.organization.findMany.mockResolvedValue([]);

    await expect(
      repository.findPaginated({ page: 2, limit: 10 }),
    ).resolves.toEqual([]);

    expect(prisma.organization.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      skip: 10,
      take: 10,
      orderBy: { name: 'asc' },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('filtra por nome case-insensitive quando há search', async () => {
    prisma.organization.findMany.mockResolvedValue([storedOrganization]);

    await repository.findPaginated({
      page: 1,
      limit: 10,
      search: '  arte  ',
    });

    expect(prisma.organization.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        name: { contains: 'arte', mode: 'insensitive' },
      },
      skip: 0,
      take: 10,
      orderBy: { name: 'asc' },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('conta somente os organizações ativas que correspondem à busca', async () => {
    prisma.organization.count.mockResolvedValue(4);

    await expect(repository.count(' arte ')).resolves.toBe(4);
    expect(prisma.organization.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        name: { contains: 'arte', mode: 'insensitive' },
      },
    });
  });

  it('busca por e-mail normalizado considerando apenas ativos', async () => {
    prisma.organization.findFirst.mockResolvedValue(storedOrganization);

    await repository.findByEmail('  CONTATO@Arthemis.Test ');

    expect(prisma.organization.findFirst).toHaveBeenCalledWith({
      where: { email: 'contato@arthemis.test', deletedAt: null },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('no update envia apenas os campos presentes no PATCH', async () => {
    prisma.organization.update.mockResolvedValue(storedOrganization);

    await repository.update(ORGANIZATION_ID, {
      name: '  Instituto Renomeado  ',
    });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORGANIZATION_ID },
      data: { name: 'Instituto Renomeado' },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('no update normaliza o e-mail quando presente', async () => {
    prisma.organization.update.mockResolvedValue(storedOrganization);

    await repository.update(ORGANIZATION_ID, { email: ' NOVO@Arthemis.Test ' });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORGANIZATION_ID },
      data: { email: 'novo@arthemis.test' },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  });

  it('aplica soft delete preenchendo deleted_at', async () => {
    prisma.organization.update.mockResolvedValue(storedOrganization);

    await repository.softDelete(ORGANIZATION_ID);

    const [args] = prisma.organization.update.mock.calls[0] as [
      { where: Record<string, unknown>; data: { deletedAt: Date } },
    ];

    expect(args.where).toEqual({ id: ORGANIZATION_ID });
    expect(args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('conta apenas projetos ativos vinculados', async () => {
    prisma.project.count.mockResolvedValue(2);

    await expect(repository.countActiveProjects(ORGANIZATION_ID)).resolves.toBe(
      2,
    );

    expect(prisma.project.count).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID, deletedAt: null },
    });
  });

  it('conta usuários vinculados (users não possui soft delete)', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(repository.countActiveUsers(ORGANIZATION_ID)).resolves.toBe(1);

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { organizationId: ORGANIZATION_ID },
    });
  });
});
