-- Add project fields while preserving projects that already exist.
ALTER TABLE "Project"
ADD COLUMN "name" TEXT;

UPDATE "Project"
SET "name" = 'Project ' || "id"
WHERE "name" IS NULL;

ALTER TABLE "Project"
ALTER COLUMN "name" SET NOT NULL,
ADD COLUMN "lifetimeStart" TIMESTAMP(3),
ADD COLUMN "lifetimeEnd" TIMESTAMP(3),
ADD COLUMN "justification" TEXT;

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ecosystem" TEXT,
    "extent" DOUBLE PRECISION,
    "country" TEXT,
    "position" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLocation" (
    "activityId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "ActivityLocation_pkey" PRIMARY KEY ("activityId", "locationId")
);

CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "valueBaseline" DOUBLE PRECISION,
    "valueReference" DOUBLE PRECISION,
    "observationMethod" TEXT,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectProponent" (
    "projectId" TEXT NOT NULL,
    "proponentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "ProjectProponent_pkey" PRIMARY KEY ("projectId", "proponentId")
);

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Location"
ADD CONSTRAINT "Location_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityLocation"
ADD CONSTRAINT "ActivityLocation_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "ActivityLocation_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Indicator"
ADD CONSTRAINT "Indicator_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Indicator_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectProponent"
ADD CONSTRAINT "ProjectProponent_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "ProjectProponent_proponentId_fkey"
FOREIGN KEY ("proponentId") REFERENCES "Proponent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
