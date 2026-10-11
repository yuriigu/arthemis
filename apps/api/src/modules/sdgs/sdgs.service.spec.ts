import { NotFoundException } from '@nestjs/common';
import type { PublicSdg } from './models/i-sdg.js';
import type { SdgsRepository } from './sdgs.repository.js';
import { EXPECTED_SDGS_COUNT, SdgsService } from './sdgs.service.js';

describe('SdgsService', () => {
  let repository: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByNumber: ReturnType<typeof vi.fn>;
    findByNumbers: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let service: SdgsService;

  // Mock com os 17 ODS ordenados
  const mockAllSdgs: PublicSdg[] = Array.from({ length: 17 }, (_, index) => {
    const num = index + 1;
    return {
      id: `sdg-uuid-${num}`,
      number: num,
      name: `ODS ${num}`,
      iconUrl: `https://exemplo.org/sdg/${num}.png`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
  });

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByNumber: vi.fn(),
      findByNumbers: vi.fn(),
      count: vi.fn(),
    };
    service = new SdgsService(repository as unknown as SdgsRepository);
  });

  describe('findAll', () => {
    it('retorna os 17 ODS completos em ordem determinística', async () => {
      repository.findAll.mockResolvedValue(mockAllSdgs);

      const result = await service.findAll();

      expect(result).toHaveLength(17);
      expect(result).toEqual(mockAllSdgs);
      expect(result[0].number).toBe(1);
      expect(result[16].number).toBe(17);
      expect(repository.findAll).toHaveBeenCalledOnce();
    });

    it('emite aviso quando a contagem de ODS for inferior a 17 (seed incompleto)', async () => {
      const incompleteList = mockAllSdgs.slice(0, 5);
      repository.findAll.mockResolvedValue(incompleteList);

      const result = await service.findAll();

      expect(result).toHaveLength(5);
      expect(result.length).toBeLessThan(EXPECTED_SDGS_COUNT);
    });
  });

  describe('findById', () => {
    it('retorna o ODS quando encontrado pelo UUID', async () => {
      const mockSdg = mockAllSdgs[0];
      repository.findById.mockResolvedValue(mockSdg);

      const result = await service.findById(mockSdg.id);

      expect(result).toEqual(mockSdg);
      expect(repository.findById).toHaveBeenCalledWith(mockSdg.id);
    });

    it('lança NotFoundException quando o ODS não for encontrado', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith('uuid-inexistente');
    });
  });

  describe('validateSdgsExist', () => {
    it('retorna os ODS correspondentes quando todos os números existirem', async () => {
      const requestedNumbers = [1, 2, 13];
      const matchingSdgs = mockAllSdgs.filter((s) =>
        requestedNumbers.includes(s.number),
      );
      repository.findByNumbers.mockResolvedValue(matchingSdgs);

      const result = await service.validateSdgsExist(requestedNumbers);

      expect(result).toEqual(matchingSdgs);
      expect(repository.findByNumbers).toHaveBeenCalledWith(requestedNumbers);
    });

    it('lança NotFoundException quando algum número de ODS não for encontrado', async () => {
      // Solicita ODS 1, 2 e 99 (99 inexistente)
      const requestedNumbers = [1, 2, 99];
      const foundSdgs = mockAllSdgs.filter((s) => [1, 2].includes(s.number));
      repository.findByNumbers.mockResolvedValue(foundSdgs);

      await expect(
        service.validateSdgsExist(requestedNumbers),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
