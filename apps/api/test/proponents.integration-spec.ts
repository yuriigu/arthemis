import type { INestApplication } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { ProponentsService } from '../src/modules/proponents/proponents.service.js';
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
describe('ProponentsModule (integração com Postgres real)', () => {
  let app: INestApplication;
  let proponentsService: ProponentsService;
  let prisma: PrismaService;

  const buildEmail = (prefix = 'proponent'): string =>
    `${prefix}.${randomUUID()}@arthemis.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    proponentsService = app.get(ProponentsService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria, lista com busca por nome (case-insensitive) e recusa e-mail duplicado (409)', async () => {
    const email = buildEmail();
    const name = `Instituto ${randomUUID()}`;

    const created = await proponentsService.create({ name, email });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    // O contrato público não expõe o soft delete.
    expect(created).not.toHaveProperty('deletedAt');

    try {
      const found = await proponentsService.findAll({
        search: name.toUpperCase(),
      });
      expect(found.map((proponent) => proponent.id)).toContain(created.id);

      await expect(
        proponentsService.create({ name: 'Outro', email: email.toUpperCase() }),
      ).rejects.toBeInstanceOf(ConflictException);

      // E-mail normalizado (trim + lowercase) no banco.
      const stored = await prisma.proponent.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(stored.email).toBe(email);
    } finally {
      await prisma.proponent.deleteMany({ where: { id: created.id } });
    }
  });

  it('busca vazia devolve a lista completa (sem paginação)', async () => {
    const created = await proponentsService.create({
      name: `Instituto ${randomUUID()}`,
      email: buildEmail(),
    });

    try {
      const all = await proponentsService.findAll();

      expect(Array.isArray(all)).toBe(true);
      expect(all.map((proponent) => proponent.id)).toContain(created.id);
    } finally {
      await prisma.proponent.deleteMany({ where: { id: created.id } });
    }
  });

  it('aplica soft delete, esconde o registro e libera o e-mail', async () => {
    const email = buildEmail();
    const created = await proponentsService.create({
      name: `Descartavel ${randomUUID()}`,
      email,
    });

    await proponentsService.remove(created.id);

    // Some do detalhe e da listagem (deleted_at IS NULL).
    await expect(proponentsService.findById(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const listed = await proponentsService.findAll({ search: 'Descartavel' });
    expect(listed.map((proponent) => proponent.id)).not.toContain(created.id);

    // A linha continua no banco, apenas marcada.
    const stored = await prisma.proponent.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.deletedAt).not.toBeNull();

    // O e-mail do registro excluído pode ser reutilizado.
    const reused = await proponentsService.create({
      name: `Reuso ${randomUUID()}`,
      email,
    });

    try {
      expect(reused.id).not.toBe(created.id);
    } finally {
      await prisma.proponent.deleteMany({
        where: { id: { in: [created.id, reused.id] } },
      });
    }
  });

  it('bloqueia a exclusão com 409 quando há projeto ativo vinculado', async () => {
    const created = await proponentsService.create({
      name: `Com projeto ${randomUUID()}`,
      email: buildEmail(),
    });

    const project = await prisma.project.create({
      data: { proponentId: created.id, name: 'Projeto vinculado' },
    });

    try {
      await expect(proponentsService.remove(created.id)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // O 409 não altera o registro: continua ativo.
      await expect(
        proponentsService.findById(created.id),
      ).resolves.toMatchObject({ id: created.id });
    } finally {
      await prisma.project.deleteMany({ where: { id: project.id } });
      await prisma.proponent.deleteMany({ where: { id: created.id } });
    }
  });

  it('libera a exclusão quando o projeto vinculado está soft-deleted', async () => {
    const created = await proponentsService.create({
      name: `Projeto removido ${randomUUID()}`,
      email: buildEmail(),
    });

    const project = await prisma.project.create({
      data: { proponentId: created.id, name: 'Projeto removido' },
    });

    try {
      await prisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      await expect(
        proponentsService.remove(created.id),
      ).resolves.toBeUndefined();
    } finally {
      await prisma.project.deleteMany({ where: { id: project.id } });
      await prisma.proponent.deleteMany({ where: { id: created.id } });
    }
  });

  it('bloqueia a exclusão com 409 quando há usuário vinculado', async () => {
    const created = await proponentsService.create({
      name: `Com usuario ${randomUUID()}`,
      email: buildEmail(),
    });

    const user = await prisma.user.create({
      data: {
        email: buildEmail('user'),
        passwordHash: '$2b$10$hashfakehashfakehashfakehashfakehashfakehashfake',
        role: 'visitor',
        proponentId: created.id,
      },
    });

    try {
      await expect(proponentsService.remove(created.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.proponent.deleteMany({ where: { id: created.id } });
    }
  });
});
