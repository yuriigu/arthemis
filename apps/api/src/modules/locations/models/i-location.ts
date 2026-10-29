import type { Prisma } from '../../../generated/prisma/client.js';

export interface PublicLocation {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  ecosystem: string;
  extent: number;
  country: string;
  position: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export type LocationPosition = Prisma.InputJsonObject;
