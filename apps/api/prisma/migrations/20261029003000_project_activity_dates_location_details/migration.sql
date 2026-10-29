ALTER TABLE "activities"
ADD COLUMN "start_date" DATE,
ADD COLUMN "end_date" DATE;

ALTER TABLE "locations"
ADD COLUMN "name" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN "description" TEXT;

UPDATE "locations"
SET "name" = CONCAT("country", ' - ', "ecosystem")
WHERE "name" = '';

ALTER TABLE "locations"
ALTER COLUMN "name" DROP DEFAULT;
