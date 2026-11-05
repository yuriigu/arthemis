import { UserRole as PrismaUserRole } from '@arthemis/database';

export const UserRole = {
  ADMIN: PrismaUserRole.admin,
  MANAGER: PrismaUserRole.manager,
  VISITOR: PrismaUserRole.visitor,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
