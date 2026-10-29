import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PublicOrganization } from './models/i-organization.js';
import type { OrganizationsRepository } from './organizations.repository.js';
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  ORGANIZATION_HAS_PROJECTS_MESSAGE,
  ORGANIZATION_HAS_USERS_MESSAGE,
  OrganizationsService,
} from './organizations.service.js';

/**
 * Regras de negócio isoladas do banco (repositório stubado).
 *
 * O foco são os dois 409 do escopo: e-mail duplicado e política de exclusão
 * (projetos/usuários vinculados) — além dos caminhos de 404 e da lista vazia.
 */
const ORGANIZATION_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_ORGANIZATION_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('OrganizationsService', () => {
  const storedOrganization: PublicOrganization = {
    id: ORGANIZATION_ID,
    name: 'Instituto Arthemis',
    email: 'contato@arthemis.test',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let repository: {
    create: ReturnType<typeof vi.fn>;
    findPaginated: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    countActiveProjects: ReturnType<typeof vi.fn>;
    countActiveUsers: ReturnType<typeof vi.fn>;
  };
  let service: OrganizationsService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findPaginated: vi.fn(),
      count: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      countActiveProjects: vi.fn(),
      countActiveUsers: vi.fn(),
    };
    service = new OrganizationsService(
      repository as unknown as OrganizationsRepository,
    );
  });

  describe('create', () => {
    it('cria a organização quando o e-mail é inédito', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(storedOrganization);

      const created = await service.create({
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });

      expect(created).toEqual(storedOrganization);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Instituto Arthemis',
        email: 'contato@arthemis.test',
      });
    });

    it('responde 409 para e-mail já cadastrado e não persiste', async () => {
      repository.findByEmail.mockResolvedValue(storedOrganization);

      const attempt = () =>
        service.create({
          name: 'Outra organização',
          email: 'contato@arthemis.test',
        });

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(EMAIL_ALREADY_REGISTERED_MESSAGE);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devolve página vazia com metadados padrão quando não há registros', async () => {
      repository.findPaginated.mockResolvedValue([]);
      repository.count.mockResolvedValue(0);

      await expect(service.findAll()).resolves.toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
      expect(repository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });
      expect(repository.count).toHaveBeenCalledWith(undefined);
    });

    it('repassa busca e paginação e calcula total de páginas', async () => {
      repository.findPaginated.mockResolvedValue([storedOrganization]);
      repository.count.mockResolvedValue(21);

      await expect(
        service.findAll({ page: 2, limit: 10, search: 'arte' }),
      ).resolves.toEqual({
        data: [storedOrganization],
        meta: { total: 21, page: 2, limit: 10, totalPages: 3 },
      });
      expect(repository.findPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'arte',
      });
      expect(repository.count).toHaveBeenCalledWith('arte');
    });

    it('recusa valores de paginação fora dos limites', async () => {
      await expect(service.findAll({ page: 0 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.findAll({ limit: 101 })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(repository.findPaginated).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('devolve a organização ativo', async () => {
      repository.findById.mockResolvedValue(storedOrganization);

      await expect(service.findById(ORGANIZATION_ID)).resolves.toEqual(
        storedOrganization,
      );
    });

    it('responde 404 quando não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(ORGANIZATION_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(storedOrganization);
    });

    it('atualiza apenas o nome (PATCH parcial)', async () => {
      const updated = { ...storedOrganization, name: 'Instituto Renomeado' };
      repository.update.mockResolvedValue(updated);

      await expect(
        service.update(ORGANIZATION_ID, { name: 'Instituto Renomeado' }),
      ).resolves.toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith(ORGANIZATION_ID, {
        name: 'Instituto Renomeado',
        email: undefined,
      });
    });

    it('permite reenviar o e-mail atual (não é conflito consigo mesmo)', async () => {
      repository.findByEmail.mockResolvedValue(storedOrganization);
      repository.update.mockResolvedValue(storedOrganization);

      await expect(
        service.update(ORGANIZATION_ID, { email: storedOrganization.email }),
      ).resolves.toEqual(storedOrganization);
      expect(repository.update).toHaveBeenCalled();
    });

    it('responde 409 quando o e-mail pertence a outra organização', async () => {
      repository.findByEmail.mockResolvedValue({
        ...storedOrganization,
        id: OTHER_ORGANIZATION_ID,
        email: 'outro@arthemis.test',
      });

      await expect(
        service.update(ORGANIZATION_ID, { email: 'outro@arthemis.test' }),
      ).rejects.toThrow(EMAIL_ALREADY_REGISTERED_MESSAGE);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('responde 404 quando a organização não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(ORGANIZATION_ID, { name: 'Qualquer' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(storedOrganization);
      repository.countActiveProjects.mockResolvedValue(0);
      repository.countActiveUsers.mockResolvedValue(0);
    });

    it('aplica soft delete quando não há vínculos', async () => {
      await expect(service.remove(ORGANIZATION_ID)).resolves.toBeUndefined();

      expect(repository.softDelete).toHaveBeenCalledWith(ORGANIZATION_ID);
    });

    it('responde 409 quando há projetos ativos vinculados', async () => {
      repository.countActiveProjects.mockResolvedValue(1);

      const attempt = () => service.remove(ORGANIZATION_ID);

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(
        ORGANIZATION_HAS_PROJECTS_MESSAGE,
      );

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 409 quando há usuários vinculados', async () => {
      repository.countActiveUsers.mockResolvedValue(2);

      const attempt = () => service.remove(ORGANIZATION_ID);

      await expect(attempt()).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt()).rejects.toThrow(ORGANIZATION_HAS_USERS_MESSAGE);

      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('responde 404 quando a organização não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(ORGANIZATION_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
