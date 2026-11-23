-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'listed', 'under_validation', 'validated', 'under_verification', 'verified', 'expired');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'draft';
