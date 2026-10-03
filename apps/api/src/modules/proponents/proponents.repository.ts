import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ListProponentsFilter,
  PublicProponent,
} from './models/i-proponent.js';

/**
 * Colunas devolvidas nas leituras públicas.
 *
 * O `deletedAt` fica fora do `SELECT` (e o `WHERE` garante `deleted_at IS NULL`),
 * de modo que a exclusão lógica nunca vaza no contrato — mesma estratégia do
 * `UsersRepository` para o `password_hash`.
 */
const PUBLIC_PROPONENT_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ProponentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Persiste o proponente com `name` aparado e e-mail normalizado. */
  async create(data: {
    name: string;
    email: string;
  }): Promise<PublicProponent> {
    return this.prisma.proponent.create({
      data: {
        name: data.name.trim(),
        email: normalizeEmail(data.email),
      },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /**
   * Lista os proponentes **ativos** para os seletores da UI.
   *
   * - sem paginação (o volume é pequeno e o consumidor é um dropdown);
   * - `orderBy name asc` para a lista sair estável/legível no seletor;
   * - `search` filtra por trecho do nome, case-insensitive (o `mode:
   *   'insensitive'` usa `ILIKE` no Postgres);
   * - lista vazia devolve `[]` (nunca `null`).
   */
  async findMany(
    filter: ListProponentsFilter = {},
  ): Promise<PublicProponent[]> {
    const search = filter.search?.trim();

    return this.prisma.proponent.findMany({
      where: {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /**
   * Busca um proponente ativo pelo id.
   *
   * `findFirst` (e não `findUnique`) porque o filtro inclui `deletedAt: null`
   * além da PK: um registro removido logicamente se comporta como inexistente
   * (o gorm também escondia as linhas com `deleted_at` preenchido).
   */
  async findById(id: string): Promise<PublicProponent | null> {
    return this.prisma.proponent.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /**
   * Busca por e-mail normalizado, considerando **apenas ativos**.
   *
   * Usada na checagem de duplicidade do `POST`/`PATCH`. Como só enxerga registros
   * ativos, o e-mail de um proponente excluído logicamente pode ser reaproveitado.
   */
  async findByEmail(email: string): Promise<PublicProponent | null> {
    return this.prisma.proponent.findFirst({
      where: { email: normalizeEmail(email), deletedAt: null },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /**
   * Atualização parcial: só envia ao banco os campos realmente presentes no DTO
   * (`undefined` é omitido), preservando o que não foi enviado no `PATCH`.
   */
  async update(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<PublicProponent> {
    return this.prisma.proponent.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined
          ? { email: normalizeEmail(data.email) }
          : {}),
      },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /**
   * Exclusão lógica: marca `deleted_at` e preserva a linha e os vínculos
   * (mesmo efeito do `Delete` do gorm no legado, que fazia um `UPDATE` no
   * `deleted_at` em vez de `DELETE`).
   */
  async softDelete(id: string): Promise<PublicProponent> {
    return this.prisma.proponent.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: PUBLIC_PROPONENT_SELECT,
    });
  }

  /** Projetos ativos (não excluídos) vinculados ao proponente (`projects`). */
  async countActiveProjects(proponentId: string): Promise<number> {
    return this.prisma.project.count({
      where: { proponentId, deletedAt: null },
    });
  }

  /**
   * Usuários vinculados ao proponente.
   *
   * Não há filtro de soft delete: o `User` do legado **não** embutia
   * `gorm.Model`, logo não existe `deleted_at` em `users` — todo usuário com
   * `proponent_id` conta como ativo.
   */
  async countActiveUsers(proponentId: string): Promise<number> {
    return this.prisma.user.count({ where: { proponentId } });
  }
}

/**
 * Normaliza o e-mail (trim + lowercase) para evitar duplicados apenas por
 * caixa/espaços — o mesmo reforço aplicado em `UsersRepository`.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
