import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PUBLIC_PROPONENT_SELECT } from '../proponents/proponents.repository.js';
import { PUBLIC_SDG_SELECT } from '../sdgs/sdgs.repository.js';

/**
 * Definição dos relacionamentos completos carregados para exibição de detalhes do projeto.
 */
export const PROJECT_DETAILS_INCLUDE = {
  proponent: {
    select: PUBLIC_PROPONENT_SELECT,
  },
  projectProponents: {
    where: { deletedAt: null },
    include: {
      proponent: {
        select: PUBLIC_PROPONENT_SELECT,
      },
    },
  },
  projectSdgs: {
    where: { deletedAt: null },
    include: {
      sdg: {
        select: PUBLIC_SDG_SELECT,
      },
    },
    orderBy: {
      sdg: {
        number: 'asc' as const,
      },
    },
  },
} as const;

/**
 * Definição dos relacionamentos carregados para a listagem paginada (evita overfetching).
 */
export const PROJECT_SUMMARY_INCLUDE = {
  proponent: {
    select: PUBLIC_PROPONENT_SELECT,
  },
  projectSdgs: {
    where: { deletedAt: null },
    include: {
      sdg: {
        select: PUBLIC_SDG_SELECT,
      },
    },
    orderBy: {
      sdg: {
        number: 'asc' as const,
      },
    },
  },
} as const;

/** Tipo inferido do projeto com relacionamentos completos carregados. */
export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: typeof PROJECT_DETAILS_INCLUDE;
}>;

/** Tipo inferido do projeto na listagem paginada. */
export type ProjectWithSummary = Prisma.ProjectGetPayload<{
  include: typeof PROJECT_SUMMARY_INCLUDE;
}>;

/**
 * Repositório responsável pelo acesso e persistência transacional de projetos,
 * proponentes associados e vínculos com ODS.
 */
