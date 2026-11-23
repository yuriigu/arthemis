import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MonitoringPeriodsService } from './monitoring-periods.service';

describe('MonitoringPeriodsService', () => {
  const monitoringPeriod = {
    findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = { monitoringPeriod } as unknown as PrismaService;
  const service = new MonitoringPeriodsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria o primeiro período do projeto', async () => {
    monitoringPeriod.findMany.mockResolvedValue([]);
    monitoringPeriod.create.mockResolvedValue({ id: 'p1' });

    await service.create({
      projectId: 'proj',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      yearT: 2025,
    });

    expect(monitoringPeriod.create).toHaveBeenCalled();
  });

  it('recusa período que sobrepõe outro', async () => {
    monitoringPeriod.findMany.mockResolvedValue([
      {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
      },
    ]);

    await expect(
      service.create({
        projectId: 'proj',
        startDate: '2025-06-01',
        endDate: '2025-12-31',
        yearT: 2025,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(monitoringPeriod.create).not.toHaveBeenCalled();
  });

  it('recusa intervalo entre o anterior e o novo', async () => {
    monitoringPeriod.findMany.mockResolvedValue([
      {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      },
    ]);

    await expect(
      service.create({
        projectId: 'proj',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        yearT: 2025,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marca o período como verificado', async () => {
    monitoringPeriod.findUnique.mockResolvedValue({ id: 'p1', verified: false });
    monitoringPeriod.update.mockResolvedValue({ id: 'p1', verified: true });

    await service.verify('p1');

    expect(monitoringPeriod.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { verified: true },
    });
  });

  it('retorna 404 ao verificar período inexistente', async () => {
    monitoringPeriod.findUnique.mockResolvedValue(null);

    await expect(service.verify('nao-existe')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});