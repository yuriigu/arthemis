import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ObservationsService } from './observations.service';

describe('ObservationsService.findAll', () => {
  const observation = {
    findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = { observation } as unknown as PrismaService;
  const service = new ObservationsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
