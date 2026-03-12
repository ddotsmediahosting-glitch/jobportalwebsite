-- CreateTable: WhatsAppSession
CREATE TABLE IF NOT EXISTS "WhatsAppSession" (
    "id"          TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "waId"        TEXT,
    "profileName" TEXT,
    "state"       TEXT NOT NULL DEFAULT 'idle',
    "contextJson" JSONB,
    "optedOut"    BOOLEAN NOT NULL DEFAULT false,
    "userId"      TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppSession_phoneNumber_key" ON "WhatsAppSession"("phoneNumber");
CREATE INDEX IF NOT EXISTS "WhatsAppSession_phoneNumber_idx" ON "WhatsAppSession"("phoneNumber");
CREATE INDEX IF NOT EXISTS "WhatsAppSession_userId_idx"      ON "WhatsAppSession"("userId");

ALTER TABLE "WhatsAppSession"
    ADD CONSTRAINT "WhatsAppSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: WhatsAppMessage
CREATE TABLE IF NOT EXISTS "WhatsAppMessage" (
    "id"         TEXT NOT NULL,
    "sessionId"  TEXT,
    "messageSid" TEXT,
    "from"       TEXT NOT NULL,
    "to"         TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "direction"  TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'received',
    "mediaUrl"   TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppMessage_messageSid_key" ON "WhatsAppMessage"("messageSid");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_from_idx"      ON "WhatsAppMessage"("from");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_sessionId_idx" ON "WhatsAppMessage"("sessionId");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");
