import type { PrismaService } from '../../prisma/prisma.service.js';
import {
  PROJECT_DETAILS_INCLUDE,
  PROJECT_SUMMARY_INCLUDE,
  ProjectsRepository,
} from './projects.repository.js';

describe('ProjectsRepository', () => {
  const PROJECT_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
  const MAIN_ORGANIZATION_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const SECONDARY_ORGANIZATION_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
  const SDG_UUID = 'sdg-uuid-1';

  let prisma: {
    $transaction: ReturnType<typeof vi.fn>;
    project: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  let repository: ProjectsRepository;

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn(),
      project: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new ProjectsRepository(prisma as unknown as PrismaService);
  });

  describe('createTransactional', () => {
    it('executa a criação atômica do projeto, organizações e ODS em uma transação do Prisma', async () => {
      const mockCreatedProject = { id: PROJECT_ID, name: 'Projeto Água Limpa' };
      const txMock = {
        project: {
          create: vi.fn().mockResolvedValue(mockCreatedProject),
          findUnique: vi.fn().mockResolvedValue(mockCreatedProject),
        },
        projectOrganization: {
          create: vi.fn().mockResolvedValue({ id: 'pp-1' }),
        },
        projectSdg: {
          create: vi.fn().mockResolvedValue({ id: 'ps-1' }),
        },
      };

      prisma.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) => {
          return callback(txMock);
        },
      );

      const startDate = new Date(Date.UTC(2026, 0, 1));
      const endDate = new Date(Date.UTC(2026, 11, 31));

      const result = await repository.createTransactional({
        name: '  Projeto Água Limpa  ',
        lifetimeStart: startDate,
        lifetimeEnd: endDate,
        justification: '  Preservação de nascentes  ',
        organizationId: MAIN_ORGANIZATION_ID,
        organizations: [
          { organizationId: SECONDARY_ORGANIZATION_ID, role: 'Co-executor' },
        ],
        sdgUuids: [SDG_UUID],
      });

      expect(result).toEqual(mockCreatedProject);
      expect(txMock.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Projeto Água Limpa',
          lifetimeStart: startDate,
          lifetimeEnd: endDate,
          justification: 'Preservação de nascentes',
          organizationId: MAIN_ORGANIZATION_ID,
        },
      });
      expect(txMock.projectOrganization.create).toHaveBeenCalledWith({
        data: {
          projectId: PROJECT_ID,
          organizationId: SECONDARY_ORGANIZATION_ID,
          role: 'Co-executor',
        },
      });
      expect(txMock.projectSdg.create).toHaveBeenCalledWith({
        data: {
          projectId: PROJECT_ID,
          sdgId: SDG_UUID,
        },
      });
    });
  });

  describe('findPaginated e count', () => {
    it('executa paginação com skip e take e ordena por createdAt desc', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await repository.findPaginated({ page: 2, limit: 5 });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: PROJECT_SUMMARY_INCLUDE,
      });
    });

    it('aplica o mesmo filtro de busca textual em name, justification e organization.name na paginação e no count', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(3);

      const search = '  floresta  ';
      await repository.findPaginated({ page: 1, limit: 10, search });
      await repository.count(search);

      const expectedWhere = {
        deletedAt: null,
        OR: [
          { name: { contains: 'floresta', mode: 'insensitive' } },
          { justification: { contains: 'floresta', mode: 'insensitive' } },
          {
            organization: {
              name: { contains: 'floresta', mode: 'insensitive' },
            },
          },
        ],
      };

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });
  });

  describe('findById', () => {
    it('busca projeto ativo filtrando por deletedAt null e carregando relacionamentos completos', async () => {
      const mockProject = { id: PROJECT_ID };
      prisma.project.findFirst.mockResolvedValue(mockProject);

      const result = await repository.findById(PROJECT_ID);

      expect(result).toBe(mockProject);
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
        include: PROJECT_DETAILS_INCLUDE,
      });
    });
  });

  describe('softDelete', () => {
    it('marca deletedAt no projeto e em seus vínculos ativos dentro de transação', async () => {
      const txMock = {
        project: { update: vi.fn() },
        projectOrganization: { updateMany: vi.fn() },
        projectSdg: { updateMany: vi.fn() },
      };

      prisma.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) => {
          return callback(txMock);
        },
      );

      await repository.softDelete(PROJECT_ID);

      expect(txMock.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
      expect(txMock.projectOrganization.updateMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
      expect(txMock.projectSdg.updateMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
    });
  });
});
