import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CreateProponentDto } from './dto/create-proponent.dto.js';
import type { ListProponentsQueryDto } from './dto/list-proponents-query.dto.js';
import type { UpdateProponentDto } from './dto/update-proponent.dto.js';
import type { PublicProponent } from './models/i-proponent.js';
import { ProponentsRepository } from './proponents.repository.js';

/** Mensagem do 409 de e-mail duplicado (mesmo texto curto do módulo `users`). */
export const EMAIL_ALREADY_REGISTERED_MESSAGE = 'email already registered';

/** Mensagem do 409 quando o proponente ainda possui projetos ativos. */
export const PROPONENT_HAS_PROJECTS_MESSAGE =
  'proponent has linked projects and cannot be deleted';

/** Mensagem do 409 quando o proponente ainda possui usuários vinculados. */
export const PROPONENT_HAS_USERS_MESSAGE =
  'proponent has linked users and cannot be deleted';

/**
 * Regras de negócio de proponentes.
 *
 * Portabilidade do `ProponentHandler` legado
 * (`legacy/brain/internal/handlers/proponent.go`) para a arquitetura em camadas,
 * com as regras que o legado **não** tinha:
 * - unicidade de e-mail **na aplicação**, respondendo 409 (o legado permitia
 *   duplicados — o gorm só exigia `not null` em `email`);
 * - política de exclusão: soft delete bloqueado com 409 quando ainda existem
 *   projetos ou usuários vinculados (o legado apagava o proponente e deixava
 *   projeto órfão, já que não havia FK).
 */
@Injectable()
export class ProponentsService {
  private readonly logger = new Logger(ProponentsService.name);

  constructor(private readonly proponentsRepository: ProponentsRepository) {}

  /**
   * Cria o proponente.
   *
   * A checagem de duplicidade acontece antes do `INSERT`; a normalização do
   * e-mail (trim + lowercase) é feita no repositório.
   *
   * @throws ConflictException 409 quando já existe proponente ativo com o e-mail.
   */
  async create(dto: CreateProponentDto): Promise<PublicProponent> {
    if (await this.proponentsRepository.findByEmail(dto.email)) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const proponent = await this.proponentsRepository.create({
      name: dto.name,
      email: dto.email,
    });

    this.logger.log(`Proponent created: ${proponent.id}`);

    return proponent;
  }

  /**
   * Lista os proponentes ativos para seletores (`GET /proponents?search=`).
   * Sem paginação; sem registros devolve `[]`.
   */
  async findAll(
    query: ListProponentsQueryDto = {},
  ): Promise<PublicProponent[]> {
    return this.proponentsRepository.findMany({ search: query.search });
  }

  /**
   * Detalhe de um proponente ativo.
   *
   * @throws NotFoundException 404 quando não existe (ou foi excluído logicamente).
   */
  async findById(id: string): Promise<PublicProponent> {
    const proponent = await this.proponentsRepository.findById(id);

    if (!proponent) {
      throw new NotFoundException('proponent not found');
    }

    return proponent;
  }

  /**
   * Atualização parcial (`PATCH`).
   *
   * Só valida duplicidade de e-mail quando o campo vem no corpo, e ignora o
   * próprio registro na comparação (reenviar o e-mail atual não é conflito).
   *
   * @throws NotFoundException 404 quando o proponente não existe;
   * @throws ConflictException 409 quando o e-mail pertence a outro proponente.
   */
  async update(id: string, dto: UpdateProponentDto): Promise<PublicProponent> {
    const existing = await this.proponentsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('proponent not found');
    }

    if (dto.email !== undefined) {
      const owner = await this.proponentsRepository.findByEmail(dto.email);

      if (owner && owner.id !== id) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      }
    }

    const updated = await this.proponentsRepository.update(id, {
      name: dto.name,
      email: dto.email,
    });

    this.logger.log(`Proponent updated: ${updated.id}`);

    return updated;
  }

  /**
   * Exclusão lógica (`DELETE`) com política de vínculos.
   *
   * Ordem: confirma que o proponente existe (404), conta projetos ativos e
   * usuários vinculados (409 se houver qualquer um) e só então aplica o
   * `deletedAt` — evitando deixar projeto/usuário órfão como o legado fazia.
   *
   * @throws NotFoundException 404 quando o proponente não existe;
   * @throws ConflictException 409 quando há projetos ou usuários vinculados.
   */
  async remove(id: string): Promise<void> {
    const existing = await this.proponentsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('proponent not found');
    }

    const [activeProjects, linkedUsers] = await Promise.all([
      this.proponentsRepository.countActiveProjects(id),
      this.proponentsRepository.countActiveUsers(id),
    ]);

    if (activeProjects > 0) {
      throw new ConflictException(PROPONENT_HAS_PROJECTS_MESSAGE);
    }

    if (linkedUsers > 0) {
      throw new ConflictException(PROPONENT_HAS_USERS_MESSAGE);
    }

    await this.proponentsRepository.softDelete(id);

    this.logger.log(`Proponent soft deleted: ${id}`);
  }
}
