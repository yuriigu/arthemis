import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ limit, offset }: PaginationDto) {
    return this.prisma.observation.findMany({
      where: { deletedAt: null },
      take: limit,
      skip: offset,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        indicator: {
          select: { id: true, name: true, unit: true },
        },
      },
    });
  }

  async create(data: CreateObservationDto[]) {
    if (!data || data.length === 0)
      throw new BadRequestException('No observations provided');

    const observations = await this.prisma.observation.createManyAndReturn({
      data: data.map((observation) => ({
        indicatorId: observation.indicatorId,
        value: observation.value,
        date: new Date(observation.date),
        position: observation.position,
      })),
      select: { id: true },
    });
    return observations.map(({ id }) => id);
  }

  async findOne(id: string) {
    const observation = await this.prisma.observation.findFirst({
      where: { id, deletedAt: null },
    });
    if (!observation) throw new NotFoundException('Observation not found');
    return observation;
  }

  async update(id: string, data: UpdateObservationDto) {
    const existing = await this.prisma.observation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Observation not found');

    return this.prisma.observation.update({
      where: { id },
      data: {
        indicatorId: data.indicatorId,
        value: data.value,
        date: data.date ? new Date(data.date) : undefined,
        position: data.position,
      },
    });
  }

  async remove(id: string) {
    const result = await this.prisma.observation.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0)
      throw new NotFoundException('Observation not found');
    return true;
  }
}
