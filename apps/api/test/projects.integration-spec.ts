import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Testes de integração do módulo de projetos com o PostgreSQL real.
 *
 * Executado via `npm run test:integration` (requer `docker compose up -d` ou Postgres ativo).
 * Cobre operações transacionais no banco de dados real:
 * 1. Criação atômica de projeto e vínculos com organização principal, secundários e ODS;
 * 2. Atomicidade e rollback completo em caso de falha de gravação;
 * 3. Paginação no banco e busca textual com case-insensitive ILIKE;
 * 4. Edição preservando relacionamentos não enviados;
 * 5. Soft delete gravando deleted_at no banco real e exclusão da listagem ativa.
 */
describe('ProjectsModule (integração com Postgres real)', () => {
  let app: INestApplication;
  let projectsService: ProjectsService;
  let organizationsService: OrganizationsService;
  let prisma: PrismaService;

  const buildEmail = (prefix = 'project.integration'): string =>
    `${prefix}.${randomUUID()}@arthemis.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    projectsService = app.get(ProjectsService);
    organizationsService = app.get(OrganizationsService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria projeto de forma transacional com organização principal, secundário e ODS', async () => {
    const mainProp = await organizationsService.create({
      name: `Organização Principal ${randomUUID()}`,
      email: buildEmail('main'),
    });

    const secProp = await organizationsService.create({
      name: `Organização Secundário ${randomUUID()}`,
      email: buildEmail('sec'),
    });

    const projectName = `Projeto Integração ${randomUUID()}`;

    const created = await projectsService.create({
      name: projectName,
      lifetimeStart: '2026-03-01',
      lifetimeEnd: '2026-11-30',
      justification: 'Justificativa do projeto de integração',
      organizationId: mainProp.id,
      organizations: [{ organizationId: secProp.id, role: 'Co-executor' }],
      sdgIds: [1, 2],
    });

    try {
      expect(created.id).toBeDefined();
      expect(created.name).toBe(projectName);
      expect(created.lifetimeStart).toBe('2026-03-01');
      expect(created.lifetimeEnd).toBe('2026-11-30');
      expect(created.organization.id).toBe(mainProp.id);
      expect(created.organizations).toHaveLength(1);
      expect(created.organizations[0].organizationId).toBe(secProp.id);
      expect(created.organizations[0].role).toBe('Co-executor');
      expect(created.sdgs.length).toBeGreaterThanOrEqual(2);

      // Confirma que os registros existem fisicamente no PostgreSQL
      const projectInDb = await prisma.project.findUnique({
        where: { id: created.id },
      });
      expect(projectInDb).not.toBeNull();

      const secInDb = await prisma.projectOrganization.findMany({
        where: { projectId: created.id },
      });
      expect(secInDb).toHaveLength(1);

      const sdgsInDb = await prisma.projectSdg.findMany({
        where: { projectId: created.id },
      });
      expect(sdgsInDb).toHaveLength(2);

      // Testa listagem paginada e busca textual
      const paginated = await projectsService.findAll({
        page: 1,
        limit: 10,
        search: projectName,
      });
      expect(paginated.data).toHaveLength(1);
      expect(paginated.data[0].id).toBe(created.id);
      expect(paginated.meta.total).toBe(1);

      // Testa atualização parcial preservando vínculos
      const updated = await projectsService.update(created.id, {
        justification: 'Nova justificativa preservando vínculos',
      });
      expect(updated.justification).toBe(
        'Nova justificativa preservando vínculos',
      );
      expect(updated.organizations).toHaveLength(1);
      expect(updated.sdgs.length).toBeGreaterThanOrEqual(2);

      // Testa soft delete
      await projectsService.remove(created.id);

      const afterDelete = await prisma.project.findUnique({
        where: { id: created.id },
      });
      expect(afterDelete?.deletedAt).not.toBeNull();

      // Confirma ausência na listagem após soft delete
      const listAfterDelete = await projectsService.findAll({
        search: projectName,
      });
      expect(
        listAfterDelete.data.find((p) => p.id === created.id),
      ).toBeUndefined();
    } finally {
      // Limpeza dos dados de teste
      await prisma.projectSdg.deleteMany({ where: { projectId: created.id } });
      await prisma.projectOrganization.deleteMany({
        where: { projectId: created.id },
      });
      await prisma.project.deleteMany({ where: { id: created.id } });
      await prisma.organization.deleteMany({
        where: { id: { in: [mainProp.id, secProp.id] } },
      });
    }
  });

  it('garante rollback completo quando ocorrer falha durante a transação', async () => {
    const mainProp = await organizationsService.create({
      name: `Organização Rollback ${randomUUID()}`,
      email: buildEmail('rollback'),
    });

    const nonExistentOrganizationId = randomUUID();

    try {
      // Tenta criar com um secundário inexistente
      await expect(
        projectsService.create({
          name: 'Projeto que deve falhar',
          lifetimeStart: '2026-01-01',
          lifetimeEnd: '2026-12-31',
          organizationId: mainProp.id,
          organizations: [
            { organizationId: nonExistentOrganizationId, role: 'Invalido' },
          ],
          sdgIds: [1],
        }),
      ).rejects.toThrow();

      // Confirma que nenhum projeto com esse nome foi criado no banco
      const orphaned = await prisma.project.findMany({
        where: { name: 'Projeto que deve falhar' },
      });
      expect(orphaned).toHaveLength(0);
    } finally {
      await prisma.organization.deleteMany({ where: { id: mainProp.id } });
    }
  });
});
