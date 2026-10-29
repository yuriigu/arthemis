import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import type { CreateActivityDto } from './dto/create-activity.dto.js';
import type { FindActivitiesQueryDto } from './dto/find-activities-query.dto.js';
import type { UpdateActivityDto } from './dto/update-activity.dto.js';
import type { PublicActivity } from './models/i-activity.js';
import { ActivitiesRepository } from './activities.repository.js';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async create(dto: CreateActivityDto): Promise<PublicActivity> {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'A data final da atividade não pode ser anterior à data inicial',
      );
    }

    if (!(await this.activitiesRepository.hasActiveProject(dto.projectId))) {
      throw new NotFoundException(
        `Projeto com id "${dto.projectId}" não encontrado`,
      );
    }

    const locationIds = dto.locationIds ?? [];
    if (locationIds.length > 0) {
      const foundIds = await this.activitiesRepository.findActiveLocationIds(
        dto.projectId,
        locationIds,
      );
      if (foundIds.length !== locationIds.length) {
        throw new NotFoundException(
          'Uma ou mais localizações ativas do projeto não foram encontradas',
        );
      }
    }

    const activity = await this.activitiesRepository.create({
      projectId: dto.projectId,
      name: dto.name,
      description: dto.description,
      justification: dto.justification,
      startDate: dto.startDate,
      endDate: dto.endDate,
      locationIds,
    });
    this.logger.log(withRequestId(`Atividade criada: ${activity.id}`));
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<PublicActivity> {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException(`Atividade com id "${id}" não encontrada`);
    }

    const startDate = dto.startDate ?? activity.startDate;
    const endDate = dto.endDate ?? activity.endDate;
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'A data final da atividade não pode ser anterior à data inicial',
      );
    }

    if (dto.locationIds !== undefined) {
      const foundIds = await this.activitiesRepository.findActiveLocationIds(
        activity.projectId,
        dto.locationIds,
      );
      if (foundIds.length !== dto.locationIds.length) {
        throw new NotFoundException(
          'Uma ou mais localizações ativas do projeto não foram encontradas',
        );
      }
    }

    const updated = await this.activitiesRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Atividade com id "${id}" não encontrada`);
    }
    this.logger.log(withRequestId(`Atividade atualizada: ${updated.id}`));
    return updated;
  }

  async findAll(query: FindActivitiesQueryDto): Promise<PublicActivity[]> {
    return this.activitiesRepository.findMany({
      page: query.page,
      limit: query.limit,
      search: query.search,
      projectId: query.projectId,
    });
  }

  async findById(id: string): Promise<PublicActivity> {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException(`Atividade com id "${id}" não encontrada`);
    }
    return activity;
  }
}
