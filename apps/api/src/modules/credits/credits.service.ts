import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Direction, IndicatorComponent } from '@arthemis/database';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Modo de arredondamento.
 * - 'floor': regra normativa do Nature Framework (seção 7.4.1) — trunca para baixo.
 * - 'round': arredondamento para o mais próximo (usado nos exemplos do PDF).
 *
 * Configurável por constante (7.4.1), por `setRoundingMode` ou por parâmetro nas funções.
 */
export let ROUNDING_MODE: 'floor' | 'round' = 'floor';

export function setRoundingMode(mode: 'floor' | 'round'): void {
  ROUNDING_MODE = mode;
}

/** Arredonda `value` para `decimals` casas conforme o modo configurado (7.4.1). */
export function round(
  value: number,
  decimals: number,
  mode: 'floor' | 'round' = ROUNDING_MODE,
): number {
  const factor = Math.pow(10, decimals);
  if (mode === 'floor') {
    return Math.floor(value * factor) / factor;
  }
  return Math.round(value * factor) / factor;
}

/** Indicador com os campos necessários para o cálculo de SI. */
interface IndicatorData {
  value: number;
  valueReference: number;
  threshold: number | null;
  direction: Direction;
  component: IndicatorComponent;
}

/** Passo 5 (7.4.7): Padronização do indicador. SI não é limitado entre 0 e 1. */
export function computeSI(ind: IndicatorData): number {
  if (ind.direction === Direction.increases_with_condition) {
    return ind.value / ind.valueReference;
  }
  // decreases_with_condition: SI = (T − I) / (T − Rv)
  const t = ind.threshold as number;
  return (t - ind.value) / (t - ind.valueReference);
}

/**
 * Passos 5–6 (7.4.7, 7.4.8): Condição por ecossistema.
 * Recebe os indicadores de um único ecossistema, calcula SI de cada um,
 * separa por componente, faz média de estrutura (Cs) e composição (Cc),
 * e devolve C = (Cs + Cc) / 2, arredondado a 3 casas.
 */
export function computeC(indicators: IndicatorData[]): number {
  const structureSIs: number[] = [];
  const compositionSIs: number[] = [];

  for (const ind of indicators) {
    const si = computeSI(ind);
    if (ind.component === IndicatorComponent.structure) {
      structureSIs.push(si);
    } else {
      compositionSIs.push(si);
    }
  }

  const avg = (arr: number[]): number =>
    arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

  const cs = avg(structureSIs);
  const cc = avg(compositionSIs);
  return round((cs + cc) / 2, 3);
}

/**
 * Passo 7 (7.4.9, 7.4.10): Condição ajustada pela área.
 * Ca = E × C por ecossistema; Ca_total = soma dos Ca.
 */
export function computeCa(
  indicators: IndicatorData[],
  extent: number,
): number {
  const c = computeC(indicators);
  return round(extent * c, 3);
}

/**
 * Passos 11–14 (7.6.8 e seguintes): NBO e créditos.
 *
 * NBO = (Ca_t − Ca_0 × (1 + t × B)) × (1 − leakage)
 *
 * O Framework escreve "− L_t" mas os exemplos aplicam leakage como multiplicação
 * (e.g. × 0.9). Seguimos a versão multiplicativa até haver issue da ferramenta
 * de vazamento.
 *
 * NC = NBO × 100; Buffer = NC × 0.2; NNC = NC − Buffer. Todos inteiros.
 */
