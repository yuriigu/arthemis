import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PublicActivity } from './models/i-activity.js';

const ACTIVITY_SELECT = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  justification: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  activityLocations: {
    where: {
      deletedAt: null,
      location: { deletedAt: null },
    },
    select: { locationId: true },
  },
} as const;

type ActivityWithLocations = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  justification: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activityLocations: { locationId: string }[];
};

function toPublicActivity(activity: ActivityWithLocations): PublicActivity {
  const { activityLocations, ...fields } = activity;
  return {
    ...fields,
    startDate: activity.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: activity.endDate?.toISOString().slice(0, 10) ?? null,
    locationIds: activityLocations.map(({ locationId }) => locationId),
  };
}

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveProject(projectId: string): Promise<boolean> {
    return (
      (await this.prisma.project.count({
        where: { id: projectId, deletedAt: null },
      })) > 0
    );
  }

  async findActiveLocationIds(
    projectId: string,
    locationIds: string[],
  ): Promise<string[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        projectId,
        id: { in: locationIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    return locations.map(({ id }) => id);
  }

  async create(data: {
    projectId: string;
    name: string;
    description?: string;
    justification?: string;
    startDate: string;
    endDate: string;
    locationIds?: string[];
  }): Promise<PublicActivity> {
    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          description: data.description ?? null,
          justification: data.justification ?? null,
          startDate: new Date(`${data.startDate}T00:00:00.000Z`),
          endDate: new Date(`${data.endDate}T00:00:00.000Z`),
          ...(data.locationIds?.length
            ? {
                activityLocations: {
                  create: data.locationIds.map((locationId) => ({
                    locationId,
                  })),
                },
              }
            : {}),
        },
        select: ACTIVITY_SELECT,
      });
      return created;
    });
    return toPublicActivity(activity);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      justification?: string;
      startDate?: string;
      endDate?: string;
      locationIds?: string[];
    },
  ): Promise<PublicActivity | null> {
    await this.prisma.$transaction(async (tx) => {
      const updateData = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.justification !== undefined
          ? { justification: data.justification || null }
          : {}),
        ...(data.startDate !== undefined
          ? { startDate: new Date(`${data.startDate}T00:00:00.000Z`) }
          : {}),
        ...(data.endDate !== undefined
          ? { endDate: new Date(`${data.endDate}T00:00:00.000Z`) }
          : {}),
      };
      await tx.activity.update({ where: { id }, data: updateData });

      if (data.locationIds !== undefined) {
        const now = new Date();
        await tx.activityLocation.updateMany({
          where: {
            activityId: id,
            deletedAt: null,
            ...(data.locationIds.length > 0
              ? { locationId: { notIn: data.locationIds } }
              : {}),
          },
          data: { deletedAt: now },
        });

        for (const locationId of data.locationIds) {
          const existing = await tx.activityLocation.findFirst({
            where: { activityId: id, locationId },
          });
          if (existing) {
            if (existing.deletedAt !== null) {
              await tx.activityLocation.update({
                where: { id: existing.id },
                data: { deletedAt: null },
              });
            }
          } else {
            await tx.activityLocation.create({
              data: { activityId: id, locationId },
            });
          }
        }
      }
    });
    return this.findById(id);
  }

  async findMany(params: {
    page: number;
    limit: number;
    search?: string;
    projectId?: string;
  }): Promise<PublicActivity[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        deletedAt: null,
        ...(params.projectId ? { projectId: params.projectId } : {}),
        ...(params.search
          ? { name: { contains: params.search, mode: 'insensitive' } }
          : {}),
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: ACTIVITY_SELECT,
    });
    return activities.map(toPublicActivity);
  }

  async findById(id: string): Promise<PublicActivity | null> {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      select: ACTIVITY_SELECT,
    });
    return activity ? toPublicActivity(activity) : null;
  }
}
