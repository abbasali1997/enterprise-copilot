-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "modelName" TEXT NOT NULL DEFAULT 'gemini-embedding-2';

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');