export function computeCredits(
  input: {
    ca0: number;
    caT: number;
    t: number;
    b: number;
    leakage: number;
  },
  mode: 'floor' | 'round' = ROUNDING_MODE,
): { nbo: number; nc: number; buffer: number; nnc: number } {
  const nbo = round(
    (input.caT - input.ca0 * (1 + input.t * input.b)) * (1 - input.leakage),
    3,
    mode,
  );
  const nc = round(nbo * 100, 0, mode);
  const buffer = round(nc * 0.2, 0, mode);
  const nnc = nc - buffer;
  return { nbo, nc, buffer, nnc };
}

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula e salva os créditos de um período de monitoramento.
   *
   * Primeiro período: Ca_0 vem de valueBaseline e t = yearT.
   * Períodos seguintes: Ca_0 é o último painel antes do período, t conta desde
   * a última verificação, e B vem do período anterior. Esta limitação está
   * fora do escopo desta issue — apenas o primeiro período é suportado.
   *
   * Simplificação: mesma extensão E para Ca_0 e Ca_t (o Framework usa E_0 e E_t,
   * mas o schema guarda uma única extensão por local).
   */
  async calculate(periodId: string, b: number, leakage: number) {
    const period = await this.prisma.monitoringPeriod.findUnique({
      where: { id: periodId },
      include: {
        project: {
          include: {
            locations: true,
            activities: {
              include: {
                indicators: {
                  include: {
                    observations: {
                      where: { periodId, deletedAt: null },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!period) throw new NotFoundException('Período não encontrado');

    const { project } = period;

    // Coletar todas as observações do período
    const allObservations: Array<{
      date: Date;
      value: number;
      indicator: {
        valueReference: number | null;
        threshold: number | null;
        direction: Direction;
        component: IndicatorComponent;
        locationId: string | null;
      };
    }> = [];

    for (const activity of project.activities) {
      for (const indicator of activity.indicators) {
        for (const obs of indicator.observations) {
          allObservations.push({
            date: obs.date,
            value: obs.value,
            indicator: {
              valueReference: indicator.valueReference,
              threshold: indicator.threshold,
              direction: indicator.direction,
              component: indicator.component,
              locationId: indicator.locationId,
            },
          });
        }
      }
    }

    if (allObservations.length === 0) {
      throw new BadRequestException(
        'O período não possui observações para cálculo',
      );
    }

    // Agrupar observações por data (painel)
    const panels = new Map<
      string,
      typeof allObservations
    >();
    for (const obs of allObservations) {
      const key = obs.date.toISOString().slice(0, 10);
      const panel = panels.get(key) ?? [];
      panel.push(obs);
      panels.set(key, panel);
    }

    // Mapa de ecossistema -> extensão
    const ecosystemExtent = new Map<string, number>();
    for (const loc of project.locations) {
      const ecoKey = loc.id;
      ecosystemExtent.set(ecoKey, loc.extent ?? 0);
    }

    // Calcular Ca por painel
    const panelCas: number[] = [];

    for (const [, panelObs] of panels) {
      // Agrupar indicadores do painel por locationId (ecossistema)
      const byLocation = new Map<string, IndicatorData[]>();

      for (const obs of panelObs) {
        const locId = obs.indicator.locationId ?? '__none__';
        const inds = byLocation.get(locId) ?? [];
        inds.push({
          value: obs.value,
          valueReference: obs.indicator.valueReference ?? 0,
          threshold: obs.indicator.threshold,
          direction: obs.indicator.direction,
          component: obs.indicator.component,
        });
        byLocation.set(locId, inds);
      }

      let caTotal = 0;
      for (const [locId, indicators] of byLocation) {
        const extent = ecosystemExtent.get(locId) ?? 0;
        caTotal += computeCa(indicators, extent);
      }

      panelCas.push(round(caTotal, 3));
    }

    // Ca_t = média aritmética dos Ca dos painéis (Passo 9, 7.6.3–7.6.4)
    const caT =
      round(panelCas.reduce((a, c) => a + c, 0) / panelCas.length, 3);

    // Ca_0 de baseline: mesmos indicadores, usando valueBaseline
    // Simplificação: mesma extensão E para Ca_0 e Ca_t
    const baselineByLocation = new Map<string, IndicatorData[]>();
    const seenIndicators = new Set<string>();

    for (const activity of project.activities) {
      for (const indicator of activity.indicators) {
        if (seenIndicators.has(indicator.id)) continue;
        seenIndicators.add(indicator.id);

        if (
          indicator.valueBaseline === null ||
          indicator.valueReference === null
        ) {
          continue;
        }

        const locId = indicator.locationId ?? '__none__';
        const inds = baselineByLocation.get(locId) ?? [];
        inds.push({
          value: indicator.valueBaseline,
          valueReference: indicator.valueReference,
          threshold: indicator.threshold,
          direction: indicator.direction,
          component: indicator.component,
        });
        baselineByLocation.set(locId, inds);
      }
    }

    let ca0 = 0;
    for (const [locId, indicators] of baselineByLocation) {
      const extent = ecosystemExtent.get(locId) ?? 0;
      ca0 += computeCa(indicators, extent);
    }
    ca0 = round(ca0, 3);

    const credits = computeCredits({
      ca0,
      caT,
      t: period.yearT,
      b,
      leakage,
    });

    // Upsert: recalcular atualiza o registro existente
    const result = await this.prisma.creditResult.upsert({
      where: { periodId },
      create: {
        periodId,
        qhaGross: caT,
        b,
        leakage,
        nbo: credits.nbo,
        nc: credits.nc,
        buffer: credits.buffer,
        nnc: credits.nnc,
      },
      update: {
        qhaGross: caT,
        b,
        leakage,
        nbo: credits.nbo,
        nc: credits.nc,
        buffer: credits.buffer,
        nnc: credits.nnc,
      },
    });

    return result;
  }
}
