import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService.findAll', () => {
  const project = {
    findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = { project } as unknown as PrismaService;
  const service = new ProjectsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes each project location ecosystem in the list response', async () => {
    project.findMany.mockResolvedValue([]);

    await service.findAll({ limit: 100, offset: 0 });

    expect(project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          locations: { select: { ecosystem: true } },
        }),
      }),
    );
  });
});
