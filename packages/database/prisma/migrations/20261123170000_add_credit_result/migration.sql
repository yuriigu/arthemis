-- CreateTable
CREATE TABLE "credit_results" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "qha_gross" DOUBLE PRECISION NOT NULL,
    "b" DOUBLE PRECISION NOT NULL,
    "leakage" DOUBLE PRECISION NOT NULL,
    "nbo" DOUBLE PRECISION NOT NULL,
    "nc" INTEGER NOT NULL,
    "buffer" INTEGER NOT NULL,
    "nnc" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_results_period_id_key" ON "credit_results"("period_id");

-- AddForeignKey
ALTER TABLE "credit_results" ADD CONSTRAINT "credit_results_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "monitoring_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
