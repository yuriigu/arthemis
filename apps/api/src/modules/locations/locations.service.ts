import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { withRequestId } from '../../common/request-context.js';
import type { CreateLocationDto } from './dto/create-location.dto.js';
import type { FindLocationsQueryDto } from './dto/find-locations-query.dto.js';
import type { UpdateLocationDto } from './dto/update-location.dto.js';
import type { PublicLocation } from './models/i-location.js';
import { LocationsRepository } from './locations.repository.js';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(private readonly locationsRepository: LocationsRepository) {}

  async create(dto: CreateLocationDto): Promise<PublicLocation> {
    if (!(await this.locationsRepository.hasActiveProject(dto.projectId))) {
      throw new NotFoundException(
        `Projeto com id "${dto.projectId}" não encontrado`,
      );
    }

    const location = await this.locationsRepository.create(dto);
    this.logger.log(withRequestId(`Localização criada: ${location.id}`));
    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<PublicLocation> {
    const location = await this.locationsRepository.update(id, dto);
    if (!location) {
      throw new NotFoundException(`Localização com id "${id}" não encontrada`);
    }
    this.logger.log(withRequestId(`Localização atualizada: ${location.id}`));
    return location;
  }

  async findAll(query: FindLocationsQueryDto): Promise<PublicLocation[]> {
    return this.locationsRepository.findMany(query);
  }

  async findById(id: string): Promise<PublicLocation> {
    const location = await this.locationsRepository.findById(id);
    if (!location) {
      throw new NotFoundException(`Localização com id "${id}" não encontrada`);
    }
    return location;
  }
}
