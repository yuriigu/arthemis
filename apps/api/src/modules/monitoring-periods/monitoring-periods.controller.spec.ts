import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { MonitoringPeriodsController } from './monitoring-periods.controller';
import { MonitoringPeriodsService } from './monitoring-periods.service';

describe('MonitoringPeriodsController.verify (roles)', () => {
  const service = {
    findByProject: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    verify: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const controller = new MonitoringPeriodsController(
    service as unknown as MonitoringPeriodsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('anota a rota de verificar período apenas com o papel ADMIN', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      MonitoringPeriodsController.prototype.verify,
    );
    expect(roles).toEqual([UserRole.ADMIN]);
  });

  it('permite que usuário com papel ADMIN acesse a rota de verificação via RolesGuard', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => MonitoringPeriodsController.prototype.verify,
      getClass: () => MonitoringPeriodsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.ADMIN } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejeita acesso de MANAGER na rota de verificação', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => MonitoringPeriodsController.prototype.verify,
      getClass: () => MonitoringPeriodsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.MANAGER } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('rejeita acesso de VISITOR na rota de verificação', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => MonitoringPeriodsController.prototype.verify,
      getClass: () => MonitoringPeriodsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.VISITOR } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('rejeita acesso de usuário não autenticado na rota de verificação', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => MonitoringPeriodsController.prototype.verify,
      getClass: () => MonitoringPeriodsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('delega para o service ao chamar verify', async () => {
    service.verify.mockResolvedValue({ id: 'p1', verified: true });

    const result = await controller.verify('p1');

    expect(service.verify).toHaveBeenCalledWith('p1');
    expect(result).toEqual({ id: 'p1', verified: true });
  });
});
