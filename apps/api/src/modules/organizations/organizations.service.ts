import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';
import type { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto.js';
import type { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import type {
  PaginatedOrganizationsResponse,
  PublicOrganization,
} from './models/i-organization.js';
import { OrganizationsRepository } from './organizations.repository.js';

/** Mensagem do 409 de e-mail duplicado (mesmo texto curto do módulo `users`). */
export const EMAIL_ALREADY_REGISTERED_MESSAGE = 'email already registered';

/** Mensagem do 409 quando a organização ainda possui projetos ativos. */
export const ORGANIZATION_HAS_PROJECTS_MESSAGE =
  'organization has linked projects and cannot be deleted';

/** Mensagem do 409 quando a organização ainda possui usuários vinculados. */
export const ORGANIZATION_HAS_USERS_MESSAGE =
  'organization has linked users and cannot be deleted';

/**
 * Regras de negócio de organizações.
 *
 * Portabilidade do `OrganizationHandler` legado
 * (`legacy/brain/internal/handlers/organization.go`) para a arquitetura em camadas,
 * com as regras que o legado **não** tinha:
 * - unicidade de e-mail **na aplicação**, respondendo 409 (o legado permitia
 *   duplicados — o gorm só exigia `not null` em `email`);
 * - política de exclusão: soft delete bloqueado com 409 quando ainda existem
 *   projetos ou usuários vinculados (o legado apagava a organização e deixava
 *   projeto órfão, já que não havia FK).
 */
@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  /**
   * Cria a organização.
   *
   * A checagem de duplicidade acontece antes do `INSERT`; a normalização do
   * e-mail (trim + lowercase) é feita no repositório.
   *
   * @throws ConflictException 409 quando já existe organização ativo com o e-mail.
   */
  async create(dto: CreateOrganizationDto): Promise<PublicOrganization> {
    if (await this.organizationsRepository.findByEmail(dto.email)) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const organization = await this.organizationsRepository.create({
      name: dto.name,
      email: dto.email,
    });

    this.logger.log(withRequestId(`Organization created: ${organization.id}`));

    return organization;
  }

  /**
   * Lista os organizações ativas com paginação e busca textual opcional.
   */
  async findAll(
    query: ListOrganizationsQueryDto = {},
  ): Promise<PaginatedOrganizationsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (page < 1) {
      throw new BadRequestException('page must be at least 1');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    const [data, total] = await Promise.all([
      this.organizationsRepository.findPaginated({
        page,
        limit,
        search: query.search,
      }),
      this.organizationsRepository.count(query.search),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  /**
   * Detalhe de uma organização ativo.
   *
   * @throws NotFoundException 404 quando não existe (ou foi excluído logicamente).
   */
  async findById(id: string): Promise<PublicOrganization> {
    const organization = await this.organizationsRepository.findById(id);

    if (!organization) {
      throw new NotFoundException('organization not found');
    }

    return organization;
  }

  /**
   * Atualização parcial (`PATCH`).
   *
   * Só valida duplicidade de e-mail quando o campo vem no corpo, e ignora o
   * próprio registro na comparação (reenviar o e-mail atual não é conflito).
   *
   * @throws NotFoundException 404 quando a organização não existe;
   * @throws ConflictException 409 quando o e-mail pertence a outra organização.
   */
  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<PublicOrganization> {
    const existing = await this.organizationsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('organization not found');
    }

    if (dto.email !== undefined) {
      const owner = await this.organizationsRepository.findByEmail(dto.email);

      if (owner && owner.id !== id) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      }
    }

    const updated = await this.organizationsRepository.update(id, {
      name: dto.name,
      email: dto.email,
    });

    this.logger.log(withRequestId(`Organization updated: ${updated.id}`));

    return updated;
  }

  /**
   * Exclusão lógica (`DELETE`) com política de vínculos.
   *
   * Ordem: confirma que a organização existe (404), conta projetos ativos e
   * usuários vinculados (409 se houver qualquer um) e só então aplica o
   * `deletedAt` — evitando deixar projeto/usuário órfão como o legado fazia.
   *
   * @throws NotFoundException 404 quando a organização não existe;
   * @throws ConflictException 409 quando há projetos ou usuários vinculados.
   */
  async remove(id: string): Promise<void> {
    const existing = await this.organizationsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('organization not found');
    }

    const [activeProjects, linkedUsers] = await Promise.all([
      this.organizationsRepository.countActiveProjects(id),
      this.organizationsRepository.countActiveUsers(id),
    ]);

    if (activeProjects > 0) {
      throw new ConflictException(ORGANIZATION_HAS_PROJECTS_MESSAGE);
    }

    if (linkedUsers > 0) {
      throw new ConflictException(ORGANIZATION_HAS_USERS_MESSAGE);
    }

    await this.organizationsRepository.softDelete(id);

    this.logger.log(withRequestId(`Organization soft deleted: ${id}`));
  }
}
