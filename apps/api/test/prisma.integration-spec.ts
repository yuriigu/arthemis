import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SDGS, seedSdgs } from '../prisma/seed.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Integração do schema Prisma com o PostgreSQL real do `docker compose`.
 *
 * Rode `docker compose up -d postgres` e depois `npm run test:integration`.
 *
 * Cobre os critérios de aceitação da issue #26:
 *   1. migrations aplicam em banco limpo sem erro de FK/constraint;
 *   2. associação opcional `User -> Proponent` e leitura do `username`;
 *   3. uniques compostas (`project_sdg`, `project_proponents`), unique de
 *      `sdgs.number` e a FK `users.proponent_id -> proponents.id`;
 *   4. idempotência do seed (17 ODS, sem duplicar ao rodar duas vezes).
 */

/** Raiz de `apps/api` — usada para invocar o CLI do Prisma no processo filho. */
const API_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const PRISMA_BIN = path.join(API_ROOT, 'node_modules', '.bin', 'prisma');

/** Devolve a `DATABASE_URL` apontando para outro `schema` (mantém o resto). */
function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

/**
 * Roda `prisma migrate deploy` num processo filho contra a URL informada.
 *
 * O `dotenv/config` do `prisma.config.ts` não sobrescreve variáveis já presentes
 * no ambiente, então a `DATABASE_URL` passada aqui é a usada pelo CLI.
 */
