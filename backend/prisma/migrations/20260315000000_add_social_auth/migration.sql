-- AlterTable: make passwordHash nullable and add social auth fields
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "socialProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "socialId"       TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "displayName"    TEXT;

-- Unique constraint on (socialProvider, socialId)
CREATE UNIQUE INDEX IF NOT EXISTS "User_socialProvider_socialId_key"
  ON "User"("socialProvider", "socialId");
