/**
 * Seed de desenvolvimento: cria (ou atualiza) um usuário inicial para validar o
 * módulo de usuários de ponta a ponta.
 *
 * Uso:
 *   npm run prisma:seed        # ou: npx prisma db seed
 *
 * Variáveis opcionais (veja o .env.example):
 *   SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_ROLE
 *
 * A senha em texto limpo nunca é impressa nem persistida: o script só grava o
 * hash bcrypt (salt 10) e mostra o e-mail/id do usuário.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { USER_ROLES } from '../src/users/models/i-user.js';
import { hashPassword } from '../src/users/utils/password.util.js';

const DEFAULT_SEED_EMAIL = 'admin@arthemis.local';
const DEFAULT_SEED_PASSWORD = 'arthemis-dev-123';
const DEFAULT_SEED_ROLE = 'admin';

async function main(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const databaseUrl = process.env.DATABASE_URL;
  const email = (process.env.SEED_USER_EMAIL ?? DEFAULT_SEED_EMAIL)
    .trim()
    .toLowerCase();
  const role = process.env.SEED_USER_ROLE ?? DEFAULT_SEED_ROLE;
  const customPassword = process.env.SEED_USER_PASSWORD;
  const password = customPassword ?? DEFAULT_SEED_PASSWORD;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required (copy .env.example to .env).');
  }

  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    throw new Error(`SEED_USER_ROLE must be one of: ${USER_ROLES.join(', ')}`);
  }

  // Nunca semear senha default (conhecida) em produção.
  if (nodeEnv === 'production' && !customPassword) {
    throw new Error(
      'Refusing to seed the default password with NODE_ENV=production. Set SEED_USER_PASSWORD.',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const passwordHash = await hashPassword(password);

    // Upsert idempotente: garante que as credenciais de desenvolvimento
    // documentadas continuem válidas mesmo rodando o seed mais de uma vez.
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role },
      create: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    console.log('[seed] user ready:', {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      password: '<hash bcrypt gravado — texto limpo não é exibido>',
    });
  } finally {
    await prisma.$disconnect();
  }
}

await main();
