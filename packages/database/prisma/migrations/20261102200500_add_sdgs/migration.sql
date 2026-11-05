CREATE TABLE "Sdg" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sdg_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectSdg" (
    "projectId" TEXT NOT NULL,
    "sdgId" TEXT NOT NULL,

    CONSTRAINT "ProjectSdg_pkey" PRIMARY KEY ("projectId", "sdgId")
);

CREATE UNIQUE INDEX "Sdg_number_key" ON "Sdg"("number");

ALTER TABLE "ProjectSdg"
ADD CONSTRAINT "ProjectSdg_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "ProjectSdg_sdgId_fkey"
FOREIGN KEY ("sdgId") REFERENCES "Sdg"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
