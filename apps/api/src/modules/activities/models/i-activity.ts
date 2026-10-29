import type { Prisma } from '../../../generated/prisma/client.js';

export interface PublicActivity {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  justification: string | null;
  startDate: string | null;
  endDate: string | null;
  locationIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityPosition = Prisma.InputJsonObject;
