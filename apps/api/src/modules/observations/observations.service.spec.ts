import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ObservationsService } from './observations.service';

describe('ObservationsService', () => {
  const observation = {
    findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    createManyAndReturn: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    updateMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const monitoringPeriod = {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = {
    observation,
    monitoringPeriod,
  } as unknown as PrismaService;
  const service = new ObservationsService(prisma);

  const mockPeriod = {
    id: 'p1',
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: new Date('2025-12-31T23:59:59.999Z'),
    verified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('filters observations by their indicator activity project', async () => {
      observation.findMany.mockResolvedValue([]);

      await service.findAll({
        projectId: '5d59a491-5595-423c-afbb-7964f7e75a0a',
        limit: 100,
        offset: 0,
      });

      expect(observation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            indicator: {
              activity: { projectId: '5d59a491-5595-423c-afbb-7964f7e75a0a' },
            },
          },
          take: 100,
          skip: 0,
        }),
      );
    });

    it('keeps the existing unfiltered list behavior when no project is provided', async () => {
      observation.findMany.mockResolvedValue([]);

      await service.findAll({ limit: 25, offset: 10 });

      expect(observation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          take: 25,
          skip: 10,
        }),
      );
    });
  });

  describe('create', () => {
    it('rejeita criação sem observações', async () => {
      await expect(service.create([])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejeita observação quando o período não é encontrado', async () => {
      monitoringPeriod.findUnique.mockResolvedValue(null);

      await expect(
        service.create([
          {
            indicatorId: 'ind-1',
            periodId: 'p1',
            value: 10,
            date: '2025-06-15T00:00:00.000Z',
          },
        ]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita observação com data anterior ao início do período', async () => {
      monitoringPeriod.findUnique.mockResolvedValue(mockPeriod);

      await expect(
        service.create([
          {
            indicatorId: 'ind-1',
            periodId: 'p1',
            value: 10,
            date: '2024-12-31T23:59:59.999Z',
          },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('rejeita observação com data posterior ao fim do período', async () => {
      monitoringPeriod.findUnique.mockResolvedValue(mockPeriod);

      await expect(
        service.create([
          {
            indicatorId: 'ind-1',
            periodId: 'p1',
            value: 10,
            date: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('rejeita observação em período verificado', async () => {
      monitoringPeriod.findUnique.mockResolvedValue({
        ...mockPeriod,
        verified: true,
      });

      await expect(
        service.create([
          {
            indicatorId: 'ind-1',
            periodId: 'p1',
            value: 10,
            date: '2025-06-15T00:00:00.000Z',
          },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('cria observações com sucesso quando a data está dentro do período', async () => {
      monitoringPeriod.findUnique.mockResolvedValue(mockPeriod);
      observation.createManyAndReturn.mockResolvedValue([
        { id: 'obs-1' },
        { id: 'obs-2' },
      ]);

      const result = await service.create([
        {
          indicatorId: 'ind-1',
          periodId: 'p1',
          value: 10,
          date: '2025-06-15T00:00:00.000Z',
        },
        {
          indicatorId: 'ind-2',
          periodId: 'p1',
          value: 20,
          date: '2025-08-20T00:00:00.000Z',
        },
      ]);

      expect(result).toEqual(['obs-1', 'obs-2']);
      expect(observation.createManyAndReturn).toHaveBeenCalledWith({
        data: [
          {
            indicatorId: 'ind-1',
            periodId: 'p1',
            value: 10,
            date: new Date('2025-06-15T00:00:00.000Z'),
            position: undefined,
          },
          {
            indicatorId: 'ind-2',
            periodId: 'p1',
            value: 20,
            date: new Date('2025-08-20T00:00:00.000Z'),
            position: undefined,
          },
        ],
        select: { id: true },
      });
    });
  });

  describe('update', () => {
    it('retorna 404 quando observação não existe ao atualizar', async () => {
      observation.findFirst.mockResolvedValue(null);

      await expect(
        service.update('obs-1', { value: 20 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita alteração de observação em período verificado', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        date: new Date('2025-06-15T00:00:00.000Z'),
        period: { ...mockPeriod, verified: true },
      });

      await expect(
        service.update('obs-1', { value: 20 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.update).not.toHaveBeenCalled();
    });

    it('rejeita alteração com nova data fora do período', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        date: new Date('2025-06-15T00:00:00.000Z'),
        period: mockPeriod,
      });
      monitoringPeriod.findUnique.mockResolvedValue(mockPeriod);

      await expect(
        service.update('obs-1', { date: '2026-02-01T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.update).not.toHaveBeenCalled();
    });

    it('rejeita alteração vinculando a novo período verificado', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        date: new Date('2025-06-15T00:00:00.000Z'),
        period: mockPeriod,
      });
      monitoringPeriod.findUnique.mockResolvedValue({
        id: 'p2',
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-12-31T23:59:59.999Z'),
        verified: true,
      });

      await expect(
        service.update('obs-1', { periodId: 'p2' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(observation.update).not.toHaveBeenCalled();
    });

    it('atualiza observação com sucesso quando o período não é verificado e a data é válida', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        date: new Date('2025-06-15T00:00:00.000Z'),
        period: mockPeriod,
      });
      monitoringPeriod.findUnique.mockResolvedValue(mockPeriod);
      observation.update.mockResolvedValue({ id: 'obs-1', value: 42 });

      const result = await service.update('obs-1', { value: 42 });

      expect(result).toEqual({ id: 'obs-1', value: 42 });
      expect(observation.update).toHaveBeenCalledWith({
        where: { id: 'obs-1' },
        data: {
          periodId: undefined,
          indicatorId: undefined,
          value: 42,
          date: undefined,
          position: undefined,
        },
      });
    });
  });

  describe('remove', () => {
    it('retorna 404 quando observação não existe ao remover', async () => {
      observation.findFirst.mockResolvedValue(null);

      await expect(service.remove('obs-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejeita remoção de observação em período verificado', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        period: { ...mockPeriod, verified: true },
      });

      await expect(service.remove('obs-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(observation.updateMany).not.toHaveBeenCalled();
    });

    it('remove observação (soft delete) com sucesso quando o período não é verificado', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        period: mockPeriod,
      });
      observation.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('obs-1');

      expect(result).toBe(true);
      expect(observation.updateMany).toHaveBeenCalledWith({
        where: { id: 'obs-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('lança NotFoundException se nenhum registro for afetado ao remover', async () => {
      observation.findFirst.mockResolvedValue({
        id: 'obs-1',
        periodId: 'p1',
        period: mockPeriod,
      });
      observation.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('obs-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
