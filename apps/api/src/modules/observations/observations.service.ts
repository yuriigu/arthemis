import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FindObservationsDto } from './dto/find-observations.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ limit, offset, projectId }: FindObservationsDto) {
    return this.prisma.observation.findMany({
      where: {
        deletedAt: null,
        ...(projectId ? { indicator: { activity: { projectId } } } : {}),
      },
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

    for (const observation of data) {
  await this.assertWritable(observation.periodId, new Date(observation.date));
}

    const observations = await this.prisma.observation.createManyAndReturn({
      data: data.map((observation) => ({
        indicatorId: observation.indicatorId,
        periodId: observation.periodId,
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
      include: { period: true },
    });
    if (!existing) throw new NotFoundException('Observation not found');
    if (existing.period.verified) {
      throw new BadRequestException('Período verificado não aceita alteração');
        }

      const nextDate = data.date ? new Date(data.date) : existing.date;
      const periodId = data.periodId ?? existing.periodId;
      await this.assertWritable(periodId, nextDate);
    return this.prisma.observation.update({
      where: { id },
      data: {
        periodId: data.periodId,
        indicatorId: data.indicatorId,
        value: data.value,
        date: data.date ? new Date(data.date) : undefined,
        position: data.position,
      },
    });
  }

  private async assertWritable(periodId: string, date: Date) {
  const period = await this.prisma.monitoringPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw new NotFoundException('Período não encontrado');
  if (period.verified) {
    throw new BadRequestException('Período verificado não aceita alteração');
  }
  if (date < period.startDate || date > period.endDate) {
    throw new BadRequestException('Data fora do período de monitoramento');
  }
  return period;
}

async remove(id: string) {
  const existing = await this.prisma.observation.findFirst({
    where: { id, deletedAt: null },
    include: { period: true },
  });
  if (!existing) throw new NotFoundException('Observation not found');
  if (existing.period.verified) {
    throw new BadRequestException('Período verificado não aceita alteração');
  }

  const result = await this.prisma.observation.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundException('Observation not found');
  return true;
}
}
