import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ListOrganizationsFilter,
  PublicOrganization,
} from './models/i-organization.js';

/**
 * Colunas devolvidas nas leituras públicas.
 *
 * O `deletedAt` fica fora do `SELECT` (e o `WHERE` garante `deleted_at IS NULL`),
 * de modo que a exclusão lógica nunca vaza no contrato — mesma estratégia do
 * `UsersRepository` para o `password_hash`.
 */
export const PUBLIC_ORGANIZATION_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Persiste a organização com `name` aparado e e-mail normalizado. */
  async create(data: {
    name: string;
    email: string;
  }): Promise<PublicOrganization> {
    return this.prisma.organization.create({
      data: {
        name: data.name.trim(),
        email: normalizeEmail(data.email),
      },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /** Lista os organizações ativas na página solicitada, ordenados pelo nome. */
  async findPaginated(
    filter: ListOrganizationsFilter,
  ): Promise<PublicOrganization[]> {
    const { page, limit } = filter;
    return this.prisma.organization.findMany({
      where: this.buildWhereClause(filter.search),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /** Conta os organizações ativas correspondentes ao termo de busca. */
  async count(search?: string): Promise<number> {
    return this.prisma.organization.count({
      where: this.buildWhereClause(search),
    });
  }

  private buildWhereClause(search?: string): Prisma.OrganizationWhereInput {
    const trimmedSearch = search?.trim();

    return {
      deletedAt: null,
      ...(trimmedSearch
        ? { name: { contains: trimmedSearch, mode: 'insensitive' } }
        : {}),
    };
  }

  /**
   * Busca uma organização ativo pelo id.
   *
   * `findFirst` (e não `findUnique`) porque o filtro inclui `deletedAt: null`
   * além da PK: um registro removido logicamente se comporta como inexistente
   * (o gorm também escondia as linhas com `deleted_at` preenchido).
   */
  async findById(id: string): Promise<PublicOrganization | null> {
    return this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /**
   * Busca por e-mail normalizado, considerando **apenas ativos**.
   *
   * Usada na checagem de duplicidade do `POST`/`PATCH`. Como só enxerga registros
   * ativos, o e-mail de uma organização excluído logicamente pode ser reaproveitado.
   */
  async findByEmail(email: string): Promise<PublicOrganization | null> {
    return this.prisma.organization.findFirst({
      where: { email: normalizeEmail(email), deletedAt: null },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /**
   * Atualização parcial: só envia ao banco os campos realmente presentes no DTO
   * (`undefined` é omitido), preservando o que não foi enviado no `PATCH`.
   */
  async update(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<PublicOrganization> {
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined
          ? { email: normalizeEmail(data.email) }
          : {}),
      },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /**
   * Exclusão lógica: marca `deleted_at` e preserva a linha e os vínculos
   * (mesmo efeito do `Delete` do gorm no legado, que fazia um `UPDATE` no
   * `deleted_at` em vez de `DELETE`).
   */
  async softDelete(id: string): Promise<PublicOrganization> {
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: PUBLIC_ORGANIZATION_SELECT,
    });
  }

  /** Projetos ativos (não excluídos) vinculados aa organização (`projects`). */
  async countActiveProjects(organizationId: string): Promise<number> {
    return this.prisma.project.count({
      where: { organizationId, deletedAt: null },
    });
  }

  /**
   * Usuários vinculados aa organização.
   *
   * Não há filtro de soft delete: o `User` do legado **não** embutia
   * `gorm.Model`, logo não existe `deleted_at` em `users` — todo usuário com
   * `organization_id` conta como ativo.
   */
  async countActiveUsers(organizationId: string): Promise<number> {
    return this.prisma.user.count({ where: { organizationId } });
  }
}

/**
 * Normaliza o e-mail (trim + lowercase) para evitar duplicados apenas por
 * caixa/espaços — o mesmo reforço aplicado em `UsersRepository`.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
