CREATE TABLE "monitoring_periods" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "year_t" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "monitoring_periods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "monitoring_periods_project_id_idx" ON "monitoring_periods"("project_id");

ALTER TABLE "monitoring_periods"
ADD CONSTRAINT "monitoring_periods_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "observations" ADD COLUMN "period_id" TEXT;

INSERT INTO "monitoring_periods" ("id", "project_id", "start_date", "end_date", "year_t", "verified", "updated_at")
SELECT
    gen_random_uuid()::text,
    a."projectId",
    MIN(o."date"),
    MAX(o."date"),
    EXTRACT(YEAR FROM MIN(o."date"))::int,
    false,
    CURRENT_TIMESTAMP
FROM "observations" o
JOIN "Indicator" i ON i."id" = o."indicator_id"
JOIN "Activity" a ON a."id" = i."activityId"
WHERE o."deleted_at" IS NULL
GROUP BY a."projectId";

UPDATE "observations" o
SET "period_id" = p."id"
FROM "Indicator" i
JOIN "Activity" a ON a."id" = i."activityId"
JOIN "monitoring_periods" p ON p."project_id" = a."projectId"
WHERE o."indicator_id" = i."id"
  AND o."period_id" IS NULL;

ALTER TABLE "observations" ALTER COLUMN "period_id" SET NOT NULL;

ALTER TABLE "observations"
ADD CONSTRAINT "observations_period_id_fkey"
FOREIGN KEY ("period_id") REFERENCES "monitoring_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "observations_period_id_idx" ON "observations"("period_id");