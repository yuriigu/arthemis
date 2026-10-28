import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';

/**
 * Guard global: as rotas precisam declarar `@Public()` para não exigir JWT.
 *
 * Depende da estratégia registrada como `jwt` (`JwtStrategy`): sem token, com
 * token assinado com outra chave, com algoritmo diferente de HS256 ou
 * expirado, o passport responde 401 — mesmo comportamento do `/validate`
 * legado (`legacy/edge/services/auth/handlers/validate.go`).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }
}
