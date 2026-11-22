import {  BadRequestException,  ForbiddenException,  Injectable,  NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProponentDto } from './dto/add-proponent.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProjectStatus } from '@arthemis/database';
import { UserRole } from '../users/enums/user-role.enum';

const NEXT_STATUS: Record<ProjectStatus, ProjectStatus | null> = {
  [ProjectStatus.draft]: ProjectStatus.listed,
  [ProjectStatus.listed]: ProjectStatus.under_validation,
  [ProjectStatus.under_validation]: ProjectStatus.validated,
  [ProjectStatus.validated]: ProjectStatus.under_verification,
  [ProjectStatus.under_verification]: ProjectStatus.verified,
  [ProjectStatus.verified]: null,
  [ProjectStatus.expired]: null,
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        proponentId: data.proponentId,
        name: data.name,
        lifetimeStart: data.lifetimeStart ? new Date(data.lifetimeStart) : null,
        lifetimeEnd: data.lifetimeEnd ? new Date(data.lifetimeEnd) : null,
        justification: data.justification,

        // Vinculando os SDGs (N:N).
        // Assume que no schema.prisma a tabela pivô se chama 'projectSdgs' ou 'projectSdg'
        projectSdgs: data.sdgIds?.length
          ? {
              create: data.sdgIds.map((sdgId) => ({
                sdg: { connect: { id: sdgId } },
              })),
            }
          : undefined,
      },
      select: { id: true },
    });
    return project.id;
  }

  async findAll({ limit, offset }: PaginationDto) {
    return this.prisma.project.findMany({
      take: limit,
      skip: offset,
      include: {
        proponent: true,
        locations: {
          select: { ecosystem: true },
        },
        projectSdgs: {
          include: {
            sdg: true, // Traz os dados do ODS junto com a relação
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        locations: true,
        activities: {
          include: {
            indicators: true,
            activityLocations: {
              include: {
                location: true,
              },
            },
          },
        },
        projectProponents: true,
        projectSdgs: {
          include: {
            sdg: true, // Mapeia exatamente o que o Watcher precisa para o JOIN do template HTML
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        lifetimeStart: data.lifetimeStart
          ? new Date(data.lifetimeStart)
          : undefined,
        lifetimeEnd: data.lifetimeEnd ? new Date(data.lifetimeEnd) : undefined,
        justification: data.justification,
      },
    });
  }

  async transition(id: string, to: ProjectStatus, role: UserRole) {
  const project = await this.prisma.project.findUnique({ where: { id } });
  if (!project) throw new NotFoundException('Project not found');

  if (NEXT_STATUS[project.status] !== to) {
    throw new BadRequestException('Transição fora da ordem do ciclo');
  }

  const adminOnly =
    to === ProjectStatus.validated || to === ProjectStatus.verified;
  if (adminOnly && role !== UserRole.ADMIN) {
    throw new ForbiddenException('Apenas admin valida e verifica um projeto');
  }


  return this.prisma.project.update({
    where: { id },
    data: { status: to },
  });
}

  async remove(id: string) {
    await this.prisma.project.delete({ where: { id } });
    return true;
  }

  // Relacionamento N:N com Proponentes (ProjectProponent)
  async addProponents(projectId: string, proponents: AddProponentDto[]) {
    // O GORM fazia um Bulk Insert. No Prisma, usamos o createMany.
    await this.prisma.projectProponent.createMany({
      data: proponents.map((p) => ({
        projectId,
        proponentId: p.proponentId,
        role: p.role,
      })),
    });
    return true;
  }

  async removeProponent(projectId: string, proponentId: string) {
    await this.prisma.projectProponent.deleteMany({
      where: { projectId, proponentId },
    });
    return true;
  }
}
 