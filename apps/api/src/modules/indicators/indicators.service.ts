import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import type { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import type { FindIndicatorsQueryDto } from './dto/find-indicators-query.dto.js';
import type { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import type { PublicIndicator } from './models/i-indicator.js';
import { IndicatorsRepository } from './indicators.repository.js';

@Injectable()
export class IndicatorsService {
  private readonly logger = new Logger(IndicatorsService.name);

  constructor(private readonly indicatorsRepository: IndicatorsRepository) {}

  async create(dto: CreateIndicatorDto): Promise<PublicIndicator> {
    if (!(await this.indicatorsRepository.hasActiveActivity(dto.activityId))) {
      throw new NotFoundException(
        `Atividade com id "${dto.activityId}" não encontrada`,
      );
    }
    if (!(await this.indicatorsRepository.hasActiveLocation(dto.locationId))) {
      throw new NotFoundException(
        `Localização com id "${dto.locationId}" não encontrada`,
      );
    }
    if (
      !(await this.indicatorsRepository.activityAndLocationBelongToSameProject(
        dto.activityId,
        dto.locationId,
      ))
    ) {
      throw new NotFoundException(
        'Atividade e localização devem pertencer ao mesmo projeto',
      );
    }

    const indicator = await this.indicatorsRepository.create(dto);
    this.logger.log(withRequestId(`Indicador criado: ${indicator.id}`));
    return indicator;
  }

  async update(id: string, dto: UpdateIndicatorDto): Promise<PublicIndicator> {
    const current = await this.indicatorsRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Indicador com id "${id}" não encontrado`);
    }

    if (
      dto.activityId !== undefined &&
      !(await this.indicatorsRepository.hasActiveActivity(dto.activityId))
    ) {
      throw new NotFoundException(
        `Atividade com id "${dto.activityId}" não encontrada`,
      );
    }
    if (
      dto.locationId !== undefined &&
      !(await this.indicatorsRepository.hasActiveLocation(dto.locationId))
    ) {
      throw new NotFoundException(
        `Localização com id "${dto.locationId}" não encontrada`,
      );
    }
    if (
      (dto.activityId !== undefined || dto.locationId !== undefined) &&
      !(await this.indicatorsRepository.activityAndLocationBelongToSameProject(
        dto.activityId ?? current.activityId,
        dto.locationId ?? current.locationId,
      ))
    ) {
      throw new NotFoundException(
        'Atividade e localização devem pertencer ao mesmo projeto',
      );
    }

    const indicator = await this.indicatorsRepository.update(id, dto);
    if (!indicator) {
      throw new NotFoundException(`Indicador com id "${id}" não encontrado`);
    }
    this.logger.log(withRequestId(`Indicador atualizado: ${indicator.id}`));
    return indicator;
  }

  async findAll(query: FindIndicatorsQueryDto): Promise<PublicIndicator[]> {
    return this.indicatorsRepository.findMany(query);
  }

  async findById(id: string): Promise<PublicIndicator> {
    const indicator = await this.indicatorsRepository.findById(id);
    if (!indicator) {
      throw new NotFoundException(`Indicador com id "${id}" não encontrado`);
    }
    return indicator;
  }
}
