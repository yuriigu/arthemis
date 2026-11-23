-- CreateEnum
CREATE TYPE "IndicatorComponent" AS ENUM ('composition', 'structure');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('increases_with_condition', 'decreases_with_condition');

-- AlterTable
ALTER TABLE "Location" ADD COLUMN "ecosystemCode" TEXT;

-- AlterTable
ALTER TABLE "Indicator"
  ADD COLUMN "component" "IndicatorComponent" NOT NULL DEFAULT 'composition',
  ADD COLUMN "direction" "Direction" NOT NULL DEFAULT 'increases_with_condition',
  ADD COLUMN "threshold" DOUBLE PRECISION,
  ADD COLUMN "referenceSource" TEXT;

ALTER TABLE "Indicator" ALTER COLUMN "component" DROP DEFAULT;
