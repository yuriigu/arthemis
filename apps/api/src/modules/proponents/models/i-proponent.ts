/**
 * Contratos de proponente do módulo `proponents`.
 *
 * Herdados de `legacy/brain/internal/models/proponent.go`: a organização
 * proponente tem apenas `Name`/`Email` e embute `gorm.Model`
 * (`created_at`/`updated_at`/`deleted_at`). Os relacionamentos do legado
 * (`Projects` + o N:N `project_proponents` com `role`) e o `User`
 * (`user.go`, `ProponentID`) viraram as relações `projects`,
 * `projectProponents` e `users` do model Prisma — usadas aqui só para validar
 * a política de exclusão.
 */

/**
 * Proponente como está no banco, **incluindo** o `deletedAt` (soft delete).
 *
 * Uso interno: o campo é a fonte da verdade da política de exclusão.
 */
export interface ProponentRecord {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Proponente exposto pela API.
 *
 * O `deletedAt` fica fora do contrato: todas as leituras filtram
 * `deletedAt: null` (equivalente ao soft delete do gorm, que esconde as linhas
 * removidas), então o campo seria sempre `null` na resposta.
 */
export type PublicProponent = Omit<ProponentRecord, 'deletedAt'>;

/** Filtros aceitos na listagem para seletores (`GET /proponents?search=`). */
export interface ListProponentsFilter {
  search?: string;
}
