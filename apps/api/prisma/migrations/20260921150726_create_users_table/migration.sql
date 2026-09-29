-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'visitor',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Fidelidade ao legado: `legacy/brain/internal/models/user.go` declarava
-- `check:role IN ('admin','manager','visitor')` no gorm. O Prisma não representa
-- CHECK no schema, então a restrição vive aqui.
ALTER TABLE "users"
    ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('admin', 'manager', 'visitor'));

