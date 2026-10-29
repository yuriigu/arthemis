import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { OrganizationsRepository } from '../organizations/organizations.repository.js';
import type { SdgsService } from '../sdgs/sdgs.service.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { FindProjectsQueryDto } from './dto/find-projects-query.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';
import type {
  ProjectsRepository,
  ProjectWithDetails,
  ProjectWithSummary,
} from './projects.repository.js';
import {
  CONFLICT_DUPLICATE_ORGANIZATION_MESSAGE,
  CONFLICT_DUPLICATE_SDG_MESSAGE,
  CONFLICT_MAIN_ORGANIZATION_AS_SECONDARY_MESSAGE,
  PROJECT_NOT_FOUND_MESSAGE,
  SD_LISTED_PREREQUISITES_MESSAGE,
  ProjectsService,
} from './projects.service.js';

describe('ProjectsService', () => {
  const MAIN_ORGANIZATION_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const SECONDARY_ORGANIZATION_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
  const PROJECT_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';

  const sampleMainOrganization = {
    id: MAIN_ORGANIZATION_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleSecondaryOrganization = {
    id: SECONDARY_ORGANIZATION_ID,
    name: 'Parceiro Sustentável',
    email: 'parceiro@sustentavel.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleSdg1 = {
    id: 'sdg-uuid-1',
    number: 1,
    name: 'No Poverty',
    iconUrl: 'https://exemplo.org/sdg/1.png',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleSdg2 = {
    id: 'sdg-uuid-2',
    number: 2,
    name: 'Zero Hunger',
    iconUrl: 'https://exemplo.org/sdg/2.png',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleProjectRecord: ProjectWithDetails = {
    id: PROJECT_ID,
    name: 'Reflorestamento Comunitário',
    status: 'Draft',
    lifetimeStart: new Date(Date.UTC(2026, 0, 15, 0, 0, 0, 0)),
    lifetimeEnd: new Date(Date.UTC(2026, 11, 31, 0, 0, 0, 0)),
    justification: 'Recuperação de mata nativa',
    organizationId: MAIN_ORGANIZATION_ID,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    organization: sampleMainOrganization,
    projectOrganizations: [
      {
        id: 'pp-uuid-1',
        projectId: PROJECT_ID,
        organizationId: SECONDARY_ORGANIZATION_ID,
        role: 'Co-executor',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
        organization: sampleSecondaryOrganization,
      },
    ],
    projectSdgs: [
      {
        id: 'ps-uuid-1',
        projectId: PROJECT_ID,
        sdgId: sampleSdg1.id,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
        sdg: sampleSdg1,
      },
    ],
    activities: [],
    locations: [],
  };

  let projectsRepository: {
    createTransactional: ReturnType<typeof vi.fn>;
    findPaginated: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateTransactional: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  let organizationsRepository: {
    findById: ReturnType<typeof vi.fn>;
  };

  let sdgsService: {
    validateSdgsExist: ReturnType<typeof vi.fn>;
  };

  let service: ProjectsService;

  beforeEach(() => {
    projectsRepository = {
      createTransactional: vi.fn(),
      findPaginated: vi.fn(),
      count: vi.fn(),
      findById: vi.fn(),
      updateTransactional: vi.fn(),
      softDelete: vi.fn(),
    };

    organizationsRepository = {
      findById: vi.fn(),
    };

    sdgsService = {
      validateSdgsExist: vi.fn(),
    };

    service = new ProjectsService(
      projectsRepository as unknown as ProjectsRepository,
      organizationsRepository as unknown as OrganizationsRepository,
      sdgsService as unknown as SdgsService,
    );
  });

  describe('create (criação transacional de projetos)', () => {
    const validDto: CreateProjectDto = {
      name: 'Reflorestamento Comunitário',
      lifetimeStart: '2026-01-15',
      lifetimeEnd: '2026-12-31',
      justification: 'Recuperação de mata nativa',
      organizationId: MAIN_ORGANIZATION_ID,
      organizations: [
        {
          organizationId: SECONDARY_ORGANIZATION_ID,
          role: 'Co-executor',
        },
      ],
      sdgIds: [1],
    };

    it('cria projeto com sucesso incluinda organização principal, secundários e ODS', async () => {
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        if (id === SECONDARY_ORGANIZATION_ID)
          return Promise.resolve(sampleSecondaryOrganization);
        return Promise.resolve(null);
      });
      sdgsService.validateSdgsExist.mockResolvedValue([sampleSdg1]);
      projectsRepository.createTransactional.mockResolvedValue(
        sampleProjectRecord,
      );

      const result = await service.create(validDto);

      expect(result.id).toBe(PROJECT_ID);
      expect(result.name).toBe(validDto.name);
      expect(result.lifetimeStart).toBe('2026-01-15');
      expect(result.lifetimeEnd).toBe('2026-12-31');
      expect(result.organization.id).toBe(MAIN_ORGANIZATION_ID);
      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].organizationId).toBe(
        SECONDARY_ORGANIZATION_ID,
      );
      expect(result.organizations[0].role).toBe('Co-executor');
      expect(result.sdgs).toHaveLength(1);
      expect(result.sdgs[0].number).toBe(1);

      expect(projectsRepository.createTransactional).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validDto.name,
          organizationId: MAIN_ORGANIZATION_ID,
          sdgUuids: [sampleSdg1.id],
        }),
      );
    });

    it('rejeita criação quando a organização principal não existir (HTTP 404)', async () => {
      organizationsRepository.findById.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('rejeita criação quando alguma organização secundário não existir (HTTP 404)', async () => {
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        return Promise.resolve(null); // secundário não encontrado
      });

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('rejeita criação quando algum ODS informado não existir (HTTP 404)', async () => {
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        if (id === SECONDARY_ORGANIZATION_ID)
          return Promise.resolve(sampleSecondaryOrganization);
        return Promise.resolve(null);
      });
      sdgsService.validateSdgsExist.mockRejectedValue(
        new NotFoundException('ODS não encontrado'),
      );

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('trata duplicidade quando houver organizações repetidos na lista secundária (HTTP 409)', async () => {
      organizationsRepository.findById.mockResolvedValue(
        sampleMainOrganization,
      );

      const dtoWithDuplicates: CreateProjectDto = {
        ...validDto,
        organizations: [
          { organizationId: SECONDARY_ORGANIZATION_ID, role: 'Parceiro' },
          { organizationId: SECONDARY_ORGANIZATION_ID, role: 'Co-executor' },
        ],
      };

      await expect(service.create(dtoWithDuplicates)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dtoWithDuplicates)).rejects.toThrow(
        CONFLICT_DUPLICATE_ORGANIZATION_MESSAGE,
      );
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('trata duplicidade quando a organização principal também for informado como secundário (HTTP 409)', async () => {
      organizationsRepository.findById.mockResolvedValue(
        sampleMainOrganization,
      );

      const dtoWithMainAsSecondary: CreateProjectDto = {
        ...validDto,
        organizations: [
          { organizationId: MAIN_ORGANIZATION_ID, role: 'Parceiro' },
        ],
      };

      await expect(service.create(dtoWithMainAsSecondary)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dtoWithMainAsSecondary)).rejects.toThrow(
        CONFLICT_MAIN_ORGANIZATION_AS_SECONDARY_MESSAGE,
      );
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('trata duplicidade quando houver números de ODS repetidos no array (HTTP 409)', async () => {
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        if (id === SECONDARY_ORGANIZATION_ID)
          return Promise.resolve(sampleSecondaryOrganization);
        return Promise.resolve(null);
      });

      const dtoWithDuplicateSdgs: CreateProjectDto = {
        ...validDto,
        sdgIds: [1, 1], // ODS duplicado
      };

      await expect(service.create(dtoWithDuplicateSdgs)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dtoWithDuplicateSdgs)).rejects.toThrow(
        CONFLICT_DUPLICATE_SDG_MESSAGE,
      );
      expect(projectsRepository.createTransactional).not.toHaveBeenCalled();
    });

    it('realiza rollback completo quando qualquer gravação na transação falhar', async () => {
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        if (id === SECONDARY_ORGANIZATION_ID)
          return Promise.resolve(sampleSecondaryOrganization);
        return Promise.resolve(null);
      });
      sdgsService.validateSdgsExist.mockResolvedValue([sampleSdg1]);

      // Simula falha na transação atômica do Prisma
      projectsRepository.createTransactional.mockRejectedValue(
        new Error('Falha de escrita no banco - rollback obrigatório'),
      );

      await expect(service.create(validDto)).rejects.toThrow(
        'Falha de escrita no banco - rollback obrigatório',
      );
    });
  });

  describe('findAll (listagem e paginação)', () => {
    const summaryProject: ProjectWithSummary = {
      id: PROJECT_ID,
      name: 'Reflorestamento Comunitário',
      status: 'Draft',
      lifetimeStart: new Date(Date.UTC(2026, 0, 15, 0, 0, 0, 0)),
      lifetimeEnd: new Date(Date.UTC(2026, 11, 31, 0, 0, 0, 0)),
      justification: 'Recuperação de mata nativa',
      organizationId: MAIN_ORGANIZATION_ID,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      deletedAt: null,
      organization: sampleMainOrganization,
      projectSdgs: [
        {
          id: 'ps-uuid-1',
          projectId: PROJECT_ID,
          sdgId: sampleSdg1.id,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          deletedAt: null,
          sdg: sampleSdg1,
        },
      ],
    };

    it('lista projetos utilizando paginação com valores padrão (page 1, limit 10)', async () => {
      projectsRepository.findPaginated.mockResolvedValue([summaryProject]);
      projectsRepository.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(projectsRepository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });
    });

    it('calcula corretamente total e totalPages para páginas diferentes', async () => {
      // 25 projetos no total, limit 10 -> totalPages deve ser 3
      projectsRepository.findPaginated.mockResolvedValue([summaryProject]);
      projectsRepository.count.mockResolvedValue(25);

      const query: FindProjectsQueryDto = { page: 2, limit: 10 };
      const result = await service.findAll(query);

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(projectsRepository.findPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: undefined,
      });
    });

    it('calcula totalPages como 0 quando não houver registros', async () => {
      projectsRepository.findPaginated.mockResolvedValue([]);
      projectsRepository.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('aplica busca textual com termo pesquisado', async () => {
      projectsRepository.findPaginated.mockResolvedValue([summaryProject]);
      projectsRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ search: 'reflorestamento' });

      expect(result.data).toHaveLength(1);
      expect(projectsRepository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'reflorestamento',
      });
      expect(projectsRepository.count).toHaveBeenCalledWith('reflorestamento');
    });

    it('rejeita valores inválidos de page (< 1) com BadRequestException', async () => {
      await expect(service.findAll({ page: 0, limit: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita valores excessivos de limit (> 100) com BadRequestException', async () => {
      await expect(service.findAll({ page: 1, limit: 150 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById (detalhamento do projeto)', () => {
    it('retorna os detalhes completos do projeto ativo com relacionamentos', async () => {
      projectsRepository.findById.mockResolvedValue(sampleProjectRecord);

      const result = await service.findById(PROJECT_ID);

      expect(result.id).toBe(PROJECT_ID);
      expect(result.organization.id).toBe(MAIN_ORGANIZATION_ID);
      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].organizationId).toBe(
        SECONDARY_ORGANIZATION_ID,
      );
      expect(result.sdgs).toHaveLength(1);
      expect(result.sdgs[0].id).toBe(sampleSdg1.id);
      expect(projectsRepository.findById).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('responde 404 quando o projeto não for localizado ou estiver removido logicamente', async () => {
      projectsRepository.findById.mockResolvedValue(null);

      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        PROJECT_NOT_FOUND_MESSAGE,
      );
    });
  });

  describe('update (edição e preservação de vínculos)', () => {
    beforeEach(() => {
      projectsRepository.findById.mockResolvedValue(sampleProjectRecord);
      organizationsRepository.findById.mockImplementation((id: string) => {
        if (id === MAIN_ORGANIZATION_ID)
          return Promise.resolve(sampleMainOrganization);
        if (id === SECONDARY_ORGANIZATION_ID)
          return Promise.resolve(sampleSecondaryOrganization);
        return Promise.resolve(null);
      });
      sdgsService.validateSdgsExist.mockResolvedValue([sampleSdg1, sampleSdg2]);
      projectsRepository.updateTransactional.mockResolvedValue({
        ...sampleProjectRecord,
        name: 'Nome Atualizado',
      });
    });

    it('atualiza apenas campos escalares preservando relacionamentos não enviados', async () => {
      const dto: UpdateProjectDto = {
        name: 'Nome Atualizado',
      };

      const result = await service.update(PROJECT_ID, dto);

      expect(result.name).toBe('Nome Atualizado');
      expect(projectsRepository.updateTransactional).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({
          name: 'Nome Atualizado',
          organizations: undefined,
          sdgUuids: undefined,
        }),
      );
    });

    it('rejeita status Listed sem justificativa e localização ativa com HTTP 422', async () => {
      projectsRepository.findById.mockResolvedValue({
        ...sampleProjectRecord,
        justification: ' ',
        locations: [],
      });

      await expect(
        service.update(PROJECT_ID, { status: 'Listed' }),
      ).rejects.toThrow(UnprocessableEntityException);
      await expect(
        service.update(PROJECT_ID, { status: 'Listed' }),
      ).rejects.toThrow(SD_LISTED_PREREQUISITES_MESSAGE);
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('rejeita status Listed sem localização ativa mesmo com justificativa', async () => {
      await expect(
        service.update(PROJECT_ID, { status: 'Listed' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('permite status Listed quando justificativa e localização ativa existem', async () => {
      const location = {
        id: 'location-uuid',
        projectId: PROJECT_ID,
        ecosystem: 'Floresta',
        extent: 12,
        country: 'Brasil',
        position: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };
      projectsRepository.findById.mockResolvedValue({
        ...sampleProjectRecord,
        locations: [location],
      });
      projectsRepository.updateTransactional.mockResolvedValue({
        ...sampleProjectRecord,
        status: 'Listed',
        locations: [location],
      });

      const result = await service.update(PROJECT_ID, { status: 'Listed' });

      expect(result.status).toBe('Listed');
      expect(projectsRepository.updateTransactional).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({ status: 'Listed' }),
      );
    });

    it('valida datas considerando valores novos e antigos: rejeita data final anterior à data inicial armazenada', async () => {
      // Data inicial armazenada é 2026-01-15
      const dto: UpdateProjectDto = {
        lifetimeEnd: '2026-01-10', // anterior a 2026-01-15
      };

      await expect(service.update(PROJECT_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('valida datas considerando valores novos e antigos: rejeita data inicial posterior à data final armazenada', async () => {
      // Data final armazenada é 2026-12-31
      const dto: UpdateProjectDto = {
        lifetimeStart: '2027-01-01', // posterior a 2026-12-31
      };

      await expect(service.update(PROJECT_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('responde 404 quando o projeto a ser atualizado não existir', async () => {
      projectsRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('uuid-inexistente', { name: 'Novo Nome' }),
      ).rejects.toThrow(NotFoundException);
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('responde 404 quando o nova organização principal não existir', async () => {
      organizationsRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, { organizationId: 'prop-inexistente' }),
      ).rejects.toThrow(NotFoundException);
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('trata duplicidade na atualização de organizações secundárias (HTTP 409)', async () => {
      const dto: UpdateProjectDto = {
        organizations: [
          { organizationId: SECONDARY_ORGANIZATION_ID, role: 'Role A' },
          { organizationId: SECONDARY_ORGANIZATION_ID, role: 'Role B' },
        ],
      };

      await expect(service.update(PROJECT_ID, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });

    it('trata conflito caso a organização principal seja incluído na lista de secundários no PATCH (HTTP 409)', async () => {
      const dto: UpdateProjectDto = {
        organizations: [
          { organizationId: MAIN_ORGANIZATION_ID, role: 'Secundario' },
        ],
      };

      await expect(service.update(PROJECT_ID, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(projectsRepository.updateTransactional).not.toHaveBeenCalled();
    });
  });

  describe('remove (exclusão lógica / soft delete)', () => {
    it('executa exclusão lógica sem apagar fisicamente o registro quando o projeto existir', async () => {
      projectsRepository.findById.mockResolvedValue(sampleProjectRecord);

      await service.remove(PROJECT_ID);

      expect(projectsRepository.softDelete).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('responde 404 quando o projeto não existir ou já estiver removido logicamente', async () => {
      projectsRepository.findById.mockResolvedValue(null);

      await expect(service.remove(PROJECT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(projectsRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
