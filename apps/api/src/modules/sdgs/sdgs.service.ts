import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import type { PublicSdg } from './models/i-sdg.js';
import { SdgsRepository } from './sdgs.repository.js';

/**
 * Quantidade esperada de Objetivos de Desenvolvimento Sustentável definidos pela ONU.
 */
export const EXPECTED_SDGS_COUNT = 17;

/**
 * Serviço responsável pelas regras de negócio e consultas aos Objetivos de Desenvolvimento Sustentável (ODS).
 */
@Injectable()
export class SdgsService {
  private readonly logger = new Logger(SdgsService.name);

  constructor(private readonly sdgsRepository: SdgsRepository) {}

  /**
   * Lista todos os ODS ativos cadastrados, ordenados deterministicamente por seu número oficial (1..17).
   * Alerta caso a base de dados possua contagem inferior aos 17 ODS esperados da ONU (seed incompleto).
   *
   * @returns Lista completa dos ODS ativos.
   */
  async findAll(): Promise<PublicSdg[]> {
    const sdgs = await this.sdgsRepository.findAll();

    if (sdgs.length < EXPECTED_SDGS_COUNT) {
      this.logger.warn(
        withRequestId(
          `A base de dados contém apenas ${sdgs.length} de ${EXPECTED_SDGS_COUNT} ODS. Execute o seed para cadastrar todos os 17 objetivos.`,
        ),
      );
    }

    return sdgs;
  }

  /**
   * Busca um ODS ativo por seu identificador UUID.
   *
   * @param id Identificador do ODS.
   * @returns ODS encontrado.
   * @throws NotFoundException Quando o ODS não for localizado ou estiver removido logicamente.
   */
  async findById(id: string): Promise<PublicSdg> {
    const sdg = await this.sdgsRepository.findById(id);

    if (!sdg) {
      throw new NotFoundException(`ODS com id "${id}" não encontrada`);
    }

    return sdg;
  }

  /**
   * Valida a existência e integridade de uma lista de números de ODS (ex.: [1, 2, 13]).
   * Garante que todos os ODS informados estejam ativos e persistidos no banco.
   *
   * @param numbers Lista de números de ODS a validar.
   * @returns Lista dos ODS correspondentes encontrados no banco.
   * @throws NotFoundException Quando qualquer um dos números informados não existir ou estiver inativo.
   */
  async validateSdgsExist(numbers: number[]): Promise<PublicSdg[]> {
    const uniqueNumbers = Array.from(new Set(numbers));
    const foundSdgs = await this.sdgsRepository.findByNumbers(uniqueNumbers);

    if (foundSdgs.length !== uniqueNumbers.length) {
      const foundNumbersSet = new Set(foundSdgs.map((s) => s.number));
      const missingNumbers = uniqueNumbers.filter(
        (n) => !foundNumbersSet.has(n),
      );
      throw new NotFoundException(
        `ODS não encontrado(s) para o(s) número(s): ${missingNumbers.join(', ')}`,
      );
    }

    return foundSdgs;
  }
}
