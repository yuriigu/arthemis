import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { SdgsService } from '../sdgs/sdgs.service.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { FindProjectsQueryDto } from './dto/find-projects-query.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';
import type {
  PaginatedProjectsResponse,
  PublicProjectDetail,
  PublicProjectSummary,
} from './models/i-project.js';
import {
  ProjectsRepository,
  ProjectWithDetails,
  ProjectWithSummary,
} from './projects.repository.js';
import {
  compareCivilDateStrings,
  formatCivilDateToString,
  parseCivilDateToUtc,
} from './utils/date.util.js';

/** Mensagem de erro para conflito de organização principal repetido como secundário. */
export const CONFLICT_MAIN_ORGANIZATION_AS_SECONDARY_MESSAGE =
  'A organização principal não pode ser incluída na lista de organizações secundárias';

/** Mensagem de erro para duplicidade de organizações associadas no projeto. */
export const CONFLICT_DUPLICATE_ORGANIZATION_MESSAGE =
  'A lista de organizações associadas contém identificadores duplicados';

/** Mensagem de erro para duplicidade de ODS no projeto. */
export const CONFLICT_DUPLICATE_SDG_MESSAGE =
  'A lista de ODS associados contém identificadores duplicados';

/** Mensagem de erro para projeto não localizado. */
export const PROJECT_NOT_FOUND_MESSAGE = 'Projeto não encontrado';
export const SD_LISTED_PREREQUISITES_MESSAGE =
  'Não é possível listar o projeto: justificativa e pelo menos uma localização ativa são obrigatórias';

