import type { PublicOrganization } from '../../organizations/models/i-organization.js';
import type { PublicSdg } from '../../sdgs/models/i-sdg.js';
import type { PublicActivity } from '../../activities/models/i-activity.js';
import type { PublicLocation } from '../../locations/models/i-location.js';
import type { ProjectStatus } from '../../../generated/prisma/client.js';

/**
 * Contratos e interfaces para o módulo de projetos.
 *
 * Mapeamento correspondente aos models `Project`, `ProjectOrganization` e `ProjectSdg`
 * do schema Prisma (tabelas `projects`, `project_organizations` e `project_sdg`).
 */

/**
 * Organização associada (secundário) com seu respectivo papel e dados da organização.
 */
export interface AssociatedOrganization {
  id: string;
  organizationId: string;
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
  status: ProjectStatus;
  lifetimeStart: string;
  lifetimeEnd: string;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Organização principal do projeto. */
  organization: PublicOrganization;
  /** Lista de organizações secundárias/associados com seus respectivos papéis. */
  organizations: AssociatedOrganization[];
  /** Lista de Objetivos de Desenvolvimento Sustentável completos associados ao projeto. */
  sdgs: PublicSdg[];
  /** Atividades e localizações ativas do projeto. */
  activities: PublicActivity[];
  locations: PublicLocation[];
}

/**
 * Representação resumida de um projeto na listagem paginada (GET /projects).
 */
export interface PublicProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Organização principal do projeto. */
  organization: PublicOrganization;
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
