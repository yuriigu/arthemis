import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard das rotas autenticadas (`GET /auth/me`).
 *
 * Depende da estratégia registrada como `jwt` (`JwtStrategy`): sem token, com
 * token assinado com outra chave, com algoritmo diferente de HS256 ou
 * expirado, o passport responde 401 — mesmo comportamento do `/validate`
 * legado (`legacy/edge/services/auth/handlers/validate.go`).
 *
 * Aplicado por rota (e não globalmente) para o `POST /auth/login` continuar
 * público: no legado, `/login` e `/validate` já eram rotas separadas.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
