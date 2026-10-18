import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PublicSdg } from './models/i-sdg.js';

/**
 * Colunas públicas selecionadas para o retorno de ODS na API.
 * Mantém o campo de exclusão lógica (deletedAt) oculto do contrato público.
 */
export const PUBLIC_SDG_SELECT = {
  id: true,
  number: true,
  name: true,
  iconUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Repositório responsável pelo acesso a dados dos Objetivos de Desenvolvimento Sustentável (ODS).
 */
@Injectable()
export class SdgsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna todos os ODS ativos no banco de dados, ordenados deterministicamente por seu número oficial (1..17).
   *
   * @returns Lista de ODS ativos em ordem crescente de número.
   */
  async findAll(): Promise<PublicSdg[]> {
    return this.prisma.sdg.findMany({
      where: { deletedAt: null },
      orderBy: { number: 'asc' },
      select: PUBLIC_SDG_SELECT,
    });
  }

  /**
   * Busca um ODS ativo pelo seu identificador único (UUID).
   *
   * @param id Identificador UUID do ODS.
   * @returns ODS encontrado ou null se não existir/estiver removido.
   */
  async findById(id: string): Promise<PublicSdg | null> {
    return this.prisma.sdg.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_SDG_SELECT,
    });
  }

  /**
   * Busca um ODS ativo pelo seu número oficial (1..17).
   *
   * @param number Número oficial do ODS.
   * @returns ODS encontrado ou null se não existir/estiver removido.
   */
  async findByNumber(number: number): Promise<PublicSdg | null> {
    return this.prisma.sdg.findFirst({
      where: { number, deletedAt: null },
      select: PUBLIC_SDG_SELECT,
    });
  }

  /**
   * Busca múltiplos ODS ativos a partir de uma lista de números oficiais.
   *
   * @param numbers Lista de números de ODS (ex.: [1, 2, 13]).
   * @returns Lista de ODS ativos correspondentes aos números solicitados.
   */
  async findByNumbers(numbers: number[]): Promise<PublicSdg[]> {
    if (numbers.length === 0) {
      return [];
    }

    return this.prisma.sdg.findMany({
      where: {
        number: { in: numbers },
        deletedAt: null,
      },
      orderBy: { number: 'asc' },
      select: PUBLIC_SDG_SELECT,
    });
  }

  /**
   * Retorna a contagem total de ODS ativos cadastrados.
   *
   * @returns Quantidade de ODS ativos na base de dados.
   */
  async count(): Promise<number> {
    return this.prisma.sdg.count({
      where: { deletedAt: null },
    });
  }
}
