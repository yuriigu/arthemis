import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/**
 * Guard responsável por proteger rotas que exigem autenticação JWT.
 * Ele intercepta a requisição, extrai o Bearer token do cabeçalho Authorization,
 * valida a assinatura e a expiração do token, e injeta o payload decodificado em request['user'].
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Determina se a requisição atual tem permissão para prosseguir.
   *
   * @param context Contexto de execução do NestJS.
   * @returns Retorna true se o token for válido; caso contrário lança UnauthorizedException.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // Se nenhum token foi enviado no cabeçalho Authorization
    if (!token) {
      throw new UnauthorizedException(
        'Acesso não autorizado: token JWT ausente.',
      );
    }

    try {
      // Valida o token usando a chave secreta configurada
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          process.env.JWT_SECRET ||
          'arthemis-secret-key-development-change-in-production',
      });

      // Anexa o payload com as informações do usuário à requisição
      (request as any).user = payload;
    } catch {
      // Se a verificação falhar (token expirado, adulterado ou inválido)
      throw new UnauthorizedException(
        'Acesso não autorizado: token JWT inválido ou expirado.',
      );
    }

    return true;
  }

  /**
   * Extrai o token JWT do cabeçalho 'Authorization: Bearer <token>'.
   *
   * @param request Objeto da requisição HTTP do Express.
   * @returns O token JWT limpo em formato string ou undefined caso não exista.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
