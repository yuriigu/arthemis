import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { SdgsService } from '../src/modules/sdgs/sdgs.service.js';

/**
 * Testes de integração do módulo de ODS com o PostgreSQL real.
 *
 * Executado via `npm run test:integration` quando o banco de dados Docker estiver ativo.
 * Valida a presença dos 17 ODS semeados na base de dados e sua ordenação determinística.
 */
describe('SdgsModule (integração com Postgres real)', () => {
  let app: INestApplication;
  let sdgsService: SdgsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    sdgsService = app.get(SdgsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna os 17 ODS cadastrados no banco em ordem crescente de número', async () => {
    const sdgs = await sdgsService.findAll();

    expect(sdgs.length).toBeGreaterThanOrEqual(17);
    expect(sdgs[0].number).toBe(1);
    expect(sdgs[16].number).toBe(17);

    // Garante que a ordem seja estritamente crescente
    for (let i = 0; i < sdgs.length - 1; i++) {
      expect(sdgs[i].number).toBeLessThan(sdgs[i + 1].number);
    }
  });

  it('valida a busca por números oficiais com sucesso', async () => {
    const found = await sdgsService.validateSdgsExist([1, 2, 3]);

    expect(found).toHaveLength(3);
    expect(found.map((s) => s.number)).toEqual([1, 2, 3]);
  });
});
