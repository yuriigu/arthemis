import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PublicIndicator } from './models/i-indicator.js';

const PUBLIC_INDICATOR_SELECT = {
  id: true,
  activityId: true,
  locationId: true,
  name: true,
  unit: true,
  valueBaseline: true,
  valueReference: true,
  observationMethod: true,
  justification: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class IndicatorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveActivity(activityId: string): Promise<boolean> {
    return (
      (await this.prisma.activity.count({
        where: { id: activityId, deletedAt: null },
      })) > 0
    );
  }

  async hasActiveLocation(locationId: string): Promise<boolean> {
    return (
      (await this.prisma.location.count({
        where: { id: locationId, deletedAt: null },
      })) > 0
    );
  }

  async activityAndLocationBelongToSameProject(
    activityId: string,
    locationId: string,
  ): Promise<boolean> {
    const [activity, location] = await Promise.all([
      this.prisma.activity.findFirst({
        where: { id: activityId, deletedAt: null },
        select: { projectId: true },
      }),
      this.prisma.location.findFirst({
        where: { id: locationId, deletedAt: null },
        select: { projectId: true },
      }),
    ]);
    return Boolean(activity && location && activity.projectId === location.projectId);
  }

  async create(data: {
    activityId: string;
    locationId: string;
    name: string;
    unit?: string;
    valueBaseline: number;
    valueReference: number;
    observationMethod?: string;
    justification?: string;
  }): Promise<PublicIndicator> {
    return this.prisma.indicator.create({
      data: {
        activityId: data.activityId,
        locationId: data.locationId,
        name: data.name,
        unit: data.unit ?? null,
        valueBaseline: data.valueBaseline,
        valueReference: data.valueReference,
        observationMethod: data.observationMethod ?? null,
        justification: data.justification ?? null,
      },
      select: PUBLIC_INDICATOR_SELECT,
    });
  }

  async update(
    id: string,
    data: {
      activityId?: string;
      locationId?: string;
      name?: string;
      unit?: string;
      valueBaseline?: number;
      valueReference?: number;
      observationMethod?: string;
      justification?: string;
    },
  ): Promise<PublicIndicator | null> {
    const result = await this.prisma.indicator.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.activityId !== undefined
          ? { activityId: data.activityId }
          : {}),
        ...(data.locationId !== undefined
          ? { locationId: data.locationId }
          : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.unit !== undefined ? { unit: data.unit || null } : {}),
        ...(data.valueBaseline !== undefined
          ? { valueBaseline: data.valueBaseline }
          : {}),
        ...(data.valueReference !== undefined
          ? { valueReference: data.valueReference }
          : {}),
        ...(data.observationMethod !== undefined
          ? { observationMethod: data.observationMethod || null }
          : {}),
        ...(data.justification !== undefined
          ? { justification: data.justification || null }
          : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  async findMany(params: {
    page: number;
    limit: number;
    search?: string;
    activityId?: string;
    locationId?: string;
  }): Promise<PublicIndicator[]> {
    return this.prisma.indicator.findMany({
      where: {
        deletedAt: null,
        ...(params.activityId ? { activityId: params.activityId } : {}),
        ...(params.locationId ? { locationId: params.locationId } : {}),
        ...(params.search
          ? { name: { contains: params.search, mode: 'insensitive' } }
          : {}),
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: PUBLIC_INDICATOR_SELECT,
    });
  }

  async findById(id: string): Promise<PublicIndicator | null> {
    return this.prisma.indicator.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_INDICATOR_SELECT,
    });
  }
}
