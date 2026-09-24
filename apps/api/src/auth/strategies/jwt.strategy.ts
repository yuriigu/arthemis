import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser, JwtPayload } from '../models/i-auth.js';

/**
 * Estratégia Bearer/JWT usada pelo `JwtAuthGuard`.
 *
 * Espelha a validação do `/validate` legado:
 * - assinatura HS256 com o mesmo segredo (`JWT_TOKEN` no legado →
 *   `JWT_SECRET` aqui);
 * - expiração sempre verificada (`ignoreExpiration: false`);
 * - `algorithms: ['HS256']` reproduz o cheque de signing method do Go
 *   (bloqueia downgrade para `none`/outros algoritmos);
 * - payload sem `sub` (ou sem `role`) rejeitado com 401, como no legado.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Chamado pelo passport apenas após assinatura e expiração validadas.
   * Devolve o usuário autenticado em `request.user` — nunca inclui credenciais.
   */
  validate(payload: JwtPayload | null): AuthenticatedUser {
    if (!payload?.sub || !payload.role) {
      throw new UnauthorizedException('Invalid token');
    }

    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