function migrateDeploy(databaseUrl: string): void {
  try {
    execFileSync(PRISMA_BIN, ['migrate', 'deploy'], {
      cwd: API_ROOT,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    throw new Error(
      `prisma migrate deploy falhou:\n${failure.stdout ?? ''}\n${failure.stderr ?? ''}`,
    );
  }
}

/** Sufixo aleatório para não colidir com dados de outras execuções. */
const uniqueSuffix = (): string => randomUUID().replace(/-/g, '');

describe('Prisma schema (integração com Postgres real)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('migrations em banco limpo', () => {
    it('aplica todas as migrations num schema vazio, sem erro de FK/constraint', async () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error(
          'DATABASE_URL is required (copy .env.example to .env).',
        );
      }

      const schema = `prisma_test_${uniqueSuffix()}`;
      await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

      try {
        // Se houver erro de FK/constraint (ou o schema estiver inconsistente),
        // `migrate deploy` sai com código != 0 e o teste falha com o log do CLI.
        migrateDeploy(withSchema(databaseUrl, schema));

        const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
          schema,
        );

        // Todas as tabelas da migração existem no schema recém-criado...
        expect(tables.map((table) => table.table_name).sort()).toEqual([
          '_prisma_migrations',
          'project_proponents',
          'project_sdg',
          'projects',
          'proponents',
          'sdgs',
          'users',
        ]);

        // ...e nenhuma migration terminou sem sucesso (finish/rollback nulos).
        const [failed] = await prisma.$queryRawUnsafe<{ failed: number }[]>(
          `SELECT COUNT(*)::int AS failed FROM "${schema}"."_prisma_migrations" WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL`,
        );
        expect(failed.failed).toBe(0);
      } finally {
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
        );
      }
    }, 120_000);
  });

  describe('modelagem e constraints', () => {
    /**
     * Cria proponente + projeto + ODS de teste (número 999, fora do intervalo
     * 1..17 do seed) e devolve os registros. O cleanup é de quem chama.
     */
    async function createFixture() {
      const suffix = uniqueSuffix();

      const proponent = await prisma.proponent.create({
        data: {
          name: `Proponente ${suffix}`,
          email: `proponente.${suffix}@arthemis.test`,
        },
      });

      const project = await prisma.project.create({
        data: {
          proponentId: proponent.id,
          name: `Projeto ${suffix}`,
          justification: 'Projeto de teste da modelagem.',
        },
      });

      const sdg = await prisma.sdg.create({
        data: {
          number: 999,
          name: 'ODS de teste',
          iconUrl: 'https://example.test/sdgs/999.png',
        },
      });

      return { proponent, project, sdg };
    }

    async function destroyFixture(ids: {
      proponentId?: string;
      projectId?: string;
      sdgId?: string;
    }): Promise<void> {
      if (ids.projectId) {
        // Cascade remove project_proponents e project_sdg do projeto.
        await prisma.project.deleteMany({ where: { id: ids.projectId } });
      }
      if (ids.sdgId) {
        await prisma.sdg.deleteMany({ where: { id: ids.sdgId } });
      }
      if (ids.proponentId) {
        await prisma.proponent.deleteMany({ where: { id: ids.proponentId } });
      }
    }

    it('expõe relacionamentos bidirecionais e o soft delete (`deletedAt`)', async () => {
      const { proponent, project, sdg } = await createFixture();

      try {
        await prisma.projectProponent.create({
          data: {
            projectId: project.id,
            proponentId: proponent.id,
            role: 'Coordenador',
          },
        });
        await prisma.projectSdg.create({
          data: { projectId: project.id, sdgId: sdg.id },
        });

        // Projeto -> proponente / ODS / participantes.
        const loaded = await prisma.project.findUniqueOrThrow({
          where: { id: project.id },
          include: {
            proponent: true,
            projectProponents: { include: { proponent: true } },
            projectSdgs: { include: { sdg: true } },
          },
        });

        expect(loaded.proponent.id).toBe(proponent.id);
        expect(loaded.projectProponents).toHaveLength(1);
        expect(loaded.projectProponents[0].proponent.id).toBe(proponent.id);
        expect(loaded.projectSdgs).toHaveLength(1);
        expect(loaded.projectSdgs[0].sdg.number).toBe(999);

        // Soft delete presente (nulo por padrão) nas entidades de domínio.
        expect(loaded.deletedAt).toBeNull();
        expect(loaded.proponent.deletedAt).toBeNull();
        expect(loaded.projectSdgs[0].deletedAt).toBeNull();
        expect(sdg.deletedAt).toBeNull();

        // Lado reverso (bidirecional): proponente -> projetos / vínculos.
        const reverse = await prisma.proponent.findUniqueOrThrow({
          where: { id: proponent.id },
          include: { projects: true, projectProponents: true },
        });

        expect(reverse.projects.map((item) => item.id)).toContain(project.id);
        expect(
          reverse.projectProponents.map((item) => item.projectId),
        ).toContain(project.id);
      } finally {
        await destroyFixture({
          projectId: project.id,
          sdgId: sdg.id,
          proponentId: proponent.id,
        });
      }
    });

    it('aplica as uniques compostas e o unique de `sdgs.number`', async () => {
      const { proponent, project, sdg } = await createFixture();

      try {
        await prisma.projectProponent.create({
          data: { projectId: project.id, proponentId: proponent.id },
        });
        await prisma.projectSdg.create({
          data: { projectId: project.id, sdgId: sdg.id },
        });

        // project_sdg(project_id, sdg_id) — único.
        await expect(
          prisma.projectSdg.create({
            data: { projectId: project.id, sdgId: sdg.id },
          }),
        ).rejects.toMatchObject({ code: 'P2002' });

        // project_proponents(project_id, proponent_id) — único.
        await expect(
          prisma.projectProponent.create({
            data: { projectId: project.id, proponentId: proponent.id },
          }),
        ).rejects.toMatchObject({ code: 'P2002' });

        // sdgs.number — único.
        await expect(
          prisma.sdg.create({
            data: {
              number: sdg.number,
              name: 'ODS duplicado',
              iconUrl: 'https://example.test/sdgs/duplicado.png',
            },
          }),
        ).rejects.toMatchObject({ code: 'P2002' });
      } finally {
        await destroyFixture({
          projectId: project.id,
          sdgId: sdg.id,
          proponentId: proponent.id,
        });
      }
    });

    it('aplica a FK `users.proponent_id -> proponents.id`', async () => {
      // Um `proponentId` inexistente viola a FK no banco (P2003): prova que a
      // constraint existe e não é apenas uma relação declarada no Prisma.
      await expect(
        prisma.user.create({
          data: {
            email: `fk.${uniqueSuffix()}@arthemis.test`,
            passwordHash:
              '$2b$10$hashfakehashfakehashfakehashfakehashfakehashfake',
            role: 'visitor',
            proponentId: randomUUID(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('associação opcional User <-> Proponent', () => {
    it('associa o usuário a um proponente e lê o `username`', async () => {
      const suffix = uniqueSuffix();
      const proponent = await prisma.proponent.create({
        data: {
          name: `Proponente ${suffix}`,
          email: `prop.${suffix}@arthemis.test`,
        },
      });

      const username = `usuario.${suffix}`;
      const user = await prisma.user.create({
        data: {
          email: `usuario.${suffix}@arthemis.test`,
          passwordHash:
            '$2b$10$hashfakehashfakehashfakehashfakehashfakehashfake',
          role: 'manager',
          username,
          proponentId: proponent.id,
        },
        include: { proponent: true },
      });

      try {
        expect(user.username).toBe(username);
        expect(user.proponentId).toBe(proponent.id);
        expect(user.proponent?.id).toBe(proponent.id);
        expect(user.proponent?.name).toBe(proponent.name);

        // O lado do proponente também enxerga o usuário (bidirecional).
        const withUsers = await prisma.proponent.findUniqueOrThrow({
          where: { id: proponent.id },
          include: { users: true },
        });
        expect(withUsers.users.map((item) => item.id)).toContain(user.id);
      } finally {
        await prisma.user.deleteMany({ where: { id: user.id } });
        await prisma.proponent.deleteMany({ where: { id: proponent.id } });
      }
    });

    it('permite usuário sem proponente (relação opcional)', async () => {
      const suffix = uniqueSuffix();
      const user = await prisma.user.create({
        data: {
          email: `sem-proponente.${suffix}@arthemis.test`,
          passwordHash:
            '$2b$10$hashfakehashfakehashfakehashfakehashfakehashfake',
          role: 'visitor',
        },
        include: { proponent: true },
      });

      try {
        expect(user.proponentId).toBeNull();
        expect(user.proponent).toBeNull();
        expect(user.username).toBeNull();
      } finally {
        await prisma.user.deleteMany({ where: { id: user.id } });
      }
    });
  });

  describe('seed idempotente', () => {
    it('insere exatamente os 17 ODS e não duplica ao rodar duas vezes', async () => {
      // Remove eventual ODS de teste (número fora de 1..17) que tenha sobrado de
      // outra execução, para que a contagem reflita só os ODS oficiais.
      await prisma.sdg.deleteMany({
        where: { number: { notIn: SDGS.map((sdg) => sdg.number) } },
      });

      expect(SDGS).toHaveLength(17);
      expect(new Set(SDGS.map((sdg) => sdg.number)).size).toBe(17);

      await seedSdgs(prisma);
      const afterFirstRun = await prisma.sdg.count();

      await seedSdgs(prisma);
      const afterSecondRun = await prisma.sdg.count();

      expect(afterFirstRun).toBe(17);
      expect(afterSecondRun).toBe(17);

      const numbers = await prisma.sdg.findMany({
        select: { number: true },
        orderBy: { number: 'asc' },
      });
      expect(numbers.map((sdg) => sdg.number)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
      ]);
    }, 60_000);
  });
});
