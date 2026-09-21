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
import type { Request } from 'express';
import { AuthService, AuthResponse } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

/**
 * Controller responsável pelos endpoints de autenticação (/auth).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de autenticação de usuários (POST /auth/login).
   *
   * @param loginDto Objeto validado contendo e-mail e senha do usuário.
   * @returns Retorna status 200 (OK) com o token JWT e dados públicos do usuário autenticado.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * Endpoint protegido para obter os dados do usuário autenticado (GET /auth/me).
   * Requer cabeçalho 'Authorization: Bearer <token_jwt>'.
   *
   * @param req Objeto de requisição do Express contendo o usuário decodificado pelo guard.
   * @returns Retorna os dados contidos no token do usuário logado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return (req as any).user;
  }
}
