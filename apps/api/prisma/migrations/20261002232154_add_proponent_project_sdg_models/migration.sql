-- Proponentes, projetos e ODS (issue #26).
--
-- Cria as tabelas `proponents`, `projects`, `project_proponents`, `sdgs` e
-- `project_sdg` (os mesmos nomes do legado em `legacy/brain/internal/models`),
-- com PK em UUID e soft delete (`deleted_at`) em todas as entidades de domínio.
-- Reativa `users.username` (único) e adiciona a FK opcional
-- `users.proponent_id -> proponents.id` (ON DELETE SET NULL).
--
-- Unicidades: `project_sdg(project_id, sdg_id)`,
-- `project_proponents(project_id, proponent_id)` e `sdgs.number`.
--
-- O CHECK de `users.role` herdado do legado (migration anterior) não é
-- tocado aqui.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "proponent_id" UUID,
ADD COLUMN "username" VARCHAR(150);

-- CreateTable
CREATE TABLE "proponents" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "proponents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "proponent_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "lifetime_start" DATE,
    "lifetime_end" DATE,
    "justification" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_proponents" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "proponent_id" UUID NOT NULL,
    "role" VARCHAR(50),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "project_proponents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdgs" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "sdgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_sdg" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sdg_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "project_sdg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_proponent_id_idx" ON "projects"("proponent_id");

-- CreateIndex
CREATE INDEX "project_proponents_proponent_id_idx" ON "project_proponents"("proponent_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_proponents_project_id_proponent_id_key" ON "project_proponents"("project_id", "proponent_id");

-- CreateIndex
CREATE UNIQUE INDEX "sdgs_number_key" ON "sdgs"("number");

-- CreateIndex
CREATE INDEX "project_sdg_sdg_id_idx" ON "project_sdg"("sdg_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_sdg_project_id_sdg_id_key" ON "project_sdg"("project_id", "sdg_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_proponent_id_idx" ON "users"("proponent_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_proponent_id_fkey" FOREIGN KEY ("proponent_id") REFERENCES "proponents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_proponent_id_fkey" FOREIGN KEY ("proponent_id") REFERENCES "proponents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proponents" ADD CONSTRAINT "project_proponents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proponents" ADD CONSTRAINT "project_proponents_proponent_id_fkey" FOREIGN KEY ("proponent_id") REFERENCES "proponents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_sdg" ADD CONSTRAINT "project_sdg_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_sdg" ADD CONSTRAINT "project_sdg_sdg_id_fkey" FOREIGN KEY ("sdg_id") REFERENCES "sdgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

