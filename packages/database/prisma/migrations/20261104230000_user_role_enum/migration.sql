DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    WHERE "role" NOT IN ('admin', 'manager', 'visitor')
  ) THEN
    RAISE EXCEPTION 'Cannot migrate User.role: values must be admin, manager, or visitor';
  END IF;
END $$;

CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'visitor');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole"),
  ALTER COLUMN "role" SET DEFAULT 'visitor';
