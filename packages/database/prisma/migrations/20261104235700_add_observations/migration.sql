CREATE TABLE "observations" (
    "id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "position" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "observations_indicator_id_idx" ON "observations"("indicator_id");

ALTER TABLE "observations"
ADD CONSTRAINT "observations_indicator_id_fkey"
FOREIGN KEY ("indicator_id") REFERENCES "Indicator"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
