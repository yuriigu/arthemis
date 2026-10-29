ALTER TABLE "proponents" RENAME TO "organizations";
ALTER TABLE "organizations" RENAME CONSTRAINT "proponents_pkey" TO "organizations_pkey";

ALTER TABLE "projects" RENAME COLUMN "proponent_id" TO "organization_id";
ALTER TABLE "projects" RENAME CONSTRAINT "projects_proponent_id_fkey" TO "projects_organization_id_fkey";
ALTER INDEX "projects_proponent_id_idx" RENAME TO "projects_organization_id_idx";

ALTER TABLE "users" RENAME COLUMN "proponent_id" TO "organization_id";
ALTER TABLE "users" RENAME CONSTRAINT "users_proponent_id_fkey" TO "users_organization_id_fkey";
ALTER INDEX "users_proponent_id_idx" RENAME TO "users_organization_id_idx";

ALTER TABLE "project_proponents" RENAME TO "project_organizations";
ALTER TABLE "project_organizations" RENAME CONSTRAINT "project_proponents_pkey" TO "project_organizations_pkey";
ALTER TABLE "project_organizations" RENAME COLUMN "proponent_id" TO "organization_id";
ALTER TABLE "project_organizations" RENAME CONSTRAINT "project_proponents_project_id_fkey" TO "project_organizations_project_id_fkey";
ALTER TABLE "project_organizations" RENAME CONSTRAINT "project_proponents_proponent_id_fkey" TO "project_organizations_organization_id_fkey";
ALTER INDEX "project_proponents_proponent_id_idx" RENAME TO "project_organizations_organization_id_idx";
ALTER INDEX "project_proponents_project_id_proponent_id_key" RENAME TO "project_organizations_project_id_organization_id_key";
