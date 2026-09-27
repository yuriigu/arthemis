import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthResponse, AuthenticatedRequest } from './models/i-auth.js';
import type { PublicUser } from '../users/models/i-user.js';

/**
 * Rotas de autenticação.
 *
 * `POST /auth/login` equivale ao `POST /login` do
 * `legacy/edge/services/auth`; `GET /auth/me` substitui o `POST /validate`
 * legado — que só devolvia os headers `X-User-Id`/`X-User-Role` — passando a
 * devolver o perfil do usuário autenticado.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login — autentica e devolve `{ access_token }`.
   *
   * - 200 em sucesso (`@HttpCode`: POSTs do Nest respondem 201 por default e o
   *   contrato legado do login é 200);
   * - 400 para payload inválido (ValidationPipe global);
   * - 401 para credenciais inválidas (mensagem uniforme, sem enumeração).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * GET /auth/me — perfil do usuário autenticado (sem `passwordHash`).
   *
   * Protegido pelo `JwtAuthGuard`: sem token, com token inválido/algo
   * errado/expirado → 401.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<PublicUser> {
    return this.authService.getProfile(request.user.sub);
  }
}
