import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PublicLocation } from './models/i-location.js';

const PUBLIC_LOCATION_SELECT = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  ecosystem: true,
  extent: true,
  country: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveProject(projectId: string): Promise<boolean> {
    return (
      (await this.prisma.project.count({
        where: { id: projectId, deletedAt: null },
      })) > 0
    );
  }

  async create(data: {
    projectId: string;
    name: string;
    description?: string;
    ecosystem: string;
    extent: number;
    country: string;
    position?: Prisma.InputJsonObject;
  }): Promise<PublicLocation> {
    return this.prisma.location.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description ?? null,
        ecosystem: data.ecosystem,
        extent: data.extent,
        country: data.country,
        ...(data.position ? { position: data.position } : {}),
      },
      select: PUBLIC_LOCATION_SELECT,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      ecosystem?: string;
      extent?: number;
      country?: string;
      position?: Prisma.InputJsonObject;
    },
  ): Promise<PublicLocation | null> {
    const result = await this.prisma.location.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.ecosystem !== undefined ? { ecosystem: data.ecosystem } : {}),
        ...(data.extent !== undefined ? { extent: data.extent } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  async findMany(params: {
    page: number;
    limit: number;
    search?: string;
    projectId?: string;
  }): Promise<PublicLocation[]> {
    return this.prisma.location.findMany({
      where: {
        deletedAt: null,
        ...(params.projectId ? { projectId: params.projectId } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { ecosystem: { contains: params.search, mode: 'insensitive' } },
                { country: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: PUBLIC_LOCATION_SELECT,
    });
  }

  async findById(id: string): Promise<PublicLocation | null> {
    return this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_LOCATION_SELECT,
    });
  }
}
