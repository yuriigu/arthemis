import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

describe('UsersService.create', () => {
  const user = {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    upsert: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = {
    user,
  } as unknown as PrismaService;
  const service = new UsersService(prisma);
  const userData = {
    proponentId: '5d59a491-5595-423c-afbb-7964f7e75a0a',
    username: 'registered-user',
    email: 'registered@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links an existing username atomically when a password is supplied', async () => {
    user.upsert.mockResolvedValue({ id: 'existing-id' });

    await service.create({ ...userData, password: 'strong-password' });

    expect(user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { username: userData.username },
        create: expect.objectContaining({
          username: userData.username,
          role: UserRole.VISITOR,
          password: expect.any(String),
        }),
        update: {
          proponentId: userData.proponentId,
          email: userData.email,
          role: undefined,
        },
      }),
    );
  });

  it('updates an existing user without requiring or replacing their password', async () => {
    user.findUnique.mockResolvedValue({ id: 'existing-id' });
    user.update.mockResolvedValue({ id: 'existing-id' });

    await service.create(userData);

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-id' },
        data: expect.not.objectContaining({ password: expect.anything() }),
      }),
    );
  });

  it('rejects a new user without a password', async () => {
    user.findUnique.mockResolvedValue(null);

    await expect(service.create(userData)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(user.update).not.toHaveBeenCalled();
  });
});
