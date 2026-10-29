import type { INestApplication } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Integração com o PostgreSQL real do `docker compose`.
 *
 * Rode `npm run test:integration` (o banco precisa estar de pé; sem ele o boot
 * falha de propósito, por causa do fail-fast do `PrismaService`).
 *
 * Cobre o que o e2e (com repositório stubado) não alcança: a exclusão lógica
 * gravando `deleted_at` de verdade, o 409 de e-mail duplicado contra a consulta
 * real e as travas 409 de vínculo com `projects` e `users`.
 */
describe('OrganizationsModule (integração com Postgres real)', () => {
  let app: INestApplication;
  let organizationsService: OrganizationsService;
  let prisma: PrismaService;

  const buildEmail = (prefix = 'organization'): string =>
    `${prefix}.${randomUUID()}@arthemis.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    organizationsService = app.get(OrganizationsService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria, lista com busca por nome (case-insensitive) e recusa e-mail duplicado (409)', async () => {
    const email = buildEmail();
    const name = `Instituto ${randomUUID()}`;

    const created = await organizationsService.create({ name, email });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    // O contrato público não expõe o soft delete.
    expect(created).not.toHaveProperty('deletedAt');

    try {
      const found = await organizationsService.findAll({
        search: name.toUpperCase(),
      });
      expect(found.data.map((organization) => organization.id)).toContain(
        created.id,
      );

      await expect(
        organizationsService.create({
          name: 'Outro',
          email: email.toUpperCase(),
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      // E-mail normalizado (trim + lowercase) no banco.
      const stored = await prisma.organization.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(stored.email).toBe(email);
    } finally {
      await prisma.organization.deleteMany({ where: { id: created.id } });
    }
  });

  it('lista os registros ativos com metadados de paginação', async () => {
    const created = await organizationsService.create({
      name: `Instituto ${randomUUID()}`,
      email: buildEmail(),
    });

    try {
      const all = await organizationsService.findAll();

      expect(Array.isArray(all.data)).toBe(true);
      expect(all.data.map((organization) => organization.id)).toContain(
        created.id,
      );
      expect(all.meta).toMatchObject({ page: 1, limit: 10 });
    } finally {
      await prisma.organization.deleteMany({ where: { id: created.id } });
    }
  });

  it('aplica soft delete, esconde o registro e libera o e-mail', async () => {
    const email = buildEmail();
    const created = await organizationsService.create({
      name: `Descartavel ${randomUUID()}`,
      email,
    });

    await organizationsService.remove(created.id);

    // Some do detalhe e da listagem (deleted_at IS NULL).
    await expect(
      organizationsService.findById(created.id),
    ).rejects.toBeInstanceOf(NotFoundException);

    const listed = await organizationsService.findAll({
      search: 'Descartavel',
    });
    expect(listed.data.map((organization) => organization.id)).not.toContain(
      created.id,
    );

    // A linha continua no banco, apenas marcada.
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.deletedAt).not.toBeNull();

    // O e-mail do registro excluído pode ser reutilizado.
    const reused = await organizationsService.create({
      name: `Reuso ${randomUUID()}`,
      email,
    });

    try {
      expect(reused.id).not.toBe(created.id);
    } finally {
      await prisma.organization.deleteMany({
        where: { id: { in: [created.id, reused.id] } },
      });
    }
  });

  it('bloqueia a exclusão com 409 quando há projeto ativo vinculado', async () => {
    const created = await organizationsService.create({
      name: `Com projeto ${randomUUID()}`,
      email: buildEmail(),
    });

    const project = await prisma.project.create({
      data: { organizationId: created.id, name: 'Projeto vinculado' },
    });

    try {
      await expect(
        organizationsService.remove(created.id),
      ).rejects.toBeInstanceOf(ConflictException);

      // O 409 não altera o registro: continua ativo.
      await expect(
        organizationsService.findById(created.id),
      ).resolves.toMatchObject({ id: created.id });
    } finally {
      await prisma.project.deleteMany({ where: { id: project.id } });
      await prisma.organization.deleteMany({ where: { id: created.id } });
    }
  });

  it('libera a exclusão quando o projeto vinculado está soft-deleted', async () => {
    const created = await organizationsService.create({
      name: `Projeto removido ${randomUUID()}`,
      email: buildEmail(),
    });

    const project = await prisma.project.create({
      data: { organizationId: created.id, name: 'Projeto removido' },
    });

    try {
      await prisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      await expect(
        organizationsService.remove(created.id),
      ).resolves.toBeUndefined();
    } finally {
      await prisma.project.deleteMany({ where: { id: project.id } });
      await prisma.organization.deleteMany({ where: { id: created.id } });
    }
  });

  it('bloqueia a exclusão com 409 quando há usuário vinculado', async () => {
    const created = await organizationsService.create({
      name: `Com usuario ${randomUUID()}`,
      email: buildEmail(),
    });

    const user = await prisma.user.create({
      data: {
        email: buildEmail('user'),
        passwordHash: '$2b$10$hashfakehashfakehashfakehashfakehashfakehashfake',
        role: 'visitor',
        organizationId: created.id,
      },
    });

    try {
      await expect(
        organizationsService.remove(created.id),
      ).rejects.toBeInstanceOf(ConflictException);
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.organization.deleteMany({ where: { id: created.id } });
    }
  });
});
