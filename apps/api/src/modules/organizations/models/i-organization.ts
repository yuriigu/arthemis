/**
 * Contratos de organização do módulo `organizations`.
 *
 * Herdados de `legacy/brain/internal/models/organization.go`: a organização
 * tem apenas `Name`/`Email` e embute `gorm.Model`
 * (`created_at`/`updated_at`/`deleted_at`). Os relacionamentos do legado
 * (`Projects` + o N:N `project_organizations` com `role`) e o `User`
 * (`user.go`, `OrganizationID`) viraram as relações `projects`,
 * `projectOrganizations` e `users` do model Prisma — usadas aqui só para validar
 * a política de exclusão.
 */

/**
 * Organização como está no banco, **incluindo** o `deletedAt` (soft delete).
 *
 * Uso interno: o campo é a fonte da verdade da política de exclusão.
 */
export interface OrganizationRecord {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Organização exposta pela API.
 *
 * O `deletedAt` fica fora do contrato: todas as leituras filtram
 * `deletedAt: null` (equivalente ao soft delete do gorm, que esconde as linhas
 * removidas), então o campo seria sempre `null` na resposta.
 */
export type PublicOrganization = Omit<OrganizationRecord, 'deletedAt'>;

/** Filtros aceitos na listagem paginada (`GET /organizations`). */
export interface ListOrganizationsFilter {
  page: number;
  limit: number;
  search?: string;
}

/** Envelope da listagem paginada de organizações. */
export interface PaginatedOrganizationsResponse {
  data: PublicOrganization[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
