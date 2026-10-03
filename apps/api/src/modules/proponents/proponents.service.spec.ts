import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PublicProponent } from './models/i-proponent.js';
import type { ProponentsRepository } from './proponents.repository.js';
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  PROPONENT_HAS_PROJECTS_MESSAGE,
  PROPONENT_HAS_USERS_MESSAGE,
  ProponentsService,
} from './proponents.service.js';

/**
 * Regras de negócio isoladas do banco (repositório stubado).
 *
 * O foco são os dois 409 do escopo: e-mail duplicado e política de exclusão
 * (projetos/usuários vinculados) — além dos caminhos de 404 e da lista vazia.
 */
const PROPONENT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_PROPONENT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('ProponentsService', () => {
  const storedProponent: PublicProponent = {
    id: PROPONENT_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let repository: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    countActiveProjects: ReturnType<typeof vi.fn>;
    countActiveUsers: ReturnType<typeof vi.fn>;
  };
  let service: ProponentsService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findMany: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      countActiveProjects: vi.fn(),
      countActiveUsers: vi.fn(),
    };
    service = new ProponentsService(
      repository as unknown as ProponentsRepository,
    );
  });

  describe('create', () => {
    it('cria o proponente quando o e-mail é inédito', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(storedProponent);

      const created = await service.create({
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });

      expect(created).toEqual(storedProponent);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });
    });

    it('responde 409 para e-mail já cadastrado e não persiste', async () => {
      repository.findByEmail.mockResolvedValue(storedProponent);

      const attempt = () =>
        service.create({
          name: 'Outro Proponente',
          email: 'contato@arthemis.test',
        });

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(EMAIL_ALREADY_REGISTERED_MESSAGE);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devolve lista vazia quando não há registros', async () => {
      repository.findMany.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
      expect(repository.findMany).toHaveBeenCalledWith({ search: undefined });
    });

    it('repassa o search para o repositório', async () => {
      repository.findMany.mockResolvedValue([storedProponent]);

      await expect(service.findAll({ search: 'arte' })).resolves.toEqual([
        storedProponent,
      ]);
      expect(repository.findMany).toHaveBeenCalledWith({ search: 'arte' });
    });
  });

  describe('findById', () => {
    it('devolve o proponente ativo', async () => {
      repository.findById.mockResolvedValue(storedProponent);

      await expect(service.findById(PROPONENT_ID)).resolves.toEqual(
        storedProponent,
      );
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(PROPONENT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(storedProponent);
    });

    it('atualiza apenas o nome (PATCH parcial)', async () => {
      const updated = { ...storedProponent, name: 'Instituto Renomeado' };
      repository.update.mockResolvedValue(updated);

      await expect(
        service.update(PROPONENT_ID, { name: 'Instituto Renomeado' }),
      ).resolves.toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith(PROPONENT_ID, {
        name: 'Instituto Renomeado',
        email: undefined,
      });
    });

    it('permite reenviar o e-mail atual (não é conflito consigo mesmo)', async () => {
      repository.findByEmail.mockResolvedValue(storedProponent);
      repository.update.mockResolvedValue(storedProponent);

      await expect(
        service.update(PROPONENT_ID, { email: storedProponent.email }),
      ).resolves.toEqual(storedProponent);
      expect(repository.update).toHaveBeenCalled();
    });

    it('responde 409 quando o e-mail pertence a outro proponente', async () => {
      repository.findByEmail.mockResolvedValue({
        ...storedProponent,
        id: OTHER_PROPONENT_ID,
        email: 'outro@arthemis.test',
      });

      await expect(
        service.update(PROPONENT_ID, { email: 'outro@arthemis.test' }),
      ).rejects.toThrow(EMAIL_ALREADY_REGISTERED_MESSAGE);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('responde 404 quando o proponente não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(PROPONENT_ID, { name: 'Qualquer' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(storedProponent);
      repository.countActiveProjects.mockResolvedValue(0);
      repository.countActiveUsers.mockResolvedValue(0);
    });

    it('aplica soft delete quando não há vínculos', async () => {
      await expect(service.remove(PROPONENT_ID)).resolves.toBeUndefined();

      expect(repository.softDelete).toHaveBeenCalledWith(PROPONENT_ID);
    });

    it('responde 409 quando há projetos ativos vinculados', async () => {
      repository.countActiveProjects.mockResolvedValue(1);

      const attempt = () => service.remove(PROPONENT_ID);

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(PROPONENT_HAS_PROJECTS_MESSAGE);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 409 quando há usuários vinculados', async () => {
      repository.countActiveUsers.mockResolvedValue(2);

      const attempt = () => service.remove(PROPONENT_ID);

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(PROPONENT_HAS_USERS_MESSAGE);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 404 quando o proponente não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(PROPONENT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
