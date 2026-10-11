import type { PublicProponent } from '../../proponents/models/i-proponent.js';
import type { PublicSdg } from '../../sdgs/models/i-sdg.js';

/**
 * Contratos e interfaces para o módulo de projetos.
 *
 * Mapeamento correspondente aos models `Project`, `ProjectProponent` e `ProjectSdg`
 * do schema Prisma (tabelas `projects`, `project_proponents` e `project_sdg`).
 */

/**
 * Proponente associado (secundário) com seu respectivo papel e dados da organização.
 */
export interface AssociatedProponent {
  id: string;
  proponentId: string;
  role: string | null;
  name: string;
  email: string;
}

/**
 * Representação detalhada de um projeto exposta pela API (detalhes e retorno de criação/atualização).
 */
export interface PublicProjectDetail {
  id: string;
  name: string;
  lifetimeStart: string;
  lifetimeEnd: string;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Proponente principal do projeto. */
  proponent: PublicProponent;
  /** Lista de proponentes secundários/associados com seus respectivos papéis. */
  proponents: AssociatedProponent[];
  /** Lista de Objetivos de Desenvolvimento Sustentável completos associados ao projeto. */
  sdgs: PublicSdg[];
}

/**
 * Representação resumida de um projeto na listagem paginada (GET /projects).
 */
export interface PublicProjectSummary {
  id: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Proponente principal do projeto. */
  proponent: PublicProponent;
  /** ODS vinculados ao projeto. */
  sdgs: PublicSdg[];
}

/**
 * Metadados padronizados da resposta paginada.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Envelope padronizado de resposta paginada da API.
 */
export interface PaginatedProjectsResponse<T = PublicProjectSummary> {
  data: T[];
  meta: PaginationMeta;
}
