import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateIndicatorDto[]) {
    if (!data || data.length === 0)
      throw new BadRequestException('No indicators provided');

    const indicators = await this.prisma.indicator.createManyAndReturn({
      data: data.map((ind) => ({
        activityId: ind.activityId,
        locationId: ind.locationId,
        name: ind.name,
        unit: ind.unit,
        valueBaseline: ind.valueBaseline,
        valueReference: ind.valueReference,
        observationMethod: ind.observationMethod,
        justification: ind.justification,
      })),
      select: { id: true },
    });
    return indicators.map(({ id }) => id);
  }

  async findAll({ limit, offset }: PaginationDto) {
    return this.prisma.indicator.findMany({
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: { observations: { where: { deletedAt: null } } },
    });
    if (!indicator) throw new NotFoundException('Indicator not found');
    return indicator;
  }

  async update(id: string, data: UpdateIndicatorDto) {
    return this.prisma.indicator.update({
      where: { id },
      data: {
        name: data.name,
        unit: data.unit,
        valueBaseline: data.valueBaseline,
        valueReference: data.valueReference,
        observationMethod: data.observationMethod,
        justification: data.justification,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.indicator.delete({ where: { id } });
    return true;
  }
}