@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um projeto e todos os seus vínculos com proponentes associados e ODS
   * dentro de uma única transação atômica do Prisma ($transaction).
   *
   * @param data Dados validados do projeto, proponentes secundários e IDs de ODS.
   * @returns Projeto recém-criado com todos os relacionamentos preenchidos.
   */
  async createTransactional(data: {
    name: string;
    lifetimeStart: Date;
    lifetimeEnd: Date;
    justification?: string;
    proponentId: string;
    proponents?: { proponentId: string; role?: string }[];
    sdgUuids: string[];
  }): Promise<ProjectWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a entidade principal do projeto
      const project = await tx.project.create({
        data: {
          name: data.name.trim(),
          lifetimeStart: data.lifetimeStart,
          lifetimeEnd: data.lifetimeEnd,
          justification: data.justification ? data.justification.trim() : null,
          proponentId: data.proponentId,
        },
      });

      // 2. Registra os proponentes secundários/associados, se houver
      if (data.proponents && data.proponents.length > 0) {
        for (const prop of data.proponents) {
          await tx.projectProponent.create({
            data: {
              projectId: project.id,
              proponentId: prop.proponentId,
              role: prop.role ? prop.role.trim() : null,
            },
          });
        }
      }

      // 3. Registra os vínculos com os ODS selecionados
      if (data.sdgUuids.length > 0) {
        for (const sdgId of data.sdgUuids) {
          await tx.projectSdg.create({
            data: {
              projectId: project.id,
              sdgId,
            },
          });
        }
      }

      // 4. Retorna a entidade completa com seus relacionamentos
      const createdWithRelations = await tx.project.findUnique({
        where: { id: project.id },
        include: PROJECT_DETAILS_INCLUDE,
      });

      return createdWithRelations!;
    });
  }

  /**
   * Constrói a cláusula WHERE do Prisma para listagem e contagem de projetos.
   *
   * Campos pesquisáveis na busca textual (search):
   * - `name`: Nome do projeto (busca parcial case-insensitive);
   * - `justification`: Justificativa do projeto (busca parcial case-insensitive);
   * - `proponent.name`: Nome da organização proponente principal (busca parcial case-insensitive).
   *
   * Justificativa: Permite ao usuário localizar projetos tanto pelo título da iniciativa,
   * quanto por palavras-chave do objetivo/justificativa ou pela entidade proponente.
   */
  private buildWhereClause(search?: string): Prisma.ProjectWhereInput {
    const trimmedSearch = search?.trim();

    return {
      deletedAt: null,
      ...(trimmedSearch
        ? {
            OR: [
              { name: { contains: trimmedSearch, mode: 'insensitive' } },
              {
                justification: { contains: trimmedSearch, mode: 'insensitive' },
              },
              {
                proponent: {
                  name: { contains: trimmedSearch, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }

  /**
   * Consulta paginada no banco de dados para os projetos ativos.
   *
   * @param params Parâmetros de paginação e termo de busca.
   * @returns Lista de projetos da página solicitada.
   */
  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<ProjectWithSummary[]> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(search);

    return this.prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PROJECT_SUMMARY_INCLUDE,
    });
  }

  /**
   * Conta a quantidade total de projetos correspondentes ao filtro de busca.
   * Aplica exatamente o mesmo filtro utilizado na consulta paginada.
   *
   * @param search Termo opcional de busca textual.
   * @returns Quantidade total de projetos encontrados.
   */
  async count(search?: string): Promise<number> {
    const where = this.buildWhereClause(search);
    return this.prisma.project.count({ where });
  }

  /**
   * Busca um projeto ativo pelo seu identificador UUID, incluindo todos os relacionamentos
   * com o proponente principal, proponentes associados e ODS.
   *
   * @param id Identificador do projeto.
   * @returns Projeto completo com relacionamentos ou null se não encontrado/excluído logicamente.
   */
  async findById(id: string): Promise<ProjectWithDetails | null> {
    return this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: PROJECT_DETAILS_INCLUDE,
    });
  }

  /**
   * Atualização parcial e transacional de um projeto e seus vínculos (PATCH /projects/:id).
   *
   * Preserva vínculos não informados e sincroniza de forma inteligente:
   * reativa vínculos soft-deleted existentes, atualiza papéis e remove logicamente
   * apenas os vínculos explicitamente retirados na requisição.
   *
   * @param id Identificador do projeto a ser atualizado.
   * @param data Dados escalares e vínculos a atualizar.
   * @returns Projeto atualizado com todos os relacionamentos.
   */
  async updateTransactional(
    id: string,
    data: {
      name?: string;
      lifetimeStart?: Date;
      lifetimeEnd?: Date;
      justification?: string;
      proponentId?: string;
      proponents?: { proponentId: string; role?: string }[];
      sdgUuids?: string[];
    },
  ): Promise<ProjectWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza dados escalares do projeto
      const projectUpdateData: Prisma.ProjectUpdateInput = {};

      if (data.name !== undefined) {
        projectUpdateData.name = data.name.trim();
      }
      if (data.lifetimeStart !== undefined) {
        projectUpdateData.lifetimeStart = data.lifetimeStart;
      }
      if (data.lifetimeEnd !== undefined) {
        projectUpdateData.lifetimeEnd = data.lifetimeEnd;
      }
      if (data.justification !== undefined) {
        projectUpdateData.justification = data.justification
          ? data.justification.trim()
          : null;
      }
      if (data.proponentId !== undefined) {
        projectUpdateData.proponent = {
          connect: { id: data.proponentId },
        };
      }

      await tx.project.update({
        where: { id },
        data: projectUpdateData,
      });

      // 2. Se a lista de proponentes associados foi informada, sincroniza os vínculos
      if (data.proponents !== undefined) {
        const existingProjectProponents = await tx.projectProponent.findMany({
          where: { projectId: id },
        });

        const newProponentIds = new Set(data.proponents.map((p) => p.proponentId));

        // Marca soft delete para os proponentes que não estão na nova lista
        for (const existing of existingProjectProponents) {
          if (!newProponentIds.has(existing.proponentId) && existing.deletedAt === null) {
            await tx.projectProponent.update({
              where: { id: existing.id },
              data: { deletedAt: new Date() },
            });
          }
        }

        // Insere novos ou atualiza/reativa os existentes
        for (const prop of data.proponents) {
          const existing = existingProjectProponents.find(
            (e) => e.proponentId === prop.proponentId,
          );
          const role = prop.role ? prop.role.trim() : null;

          if (existing) {
            await tx.projectProponent.update({
              where: { id: existing.id },
              data: {
                role,
                deletedAt: null, // Reativa se estiver excluído
              },
            });
          } else {
            await tx.projectProponent.create({
              data: {
                projectId: id,
                proponentId: prop.proponentId,
                role,
              },
            });
          }
        }
      }

      // 3. Se a lista de ODS foi informada, sincroniza os vínculos
      if (data.sdgUuids !== undefined) {
        const existingProjectSdgs = await tx.projectSdg.findMany({
          where: { projectId: id },
        });

        const newSdgIdSet = new Set(data.sdgUuids);

        // Marca soft delete para os ODS removidos da lista
        for (const existing of existingProjectSdgs) {
          if (!newSdgIdSet.has(existing.sdgId) && existing.deletedAt === null) {
            await tx.projectSdg.update({
              where: { id: existing.id },
              data: { deletedAt: new Date() },
            });
          }
        }

        // Insere novos ou reativa existentes
        for (const sdgId of data.sdgUuids) {
          const existing = existingProjectSdgs.find((e) => e.sdgId === sdgId);

          if (existing) {
            if (existing.deletedAt !== null) {
              await tx.projectSdg.update({
                where: { id: existing.id },
                data: { deletedAt: null },
              });
            }
          } else {
            await tx.projectSdg.create({
              data: {
                projectId: id,
                sdgId,
              },
            });
          }
        }
      }

      // 4. Retorna a entidade atualizada
      const updatedProject = await tx.project.findUnique({
        where: { id },
        include: PROJECT_DETAILS_INCLUDE,
      });

      return updatedProject!;
    });
  }

  /**
   * Executa a exclusão lógica (soft delete) do projeto e de seus vínculos associados.
   * Preserva fisicamente as linhas para histórico e integridade do banco.
   *
   * @param id Identificador do projeto a ser desativado.
   */
  async softDelete(id: string): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { deletedAt: now },
      });

      await tx.projectProponent.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      });

      await tx.projectSdg.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      });
    });
  }
}
