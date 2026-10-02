/**
 * Seed do Arthemis — **idempotente**.
 *
 * Uso:
 *   npm run prisma:seed        # ou: npx prisma db seed
 *
 * O script popula:
 *   1. os 17 Objetivos de Desenvolvimento Sustentável (ODS) da ONU, com
 *      `upsert` pela chave natural `number` — rodar várias vezes não duplica;
 *   2. o usuário de desenvolvimento (comportamento herdado da task anterior).
 *
 * Variáveis opcionais (veja o .env.example):
 *   SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_ROLE
 *
 * A senha em texto limpo nunca é impressa nem persistida: o script só grava o
 * hash bcrypt (salt 10) e mostra o e-mail/id do usuário.
 */
import 'dotenv/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { USER_ROLES } from '../src/users/models/i-user.js';
import { hashPassword } from '../src/users/utils/password.util.js';

const DEFAULT_SEED_EMAIL = 'admin@arthemis.local';
const DEFAULT_SEED_PASSWORD = 'arthemis-dev-123';
const DEFAULT_SEED_ROLE = 'admin';

/**
 * Base das URLs dos ícones dos ODS.
 *
 * O legado (`legacy/watcher/internal/models/brain.go`) só definia a coluna
 * `icon_url` — não havia seed nem lista de URLs. As URLs diretas do un.org não
 * são estáveis/hotlinkáveis (retornam 404), então usamos a arte oficial da ONU
 * publicada pelo projeto open-sdg: padrão previsível por número do objetivo e
 * verificado (HTTP 200, `image/png`).
 */
const SDG_ICON_BASE_URL =
  'https://open-sdg.github.io/sdg-translations/assets/img/goals/en';

/** Títulos oficiais (em inglês) dos 17 ODS, na ordem 1..17. */
const SDG_NAMES: readonly string[] = [
  'No Poverty',
  'Zero Hunger',
  'Good Health and Well-being',
  'Quality Education',
  'Gender Equality',
  'Clean Water and Sanitation',
  'Affordable and Clean Energy',
  'Decent Work and Economic Growth',
  'Industry, Innovation and Infrastructure',
  'Reduced Inequalities',
  'Sustainable Cities and Communities',
  'Responsible Consumption and Production',
  'Climate Action',
  'Life Below Water',
  'Life on Land',
  'Peace, Justice and Strong Institutions',
  'Partnerships for the Goals',
];

/** Formato de cada ODS do seed. */
export interface SdgSeed {
  number: number;
  name: string;
  iconUrl: string;
}

/** Os 17 ODS da ONU com `number`, `name` e `iconUrl` derivados do número. */
export const SDGS: readonly SdgSeed[] = SDG_NAMES.map((name, index) => {
  const number = index + 1;

  return {
    number,
    name,
    iconUrl: `${SDG_ICON_BASE_URL}/${number}.png`,
  };
});

/**
 * Semeia (ou atualiza) os 17 ODS de forma idempotente, usando `number` como
 * chave natural do `upsert`. Se um ODS tiver sido "soft deleted", a execução
 * revive o registro (`deletedAt: null`).
 *
 * Exportado para os testes de integração reutilizarem exatamente o mesmo
 * caminho de escrita, sem depender do CLI do Prisma.
 *
 * @returns a contagem total de ODS na tabela após o upsert.
 */
export async function seedSdgs(prisma: PrismaClient): Promise<number> {
  for (const sdg of SDGS) {
    await prisma.sdg.upsert({
      where: { number: sdg.number },
      update: { name: sdg.name, iconUrl: sdg.iconUrl, deletedAt: null },
      create: { number: sdg.number, name: sdg.name, iconUrl: sdg.iconUrl },
    });
  }

  return prisma.sdg.count();
}

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
    // 1) ODS (idempotente por `number`).
    const sdgCount = await seedSdgs(prisma);
    console.log(`[seed] sdgs ready: ${sdgCount} ODS (idempotente)`);

    // 2) Usuário de desenvolvimento.
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

/**
 * Só executa o seed quando o arquivo é rodado diretamente (`tsx prisma/seed.ts`
 * ou `prisma db seed`). Importado pelos testes de integração, o módulo fica
 * livre de efeitos colaterais (nenhuma conexão é aberta).
 */
const entryPoint = process.argv[1];
const isDirectRun =
  entryPoint !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(entryPoint)).href;

if (isDirectRun) {
  await main();
}
