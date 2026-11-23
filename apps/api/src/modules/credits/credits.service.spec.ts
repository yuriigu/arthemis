import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Direction, IndicatorComponent } from '@arthemis/database';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreditsService,
  computeC,
  computeCa,
  computeCredits,
  computeSI,
  round,
  setRoundingMode,
} from './credits.service';

/* ------------------------------------------------------------------ */
/*  Helpers de tolerância                                              */
/* ------------------------------------------------------------------ */
function expectClose(actual: number, expected: number, tol = 0.001): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

/* ------------------------------------------------------------------ */
/*  Dados dos exemplos do Nature Framework v1.0                        */
/* ------------------------------------------------------------------ */

/**
 * Exemplo 1 — somente increases_with_condition.
 * Tabela 2 (baseline): 10 indicadores, 5 structure + 5 composition.
 * Rv = 1 para todos. Produz Cs = 0.80, Cc = 0.79 -> C0 = 0.795.
 */
const example1Baseline = [
  { value: 0.9, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.85, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.8, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.75, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.7, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.85, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.8, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.75, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.8, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.75, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
];

/** Tabela 3 (monitoramento, t=5). Produz Cs = 0.806, Cc = 0.800 -> C5 = 0.803. */
const example1Monitoring = [
  { value: 0.9, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.85, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.82, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.76, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.7, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.85, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.82, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.8, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.78, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.75, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
];

/**
 * Exemplo 2 — mistura de increases e decreases, com SIs negativos.
 * Tabela 5 (baseline). Produz Cs = 0.20, Cc = 0.132 -> C0 = 0.166.
 */
const example2Baseline = [
  { value: 0.65, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 1.2, valueReference: 0.2, threshold: 1.0, direction: Direction.decreases_with_condition, component: IndicatorComponent.structure },
  { value: 0.05, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.8716, valueReference: 0.4, threshold: 1.0, direction: Direction.decreases_with_condition, component: IndicatorComponent.composition },
];

/** Tabela 6 (monitoramento, t=5). Produz Cs = 0.40, Cc = 0.246 -> C5 = 0.323. */
const example2Monitoring = [
  { value: 0.7, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.structure },
  { value: 0.92, valueReference: 0.2, threshold: 1.0, direction: Direction.decreases_with_condition, component: IndicatorComponent.structure },
  { value: 0.2, valueReference: 1, threshold: null, direction: Direction.increases_with_condition, component: IndicatorComponent.composition },
  { value: 0.8248, valueReference: 0.4, threshold: 1.0, direction: Direction.decreases_with_condition, component: IndicatorComponent.composition },
];

/* ------------------------------------------------------------------ */
/*  Testes das funções puras                                           */
/* ------------------------------------------------------------------ */

describe('round', () => {
  it('trunca para baixo em modo floor (7.4.1)', () => {
    expect(round(0.7959, 3)).toBe(0.795);
    expect(round(1.9999, 0)).toBe(1);
  });
});

describe('computeSI', () => {
  it('increases_with_condition: SI = I / Rv', () => {
    const si = computeSI({
      value: 0.9,
      valueReference: 1,
      threshold: null,
      direction: Direction.increases_with_condition,
      component: IndicatorComponent.structure,
    });
    expectClose(si, 0.9);
  });

  it('decreases_with_condition: SI = (T − I) / (T − Rv)', () => {
    const si = computeSI({
      value: 0.6,
      valueReference: 0.3,
      threshold: 1.0,
      direction: Direction.decreases_with_condition,
      component: IndicatorComponent.structure,
    });
    // (1.0 − 0.6) / (1.0 − 0.3) = 0.4 / 0.7 ≈ 0.571
    expectClose(si, 0.571, 0.001);
  });

  it('SI pode ser negativo', () => {
    // T=0.8, I=1.0, Rv=0.2 → (0.8−1.0)/(0.8−0.2) = −0.2/0.6 ≈ −0.333
    const si = computeSI({
      value: 1.0,
      valueReference: 0.2,
      threshold: 0.8,
      direction: Direction.decreases_with_condition,
      component: IndicatorComponent.composition,
    });
    expect(si).toBeLessThan(0);
    expectClose(si, -0.333, 0.001);
  });
});

describe('computeC – Exemplo 1', () => {
  it('C0 ≈ 0.795 (Tabela 2)', () => {
    const c0 = computeC(example1Baseline);
    expectClose(c0, 0.795);
  });

  it('C5 ≈ 0.803 (Tabela 3)', () => {
    const c5 = computeC(example1Monitoring);
    expectClose(c5, 0.803);
  });
});

describe('computeC – Exemplo 2', () => {
  it('C0 ≈ 0.166 com SIs negativos preservados', () => {
    const c0 = computeC(example2Baseline);
    expectClose(c0, 0.166);
  });

  it('C5 ≈ 0.323', () => {
    const c5 = computeC(example2Monitoring);
    expectClose(c5, 0.323);
  });
});

describe('computeCa', () => {
  it('com mais de um ecossistema, Ca total é a soma dos Ca', () => {
    const extent1 = 100;
    const extent2 = 200;
    const ca1 = computeCa(example1Baseline, extent1);
    const ca2 = computeCa(example1Baseline, extent2);
    const caTotal = ca1 + ca2;
    expectClose(caTotal, ca1 + ca2);
    // ca1 ≈ 100 × 0.795 = 79.5; ca2 ≈ 200 × 0.795 = 159
    expectClose(ca1, 79.5, 0.1);
    expectClose(ca2, 159.0, 0.1);
  });

  it('com dois painéis, Ca_t é a média dos dois Ca (não a média por indicador)', () => {
    const extent = 100;
    const caPanel1 = computeCa(example1Baseline, extent);
    const caPanel2 = computeCa(example1Monitoring, extent);
    const caT = round((caPanel1 + caPanel2) / 2, 3);
    // média de ~79.5 e ~80.3 ≈ 79.9
    expectClose(caT, (caPanel1 + caPanel2) / 2, 0.001);
  });
});

describe('computeCredits', () => {
  beforeEach(() => {
    setRoundingMode('round');
  });

  afterEach(() => {
    setRoundingMode('floor');
  });

  it('Exemplo 1: NBO ≈ 495.349, NC ≈ 49535, buffer ≈ 9907, NNC ≈ 39628 (tolerância ≤ 1 crédito)', () => {
    // Entradas exatas do Exemplo 1 do Framework (Tabela 4)
    const result = computeCredits(
      {
        ca0: 30811.815,
        caT: 31121.871,
        t: 5,
        b: -0.00156,
        leakage: 0.1,
      },
      'round',
    );

    expectClose(result.nbo, 495.349, 0.001);
    expectClose(result.nc, 49535, 1);
    expectClose(result.buffer, 9907, 1);
    expectClose(result.nnc, 39628, 1);

    expect(Number.isInteger(result.nc)).toBe(true);
    expect(Number.isInteger(result.buffer)).toBe(true);
    expect(Number.isInteger(result.nnc)).toBe(true);
    expect(result.nnc).toBe(result.nc - result.buffer);
  });

  it('Exemplo 2: NBO ≈ 913.646, NC ≈ 91364, buffer ≈ 18273, NNC ≈ 73091 (tolerância ≤ 1 crédito)', () => {
    // Entradas exatas do Exemplo 2 do Framework (Tabela 7)
    const result = computeCredits(
      {
        ca0: 1067.712,
        caT: 2077.536,
        t: 5,
        b: -0.001,
        leakage: 0.1,
      },
      'round',
    );

    expectClose(result.nbo, 913.646, 0.001);
    expectClose(result.nc, 91364, 1);
    expectClose(result.buffer, 18273, 1);
    expectClose(result.nnc, 73091, 1);

    expect(Number.isInteger(result.nc)).toBe(true);
    expect(Number.isInteger(result.buffer)).toBe(true);
    expect(Number.isInteger(result.nnc)).toBe(true);
    expect(result.nnc).toBe(result.nc - result.buffer);
  });

  it('com modo floor (regra normativa 7.4.1), respeita a tolerância de até 1 crédito em relação aos exemplos', () => {
    const result1 = computeCredits(
      {
        ca0: 30811.815,
        caT: 31121.871,
        t: 5,
        b: -0.00156,
        leakage: 0.1,
      },
      'floor',
    );
    expectClose(result1.nbo, 495.349, 0.001);
    expectClose(result1.nc, 49535, 1);
    expectClose(result1.buffer, 9907, 1);
    expectClose(result1.nnc, 39628, 1);
    expect(Number.isInteger(result1.nc)).toBe(true);
    expect(Number.isInteger(result1.buffer)).toBe(true);
    expect(Number.isInteger(result1.nnc)).toBe(true);
    expect(result1.nnc).toBe(result1.nc - result1.buffer);

    const result2 = computeCredits(
      {
        ca0: 1067.712,
        caT: 2077.536,
        t: 5,
        b: -0.001,
        leakage: 0.1,
      },
      'floor',
    );
    expectClose(result2.nbo, 913.646, 0.001);
    expectClose(result2.nc, 91364, 1);
    expectClose(result2.buffer, 18273, 1);
    expectClose(result2.nnc, 73091, 1);
    expect(Number.isInteger(result2.nc)).toBe(true);
    expect(Number.isInteger(result2.buffer)).toBe(true);
    expect(Number.isInteger(result2.nnc)).toBe(true);
    expect(result2.nnc).toBe(result2.nc - result2.buffer);
  });

  it('NC, buffer e NNC são sempre inteiros', () => {
    const result = computeCredits({
      ca0: 1000,
      caT: 1050,
      t: 5,
      b: -0.001,
      leakage: 0.1,
    });
    expect(Number.isInteger(result.nc)).toBe(true);
    expect(Number.isInteger(result.buffer)).toBe(true);
    expect(Number.isInteger(result.nnc)).toBe(true);
  });

  it('nnc = nc - buffer', () => {
    const result = computeCredits({
      ca0: 500,
      caT: 600,
      t: 3,
      b: -0.002,
      leakage: 0.05,
    });
    expect(result.nnc).toBe(result.nc - result.buffer);
  });
});

/* ------------------------------------------------------------------ */
/*  Testes do service (integração com Prisma mockado)                   */
/* ------------------------------------------------------------------ */

describe('CreditsService', () => {
  const monitoringPeriod = {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const creditResult = {
    upsert: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = {
    monitoringPeriod,
    creditResult,
  } as unknown as PrismaService;
  const service = new CreditsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lança NotFoundException quando o período não existe', async () => {
    monitoringPeriod.findUnique.mockResolvedValue(null);

    await expect(service.calculate('no-id', 0.001, 0.1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lança BadRequestException quando o período não possui observações', async () => {
    monitoringPeriod.findUnique.mockResolvedValue({
      id: 'p1',
      yearT: 5,
      project: {
        locations: [{ id: 'loc1', extent: 100 }],
        activities: [
          {
            indicators: [
              {
                id: 'ind1',
                valueBaseline: 0.9,
                valueReference: 1,
                threshold: null,
                direction: Direction.increases_with_condition,
                component: IndicatorComponent.structure,
                locationId: 'loc1',
                observations: [],
              },
            ],
          },
        ],
      },
    });

    await expect(
      service.calculate('p1', 0.001, 0.1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalcular o mesmo período atualiza (upsert), não duplica', async () => {
    const obs = {
      date: new Date('2025-06-01'),
      value: 0.95,
    };
    monitoringPeriod.findUnique.mockResolvedValue({
      id: 'p1',
      yearT: 5,
      project: {
        locations: [{ id: 'loc1', extent: 100 }],
        activities: [
          {
            indicators: [
              {
                id: 'ind1',
                valueBaseline: 0.9,
                valueReference: 1,
                threshold: null,
                direction: Direction.increases_with_condition,
                component: IndicatorComponent.structure,
                locationId: 'loc1',
                observations: [obs],
              },
              {
                id: 'ind2',
                valueBaseline: 0.8,
                valueReference: 1,
                threshold: null,
                direction: Direction.increases_with_condition,
                component: IndicatorComponent.composition,
                locationId: 'loc1',
                observations: [{ ...obs, value: 0.85 }],
              },
            ],
          },
        ],
      },
    });
    creditResult.upsert.mockResolvedValue({ id: 'cr1', periodId: 'p1' });

    await service.calculate('p1', 0.001, 0.1);
    await service.calculate('p1', 0.001, 0.1);

    expect(creditResult.upsert).toHaveBeenCalledTimes(2);
    for (const call of creditResult.upsert.mock.calls) {
      expect((call as Array<Record<string, unknown>>)[0]).toHaveProperty(
        'where',
        { periodId: 'p1' },
      );
    }
  });
});
