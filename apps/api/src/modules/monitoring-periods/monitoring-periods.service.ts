import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMonitoringPeriodDto } from './dto/create-monitoring-period.dto';

@Injectable()
export class MonitoringPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: string): Promise<unknown> {
  return this.prisma.monitoringPeriod.findMany({
    where: { projectId },
    orderBy: { startDate: 'asc' },
  });
}
  async create(dto: CreateMonitoringPeriodDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('A data final deve ser posterior à inicial');
    }

    await this.assertFits(dto.projectId, start, end);

    return this.prisma.monitoringPeriod.create({
      data: {
        projectId: dto.projectId,
        startDate: start,
        endDate: end,
        yearT: dto.yearT,
      },
    });
  }

  async verify(id: string) {
    const period = await this.prisma.monitoringPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Período não encontrado');

    return this.prisma.monitoringPeriod.update({
      where: { id },
      data: { verified: true },
    });
  }

  private async assertFits(projectId: string, start: Date, end: Date) {
    const periods = await this.prisma.monitoringPeriod.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });

    const overlaps = periods.some(
      (period) => start <= period.endDate && end >= period.startDate,
    );
    if (overlaps) {
      throw new BadRequestException('Período sobrepõe outro do mesmo projeto');
    }

    if (periods.length === 0) return;

    const previous = [...periods].reverse().find((period) => period.endDate < start);
    if (previous) {
      const nextDay = new Date(previous.endDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      if (start.toISOString().slice(0, 10) !== nextDay.toISOString().slice(0, 10)) {
        throw new BadRequestException('Período precisa continuar o anterior, sem intervalo');
      }
    }
  }
}