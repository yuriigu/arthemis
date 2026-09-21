import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { DEFAULT_USER_ROLE } from './models/i-user.js';
import type { PublicUser, UserRecord } from './models/i-user.js';
import { hashPassword } from './utils/password.util.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Cria o usuário a partir de e-mail e senha limpa.
   *
   * - o hash bcrypt (salt 10) é gerado aqui; a senha em texto limpo existe
   *   apenas em memória durante esta chamada — não é logada nem persistida;
   * - o papel vem do servidor (`DEFAULT_USER_ROLE`), nunca do cliente;
   * - e-mail duplicado responde 409 (o legado devolvia 409 no `/register`).
   */
  async createUser(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();

    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('email already registered');
    }

    const passwordHash = await hashPassword(dto.password);

    let user: UserRecord;
    try {
      user = await this.usersRepository.create({
        email,
        passwordHash,
        role: DEFAULT_USER_ROLE,
      });
    } catch (error) {
      // Corrida entre a checagem acima e o INSERT: o índice único do banco é a
      // fonte da verdade, então a violação vira 409 em vez de 500.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('email already registered');
      }

      throw error;
    }

    // Log apenas com o id: e-mail é dado pessoal e senha nunca é logada.
    this.logger.log(`User created: ${user.id}`);

    return toPublicUser(user);
  }

  /**
   * Busca por e-mail **incluindo** o hash — uso interno do futuro login
   * (`bcrypt.compare`). Não exponha este retorno em HTTP.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.usersRepository.findByEmail(email);
  }

  /** Busca por id já sem o hash: seguro para respostas da API. */
  async findById(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }
}

/** Explícito de propósito: só estes campos saem pela API. */
function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** P2002 = violação de constraint única (Prisma). */
function isUniqueConstraintViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2002';
}