/**
 * Serviço responsável pelas regras de negócio, validações de domínio e operações
 * transacionais do módulo de projetos socioambientais.
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly sdgsService: SdgsService,
  ) {}

  /**
   * Cria um projeto e seus vínculos com organizações e ODS em uma única transação atômica.
   *
   * Regras de negócio:
   * 1. Valida se a organização principal existe e está ativa (404);
   * 2. Valida se não há organizações secundárias duplicadas entre si (409);
   * 3. Valida se a organização principal não foi repetida como organização secundária (409);
   * 4. Valida se todas as organizações secundárias informadas existem e estão ativas (404);
   * 5. Valida se não há ODS duplicados no array (409);
   * 6. Valida se todos os ODS informados existem e estão ativos na base (404);
   * 7. Converte e persiste as datas civis estritas sem deslocamento temporal;
   * 8. Grava o projeto, organizações secundárias e ODS em uma transação do Prisma.
   *
   * @param dto Dados validados da requisição de criação.
   * @returns Projeto criado com seus relacionamentos formatados.
   */
  async create(dto: CreateProjectDto): Promise<PublicProjectDetail> {
    // 1. Confirma que a organização principal existe e está ativa
    const mainOrganization = await this.organizationsRepository.findById(
      dto.organizationId,
    );
    if (!mainOrganization) {
      throw new NotFoundException(
        `Organização principal com id "${dto.organizationId}" não encontrada`,
      );
    }

    // 2 e 3. Validações de duplicidades na lista de organizações secundárias
    if (dto.organizations && dto.organizations.length > 0) {
      const secondaryIds = dto.organizations.map((p) => p.organizationId);
      const uniqueSecondaryIds = new Set(secondaryIds);

      if (uniqueSecondaryIds.size !== secondaryIds.length) {
        throw new ConflictException(CONFLICT_DUPLICATE_ORGANIZATION_MESSAGE);
      }

      if (uniqueSecondaryIds.has(dto.organizationId)) {
        throw new ConflictException(
          CONFLICT_MAIN_ORGANIZATION_AS_SECONDARY_MESSAGE,
        );
      }

      // 4. Confirma que todas as organizações secundárias existem
      for (const prop of dto.organizations) {
        const found = await this.organizationsRepository.findById(
          prop.organizationId,
        );
        if (!found) {
          throw new NotFoundException(
            `Organização associada com id "${prop.organizationId}" não encontrada`,
          );
        }
      }
    }

    // 5. Validação de duplicidades na lista de ODS
    const uniqueSdgIds = new Set(dto.sdgIds);
    if (uniqueSdgIds.size !== dto.sdgIds.length) {
      throw new ConflictException(CONFLICT_DUPLICATE_SDG_MESSAGE);
    }

    // 6. Confirma que todos os ODS informados existem e obtém seus registros
    const foundSdgs = await this.sdgsService.validateSdgsExist(dto.sdgIds);
    const sdgUuids = foundSdgs.map((sdg) => sdg.id);

    // 7. Conversão de datas civis para persistência atômica
    const lifetimeStart = parseCivilDateToUtc(dto.lifetimeStart);
    const lifetimeEnd = parseCivilDateToUtc(dto.lifetimeEnd);

    // 8. Execução da transação de criação
    const createdProject = await this.projectsRepository.createTransactional({
      name: dto.name,
      lifetimeStart,
      lifetimeEnd,
      justification: dto.justification,
      organizationId: dto.organizationId,
      organizations: dto.organizations,
      sdgUuids,
    });

    this.logger.log(
      withRequestId(`Projeto criado com sucesso: ${createdProject.id}`),
    );

    return this.mapToProjectDetail(createdProject);
  }

  /**
   * Lista os projetos cadastrados utilizando paginação no banco de dados e busca textual opcional.
   * Exclui projetos que foram removidos logicamente.
   *
   * @param query Parâmetros de página, limite e termo de pesquisa.
   * @returns Lista de projetos e metadados padronizados da paginação.
   */
  async findAll(
    query: FindProjectsQueryDto,
  ): Promise<PaginatedProjectsResponse<PublicProjectSummary>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (page < 1) {
      throw new BadRequestException('O parâmetro page deve ser no mínimo 1');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException(
        'O parâmetro limit deve estar entre 1 e 100',
      );
    }

    const [projects, total] = await Promise.all([
      this.projectsRepository.findPaginated({
        page,
        limit,
        search: query.search,
      }),
      this.projectsRepository.count(query.search),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: projects.map((proj) => this.mapToProjectSummary(proj)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Obtém os detalhes completos de um projeto ativo pelo seu identificador.
   *
   * @param id Identificador do projeto.
   * @returns Dados do projeto, organização principal, secundários com papéis e ODS completos.
   * @throws NotFoundException Quando o projeto não existir ou estiver excluído logicamente.
   */
  async findById(id: string): Promise<PublicProjectDetail> {
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(PROJECT_NOT_FOUND_MESSAGE);
    }

    return this.mapToProjectDetail(project);
  }

  /**
   * Atualização parcial e transacional de um projeto e seus vínculos (PATCH /projects/:id).
   *
   * Regras de validação:
   * 1. Verifica se o projeto existe e está ativo (404);
   * 2. Valida coerência de datas comparando os novos valores e os valores já persistidos (400);
   * 3. Se houver nova organização principal, valida sua existência (404);
   * 4. Se houver alteração de organizações secundárias, valida duplicidades (409) e existência (404);
   * 5. Se houver alteração de ODS, valida duplicidades (409) e existência (404);
   * 6. Preserva relacionamentos não enviados na requisição;
   * 7. Executa as modificações em transação e retorna o projeto atualizado.
   *
   * @param id Identificador do projeto.
   * @param dto Dados de atualização parcial.
   * @returns Projeto atualizado.
   */
  async update(
    id: string,
    dto: UpdateProjectDto,
  ): Promise<PublicProjectDetail> {
    const existing = await this.projectsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(PROJECT_NOT_FOUND_MESSAGE);
    }

    const targetStatus = dto.status ?? existing.status;
    const effectiveJustification =
      dto.justification ?? existing.justification ?? '';
    if (
      targetStatus === 'Listed' &&
      (!effectiveJustification.trim() || existing.locations.length === 0)
    ) {
      throw new UnprocessableEntityException(SD_LISTED_PREREQUISITES_MESSAGE);
    }

    // Validação cruzada de datas com os valores já armazenados no banco
    const existingStartStr = formatCivilDateToString(existing.lifetimeStart);
    const existingEndStr = formatCivilDateToString(existing.lifetimeEnd);

    const effectiveStartStr = dto.lifetimeStart ?? existingStartStr;
    const effectiveEndStr = dto.lifetimeEnd ?? existingEndStr;

    if (
      effectiveStartStr &&
      effectiveEndStr &&
      compareCivilDateStrings(effectiveEndStr, effectiveStartStr) < 0
    ) {
      throw new BadRequestException(
        'lifetimeEnd deve ser maior ou igual a lifetimeStart',
      );
    }

    // Organização principal efetiva
    const effectiveMainOrganizationId =
      dto.organizationId ?? existing.organizationId;

    if (dto.organizationId !== undefined) {
      const foundMain = await this.organizationsRepository.findById(
        dto.organizationId,
      );
      if (!foundMain) {
        throw new NotFoundException(
          `Organização principal com id "${dto.organizationId}" não encontrada`,
        );
      }
    }

    // Validação de organizações secundárias se informadas no PATCH
    if (dto.organizations !== undefined) {
      const secondaryIds = dto.organizations.map((p) => p.organizationId);
      const uniqueSecondaryIds = new Set(secondaryIds);

      if (uniqueSecondaryIds.size !== secondaryIds.length) {
        throw new ConflictException(CONFLICT_DUPLICATE_ORGANIZATION_MESSAGE);
      }

      if (uniqueSecondaryIds.has(effectiveMainOrganizationId)) {
        throw new ConflictException(
          CONFLICT_MAIN_ORGANIZATION_AS_SECONDARY_MESSAGE,
        );
      }

      for (const prop of dto.organizations) {
        const found = await this.organizationsRepository.findById(
          prop.organizationId,
        );
        if (!found) {
          throw new NotFoundException(
            `Organização associada com id "${prop.organizationId}" não encontrada`,
          );
        }
      }
    }

    // Validação de ODS se informados no PATCH
    let sdgUuids: string[] | undefined = undefined;
    if (dto.sdgIds !== undefined) {
      const uniqueSdgIds = new Set(dto.sdgIds);
      if (uniqueSdgIds.size !== dto.sdgIds.length) {
        throw new ConflictException(CONFLICT_DUPLICATE_SDG_MESSAGE);
      }

      const foundSdgs = await this.sdgsService.validateSdgsExist(dto.sdgIds);
      sdgUuids = foundSdgs.map((sdg) => sdg.id);
    }

    const updated = await this.projectsRepository.updateTransactional(id, {
      name: dto.name,
      lifetimeStart: dto.lifetimeStart
        ? parseCivilDateToUtc(dto.lifetimeStart)
        : undefined,
      lifetimeEnd: dto.lifetimeEnd
        ? parseCivilDateToUtc(dto.lifetimeEnd)
        : undefined,
      justification: dto.justification,
      status: dto.status,
      organizationId: dto.organizationId,
      organizations: dto.organizations,
      sdgUuids,
    });

    this.logger.log(
      withRequestId(`Projeto atualizado com sucesso: ${updated.id}`),
    );

    return this.mapToProjectDetail(updated);
  }

  /**
   * Realiza a exclusão lógica (soft delete) do projeto e de seus vínculos ativos.
   * Não exclui os registros fisicamente, marcando o campo deletedAt.
   *
   * @param id Identificador do projeto.
   * @throws NotFoundException Quando o projeto não existir ou já estiver removido.
   */
  async remove(id: string): Promise<void> {
    const existing = await this.projectsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(PROJECT_NOT_FOUND_MESSAGE);
    }

    await this.projectsRepository.softDelete(id);

    this.logger.log(withRequestId(`Projeto removido logicamente: ${id}`));
  }

  /**
   * Mapeia a entidade do Prisma para o formato de detalhes públicos do projeto.
   */
  private mapToProjectDetail(project: ProjectWithDetails): PublicProjectDetail {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      lifetimeStart: formatCivilDateToString(project.lifetimeStart) ?? '',
      lifetimeEnd: formatCivilDateToString(project.lifetimeEnd) ?? '',
      justification: project.justification,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      organization: {
        id: project.organization.id,
        name: project.organization.name,
        email: project.organization.email,
        createdAt: project.organization.createdAt,
        updatedAt: project.organization.updatedAt,
      },
      organizations: (project.projectOrganizations ?? []).map((pp) => ({
        id: pp.id,
        organizationId: pp.organizationId,
        role: pp.role,
        name: pp.organization.name,
        email: pp.organization.email,
      })),
      sdgs: (project.projectSdgs ?? []).map((ps) => ps.sdg),
      activities: project.activities.map(
        ({ activityLocations, ...activity }) => ({
          ...activity,
          startDate: formatCivilDateToString(activity.startDate),
          endDate: formatCivilDateToString(activity.endDate),
          locationIds: activityLocations.map(({ locationId }) => locationId),
        }),
      ),
      locations: project.locations,
    };
  }

  /**
   * Mapeia a entidade do Prisma para o formato resumido da listagem paginada.
   */
  private mapToProjectSummary(
    project: ProjectWithSummary,
  ): PublicProjectSummary {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      lifetimeStart: formatCivilDateToString(project.lifetimeStart),
      lifetimeEnd: formatCivilDateToString(project.lifetimeEnd),
      justification: project.justification,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      organization: {
        id: project.organization.id,
        name: project.organization.name,
        email: project.organization.email,
        createdAt: project.organization.createdAt,
        updatedAt: project.organization.updatedAt,
      },
      sdgs: (project.projectSdgs ?? []).map((ps) => ps.sdg),
    };
  }
}
