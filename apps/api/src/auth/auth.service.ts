import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

/**
 * Interface que define o formato de retorno bem-sucedido da autenticação.
 */
export interface AuthResponse {
  /** Token de acesso JWT gerado para o usuário */
  access_token: string;
  /** Dados públicos do usuário autenticado */
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    proponentId: number;
  };
}

/**
 * Serviço responsável pela lógica de negócio de autenticação,
 * validação de credenciais e geração de tokens de acesso.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Realiza a autenticação do usuário com base no e-mail e senha informados.
   *
   * Fluxo da função:
   * 1. Busca o usuário no banco de dados através do e-mail.
   * 2. Se o usuário não existir, lança UnauthorizedException (401).
   * 3. Compara a senha fornecida com o hash bcrypt salvo no banco.
   * 4. Se a senha estiver incorreta, lança UnauthorizedException (401).
   * 5. Gera e retorna o token JWT assinado com as informações do usuário.
   *
   * @param loginDto Objeto contendo e-mail e senha validados.
   * @returns Objeto com token JWT e dados do usuário.
   * @throws UnauthorizedException se o e-mail não existir ou a senha estiver incorreta.
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // 1. Busca o usuário no PostgreSQL através do Prisma
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. Se o usuário não for encontrado no banco de dados, retorna 401
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
    }

    // 3. Compara a senha em texto puro com o hash salvo no banco (usando bcryptjs)
    const isPasswordMatching = await bcrypt.compare(password, user.password);

    // 4. Se a senha não bater com o hash, retorna 401
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
    }

    // 5. Monta o payload do JWT com a identificação e permissões do usuário
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      proponentId: user.proponentId,
    };

    // 6. Gera o token assinado usando o JwtService configurado no AuthModule
    const accessToken = await this.jwtService.signAsync(payload);

    // 7. Retorna a resposta contendo o token de acesso e os dados seguros do usuário (sem a senha)
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        proponentId: user.proponentId,
      },
    };
  }

  /**
   * Método auxiliar para emissão avulsa de tokens JWT.
   * Útil para testes ou para reutilização em outros módulos.
   *
   * @param payload Informações a serem embutidas no token.
   * @returns Token JWT assinado em formato string.
   */
  async generateToken(payload: {
    sub: string;
    email: string;
    role: string;
    username: string;
    proponentId: number;
  }): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
