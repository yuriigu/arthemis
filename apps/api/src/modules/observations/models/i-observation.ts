import type { Prisma } from '../../../generated/prisma/client.js';

export interface PublicObservation {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  position: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ObservationPosition = Prisma.InputJsonObject;
