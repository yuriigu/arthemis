import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PublicUser, UserRecord } from './models/i-user.js';

/**
 * Colunas devolvidas nas leituras públicas.
 *
 * O `password_hash` fica fora do SELECT: a garantia de não vazar hash é
 * estrutural (equivalente ao `sanitizeUser` do brain legado, mas no banco).
 */
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persiste o usuário. Recebe o hash **já calculado** — a senha em texto limpo
   * nunca atravessa esta camada.
   */
  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<UserRecord> {
    return this.prisma.user.create({
      data: { ...data, email: normalizeEmail(data.email) },
    });
  }

  /**
   * Leitura interna (login/auth): inclui o `passwordHash` para o
   * `bcrypt.compare`. O retorno nunca deve ser exposto em HTTP.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
  }

  /** Leitura pública: devolve o usuário sem o hash (fora do SELECT). */
  async findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
  }
}

/**
 * Normaliza o e-mail (trim + lowercase) para evitar contas duplicadas apenas
 * por caixa/espaços — reforço da unicidade garantida pelo índice do banco.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
