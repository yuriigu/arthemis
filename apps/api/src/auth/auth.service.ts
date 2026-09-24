import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PublicUser, UserRecord } from '../users/models/i-user.js';
import { UsersService } from '../users/users.service.js';
import { verifyPassword } from '../users/utils/password.util.js';
import type { LoginDto } from './dto/login.dto.js';
import type { AuthResponse, JwtPayload } from './models/i-auth.js';

/**
 * Mensagem única para "e-mail não cadastrado" e "senha incorreta".
 *
 * O `authenticateUser` do legado (`legacy/edge/services/auth/handlers/login.go`)
 * respondia 401 "Invalid credentials" nos dois casos justamente para não
 * revelar qual campo falhou (anti-enumeração de usuários).
 */
export const INVALID_CREDENTIALS_MESSAGE = 'Credenciais inválidas';

/**
 * Regra de negócio de autenticação.
 *
 * Portabilidade do `Login`/`authenticateUser` legados:
 * - busca por identidade única (o legado usava `username = ?`; aqui o e-mail
 *   é a credencial, normalizado pelo repositório);
 * - comparação com `bcrypt.compare` (hash custo 10, mesmo custo do legado);
 * - falha uniforme com 401, sem dizer se o usuário existe;
 * - emite o JWT HS256 com as claims `sub`/`role` (e `email`).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida as credenciais e devolve o registro completo (com hash) em caso de
   * sucesso — uso interno; nunca exposto em HTTP.
   *
   * @throws UnauthorizedException 401 com a mesma mensagem quando o e-mail não
   * existe ou quando a senha não confere (como no legado).
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserRecord> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return user;
  }

  /**
   * Autentica e emite o `access_token` JWT.
   *
   * Claims do payload: `sub` (id do usuário), `email` e `role` — o `iat`/`exp`
   * são aplicados pelas `signOptions` do `JwtModule` (`JWT_EXPIRES_IN`,
   * default 24h igual ao legado).
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateCredentials(dto.email, dto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Log apenas do id: e-mail é dado pessoal e senha jamais é logada.
    this.logger.log(`Login successful: ${user.id}`);

    return { access_token: accessToken };
  }

  /**
   * Perfil do usuário autenticado (`GET /auth/me`).
   *
   * O `sub` do token identifica o usuário e o banco é a fonte da verdade
   * (papel/e-mail atuais), garantindo que a resposta nunca tenha o hash de
   * senha — `findById` já seleciona apenas os campos públicos.
   */
  async getProfile(userId: string): Promise<PublicUser> {
    return this.usersService.findById(userId);
  }
}
