import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import { parseCivilDateToUtc } from '../projects/utils/date.util.js';
import type { CreateObservationDto } from './dto/create-observation.dto.js';
import type { FindObservationsQueryDto } from './dto/find-observations-query.dto.js';
import type { UpdateObservationDto } from './dto/update-observation.dto.js';
import type { PublicObservation } from './models/i-observation.js';
import { ObservationsRepository } from './observations.repository.js';

@Injectable()
export class ObservationsService {
  private readonly logger = new Logger(ObservationsService.name);

  constructor(
    private readonly observationsRepository: ObservationsRepository,
  ) {}

  async create(dto: CreateObservationDto): Promise<PublicObservation> {
    if (
      !(await this.observationsRepository.hasActiveIndicator(dto.indicatorId))
    ) {
      throw new NotFoundException(
        `Indicador com id "${dto.indicatorId}" não encontrado`,
      );
    }

    const observation = await this.observationsRepository.create({
      indicatorId: dto.indicatorId,
      value: dto.value,
      date: parseCivilDateToUtc(dto.date),
      position: dto.position,
    });
    this.logger.log(withRequestId(`Observação criada: ${observation.id}`));
    return observation;
  }

  async update(
    id: string,
    dto: UpdateObservationDto,
  ): Promise<PublicObservation> {
    if (
      dto.indicatorId !== undefined &&
      !(await this.observationsRepository.hasActiveIndicator(dto.indicatorId))
    ) {
      throw new NotFoundException(
        `Indicador com id "${dto.indicatorId}" não encontrado`,
      );
    }

    const observation = await this.observationsRepository.update(id, dto);
    if (!observation) {
      throw new NotFoundException(`Observação com id "${id}" não encontrada`);
    }
    this.logger.log(withRequestId(`Observação atualizada: ${observation.id}`));
    return observation;
  }

  async findAll(query: FindObservationsQueryDto): Promise<PublicObservation[]> {
    return this.observationsRepository.findMany(query);
  }

  async findById(id: string): Promise<PublicObservation> {
    const observation = await this.observationsRepository.findById(id);
    if (!observation) {
      throw new NotFoundException(`Observação com id "${id}" não encontrada`);
    }
    return observation;
  }
}
