import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Direction } from '@arthemis/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertValidThresholdForDirection(
    direction: Direction | undefined | null,
    threshold: number | undefined | null,
  ) {
    if (
      direction === Direction.decreases_with_condition &&
      (threshold === undefined || threshold === null || Number.isNaN(threshold))
    ) {
      throw new BadRequestException(
        'Threshold is required when direction is decreases_with_condition',
      );
    }
  }

  async create(data: CreateIndicatorDto[]) {
    if (!data || data.length === 0)
      throw new BadRequestException('No indicators provided');

    for (const ind of data) {
      this.assertValidThresholdForDirection(ind.direction, ind.threshold);
    }

    const indicators = await this.prisma.indicator.createManyAndReturn({
      data: data.map((ind) => ({
        activityId: ind.activityId,
        locationId: ind.locationId,
        name: ind.name,
        component: ind.component,
        direction: ind.direction,
        unit: ind.unit,
        valueBaseline: ind.valueBaseline,
        valueReference: ind.valueReference,
        threshold: ind.threshold,
        referenceSource: ind.referenceSource,
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
    const existing = await this.prisma.indicator.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Indicator not found');

    const effectiveDirection = data.direction ?? existing.direction;
    const effectiveThreshold =
      data.threshold !== undefined ? data.threshold : existing.threshold;

    this.assertValidThresholdForDirection(
      effectiveDirection,
      effectiveThreshold,
    );

    return this.prisma.indicator.update({
      where: { id },
      data: {
        name: data.name,
        component: data.component,
        direction: data.direction,
        unit: data.unit,
        valueBaseline: data.valueBaseline,
        valueReference: data.valueReference,
        threshold: data.threshold,
        referenceSource: data.referenceSource,
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
