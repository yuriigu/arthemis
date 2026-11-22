/**
 * Official IUCN Global Ecosystem Typology (v2.0 / v2.1) Level 3 codes
 * (Ecosystem Functional Groups - EFGs), organized by Realm and Biome.
 * Reference: Keith et al. (2020) / https://global-ecosystems.org
 */
export const IUCN_ECOSYSTEM_CODES = [
  // T - Terrestrial Realm
  // T1: Tropical-subtropical forests
  'T1.1',
  'T1.2',
  'T1.3',
  'T1.4',
  // T2: Temperate-boreal forests and woodlands
  'T2.1',
  'T2.2',
  'T2.3',
  'T2.4',
  'T2.5',
  'T2.6',
  // T3: Shrublands and shrubby woodlands
  'T3.1',
  'T3.2',
  'T3.3',
  'T3.4',
  // T4: Savannas and grasslands
  'T4.1',
  'T4.2',
  'T4.3',
  'T4.4',
  'T4.5',
  // T5: Deserts and semi-deserts
  'T5.1',
  'T5.2',
  'T5.3',
  'T5.4',
  'T5.5',
  // T6: Polar-alpine (cryogenic) systems
  'T6.1',
  'T6.2',
  'T6.3',
  'T6.4',
  'T6.5',
  // T7: Intensive land-use systems
  'T7.1',
  'T7.2',
  'T7.3',
  'T7.4',
  'T7.5',

  // S - Subterranean Realm
  // S1: Subterranean lithic systems
  'S1.1',
  'S1.2',
  // S2: Anthropogenic subterranean voids
  'S2.1',

  // SF - Subterranean-Freshwater Transitional Realm
  // SF1: Subterranean freshwaters
  'SF1.1',
  'SF1.2',
  // SF2: Anthropogenic subterranean freshwaters
  'SF2.1',
  'SF2.2',

  // SM - Subterranean-Marine Transitional Realm
  // SM1: Subterranean tidal systems
  'SM1.1',
  'SM1.2',
  'SM1.3',

  // TF - Terrestrial-Freshwater Transitional Realm
  // TF1: Palustrine wetlands
  'TF1.1',
  'TF1.2',
  'TF1.3',
  'TF1.4',
  'TF1.5',
  'TF1.6',
  'TF1.7',

  // F - Freshwater Realm
  // F1: Rivers and streams
  'F1.1',
  'F1.2',
  'F1.3',
  'F1.4',
  'F1.5',
  'F1.6',
  'F1.7',
  // F2: Lakes
  'F2.1',
  'F2.2',
  'F2.3',
  'F2.4',
  'F2.5',
  'F2.6',
  'F2.7',
  'F2.8',
  'F2.9',
  'F2.10',
  // F3: Artificial fresh waters
  'F3.1',
  'F3.2',
  'F3.3',
  'F3.4',
  'F3.5',

  // FM - Freshwater-Marine Transitional Realm
  // FM1: Semi-confined transitional waters
  'FM1.1',
  'FM1.2',
  'FM1.3',

  // M - Marine Realm
  // M1: Marine shelves
  'M1.1',
  'M1.2',
  'M1.3',
  'M1.4',
  'M1.5',
  'M1.6',
  'M1.7',
  'M1.8',
  'M1.9',
  'M1.10',
  // M2: Pelagic ocean waters
  'M2.1',
  'M2.2',
  'M2.3',
  'M2.4',
  'M2.5',
  // M3: Deep-sea floors
  'M3.1',
  'M3.2',
  'M3.3',
  'M3.4',
  'M3.5',
  'M3.6',
  'M3.7',
  // M4: Anthropogenic marine systems
  'M4.1',
  'M4.2',

  // MT - Marine-Terrestrial Transitional Realm
  // MT1: Shorelines
  'MT1.1',
  'MT1.2',
  'MT1.3',
  'MT1.4',
  // MT2: Supralittoral coastal systems
  'MT2.1',
  'MT2.2',
  // MT3: Anthropogenic shorelines
  'MT3.1',

  // MFT - Marine-Freshwater-Terrestrial Transitional Realm
  // MFT1: Brackish tidal systems
  'MFT1.1',
  'MFT1.2',
  'MFT1.3',
] as const;

export type IucnEcosystemCode = (typeof IUCN_ECOSYSTEM_CODES)[number];

const IUCN_ECOSYSTEM_CODE_SET = new Set<string>(IUCN_ECOSYSTEM_CODES);

export function isIucnEcosystemCode(value: unknown): value is IucnEcosystemCode {
  return typeof value === 'string' && IUCN_ECOSYSTEM_CODE_SET.has(value);
}
