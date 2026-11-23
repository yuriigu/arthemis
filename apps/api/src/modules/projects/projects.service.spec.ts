import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from './projects.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@arthemis/database';
import { UserRole } from '../users/enums/user-role.enum';

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
 
describe('ProjectsService.transition', () => {
  const project = {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = { project } as unknown as PrismaService;
  const service = new ProjectsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aceita a próxima etapa do ciclo', async () => {
    project.findUnique.mockResolvedValue({ id: 'p1', status: ProjectStatus.draft });
    project.update.mockResolvedValue({ id: 'p1', status: ProjectStatus.listed });

    await service.transition('p1', ProjectStatus.listed, UserRole.MANAGER);

    expect(project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: ProjectStatus.listed },
    });
  });

  it('rejeita transição fora da ordem', async () => {
    project.findUnique.mockResolvedValue({ id: 'p1', status: ProjectStatus.draft });

    await expect(
      service.transition('p1', ProjectStatus.validated, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(project.update).not.toHaveBeenCalled();
  });

  it('rejeita validar com manager', async () => {
    project.findUnique.mockResolvedValue({
      id: 'p1',
      status: ProjectStatus.under_validation,
    });

    await expect(
      service.transition('p1', ProjectStatus.validated, UserRole.MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('aceita validar com admin', async () => {
    project.findUnique.mockResolvedValue({
      id: 'p1',
      status: ProjectStatus.under_validation,
    });
    project.update.mockResolvedValue({ id: 'p1', status: ProjectStatus.validated });

    await service.transition('p1', ProjectStatus.validated, UserRole.ADMIN);

    expect(project.update).toHaveBeenCalled();
  });

  it('retorna 404 quando o projeto não existe', async () => {
    project.findUnique.mockResolvedValue(null);

    await expect(
      service.transition('nao-existe', ProjectStatus.listed, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});