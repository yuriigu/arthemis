import type { INestApplication } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';

/**
 * Integração com o PostgreSQL real do `docker compose`.
 *
 * Rode `npm run test:integration` (o banco precisa estar de pé; sem ele o boot
 * falha de propósito, por causa do fail-fast do PrismaService).
 */
describe('UsersModule (integração com Postgres real)', () => {
  const PASSWORD = 'senha-integracao-123';

  let app: INestApplication;
  let usersService: UsersService;
  let prisma: PrismaService;

  const buildEmail = (): string => `integration.${randomUUID()}@arthemis.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    usersService = app.get(UsersService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('grava apenas o hash bcrypt e permite buscar por e-mail e por id', async () => {
    const email = buildEmail();

    const created = await usersService.createUser({ email, password: PASSWORD });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created).not.toHaveProperty('passwordHash');

    // Linha crua do banco: hash bcrypt de custo 10, texto limpo em lugar nenhum.
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(JSON.stringify(stored)).not.toContain(PASSWORD);
    await expect(compare(PASSWORD, stored.passwordHash)).resolves.toBe(true);

    // findByEmail (uso interno do login) devolve o hash para o bcrypt.compare.
    const byEmail = await usersService.findByEmail(email);
    expect(byEmail).toMatchObject({ id: created.id, email, role: 'visitor' });
    expect(byEmail?.passwordHash).toBe(stored.passwordHash);

    // findById devolve sem o hash.
    const byId = await usersService.findById(created.id);
    expect(byId).toMatchObject({ id: created.id, email, role: 'visitor' });
    expect(byId).not.toHaveProperty('passwordHash');

    await prisma.user.delete({ where: { id: created.id } });
    await expect(usersService.findById(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('normaliza o e-mail e recusa duplicados com 409', async () => {
    const email = buildEmail();

    const created = await usersService.createUser({
      email: email.toUpperCase(),
      password: PASSWORD,
    });

    expect(created.email).toBe(email);

    await expect(
      usersService.createUser({ email, password: 'outra-senha-123' }),
    ).rejects.toBeInstanceOf(ConflictException);

    await prisma.user.delete({ where: { id: created.id } });
  });

  it('mantém o CHECK de role herdado do legado no banco', async () => {
    const email = buildEmail();

    await expect(
      prisma.$executeRaw`INSERT INTO users (id, email, password_hash, role, updated_at) VALUES (gen_random_uuid(), ${email}, '$2b$10$hash', 'superadmin', now())`,
    ).rejects.toThrow();
  });

  it('atualiza updated_at quando o registro muda', async () => {
    const email = buildEmail();
    const created = await usersService.createUser({ email, password: PASSWORD });

    const before = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    await prisma.user.update({
      where: { id: created.id },
      data: { role: 'manager' },
    });

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
    });

    expect(after.role).toBe('manager');
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());

    await prisma.user.delete({ where: { id: created.id } });
  });
});
