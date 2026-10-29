import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PublicObservation } from './models/i-observation.js';

const PUBLIC_OBSERVATION_SELECT = {
  id: true,
  indicatorId: true,
  value: true,
  date: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ObservationRecord = {
  id: string;
  indicatorId: string;
  value: number;
  date: Date;
  position: PublicObservation['position'];
  createdAt: Date;
  updatedAt: Date;
};

function toPublicObservation(
  observation: ObservationRecord,
): PublicObservation {
  return {
    ...observation,
    date: observation.date.toISOString().slice(0, 10),
  };
}

@Injectable()
export class ObservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveIndicator(indicatorId: string): Promise<boolean> {
    return (
      (await this.prisma.indicator.count({
        where: { id: indicatorId, deletedAt: null },
      })) > 0
    );
  }

  async create(data: {
    indicatorId: string;
    value: number;
    date: Date;
    position?: Prisma.InputJsonObject;
  }): Promise<PublicObservation> {
    const observation = await this.prisma.observation.create({
      data: {
        indicatorId: data.indicatorId,
        value: data.value,
        date: data.date,
        ...(data.position ? { position: data.position } : {}),
      },
      select: PUBLIC_OBSERVATION_SELECT,
    });
    return toPublicObservation(observation);
  }

  async update(
    id: string,
    data: {
      indicatorId?: string;
      value?: number;
      date?: string;
      position?: Prisma.InputJsonObject;
    },
  ): Promise<PublicObservation | null> {
    const result = await this.prisma.observation.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.indicatorId !== undefined
          ? { indicatorId: data.indicatorId }
          : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.date !== undefined
          ? { date: new Date(`${data.date}T00:00:00.000Z`) }
          : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  async findMany(params: {
    page: number;
    limit: number;
    indicatorId?: string;
  }): Promise<PublicObservation[]> {
    const observations = await this.prisma.observation.findMany({
      where: {
        deletedAt: null,
        ...(params.indicatorId ? { indicatorId: params.indicatorId } : {}),
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { date: 'desc' },
      select: PUBLIC_OBSERVATION_SELECT,
    });
    return observations.map(toPublicObservation);
  }

  async findById(id: string): Promise<PublicObservation | null> {
    const observation = await this.prisma.observation.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_OBSERVATION_SELECT,
    });
    return observation ? toPublicObservation(observation) : null;
  }
}
