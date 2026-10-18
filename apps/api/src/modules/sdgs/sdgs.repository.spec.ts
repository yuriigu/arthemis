import type { PrismaService } from '../../prisma/prisma.service.js';
import { PUBLIC_SDG_SELECT, SdgsRepository } from './sdgs.repository.js';

describe('SdgsRepository', () => {
  let prisma: {
    sdg: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let repository: SdgsRepository;

  const sampleSdg = {
    id: 'sdg-uuid-1',
    number: 1,
    name: 'No Poverty',
    iconUrl: 'https://exemplo.org/sdg/1.png',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      sdg: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
    };
    repository = new SdgsRepository(prisma as unknown as PrismaService);
  });

  it('lista todos os ODS ativos ordenados por número de forma determinística', async () => {
    prisma.sdg.findMany.mockResolvedValue([sampleSdg]);

    const result = await repository.findAll();

    expect(result).toEqual([sampleSdg]);
    expect(prisma.sdg.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { number: 'asc' },
      select: PUBLIC_SDG_SELECT,
    });
  });

  it('busca ODS ativo por id respeitando o filtro de soft delete', async () => {
    prisma.sdg.findFirst.mockResolvedValue(sampleSdg);

    const result = await repository.findById('sdg-uuid-1');

    expect(result).toEqual(sampleSdg);
    expect(prisma.sdg.findFirst).toHaveBeenCalledWith({
      where: { id: 'sdg-uuid-1', deletedAt: null },
      select: PUBLIC_SDG_SELECT,
    });
  });

  it('busca ODS ativo por número respeitando o filtro de soft delete', async () => {
    prisma.sdg.findFirst.mockResolvedValue(sampleSdg);

    const result = await repository.findByNumber(1);

    expect(result).toEqual(sampleSdg);
    expect(prisma.sdg.findFirst).toHaveBeenCalledWith({
      where: { number: 1, deletedAt: null },
      select: PUBLIC_SDG_SELECT,
    });
  });

  it('retorna array vazio em findByNumbers se a lista de números for vazia', async () => {
    const result = await repository.findByNumbers([]);

    expect(result).toEqual([]);
    expect(prisma.sdg.findMany).not.toHaveBeenCalled();
  });

  it('busca múltiplos ODS ativos por lista de números', async () => {
    prisma.sdg.findMany.mockResolvedValue([sampleSdg]);

    const result = await repository.findByNumbers([1, 2]);

    expect(result).toEqual([sampleSdg]);
    expect(prisma.sdg.findMany).toHaveBeenCalledWith({
      where: {
        number: { in: [1, 2] },
        deletedAt: null,
      },
      orderBy: { number: 'asc' },
      select: PUBLIC_SDG_SELECT,
    });
  });

  it('conta os ODS ativos cadastrados', async () => {
    prisma.sdg.count.mockResolvedValue(17);

    const count = await repository.count();

    expect(count).toBe(17);
    expect(prisma.sdg.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });
});
