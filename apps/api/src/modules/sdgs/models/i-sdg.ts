/**
 * Contratos de ODS (Objetivos de Desenvolvimento Sustentável).
 *
 * Mapeamento correspondente ao model `Sdg` (tabela `sdgs`) do schema Prisma.
 * Cada registro representa um dos 17 Objetivos de Desenvolvimento Sustentável da ONU.
 */

/**
 * Registro completo do ODS no banco de dados, incluindo timestamps e soft delete.
 */
export interface SdgRecord {
  id: string;
  number: number;
  name: string;
  iconUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Representação pública do ODS exposta pela API (sem deletedAt).
 */
export type PublicSdg = Omit<SdgRecord, 'deletedAt'>;
