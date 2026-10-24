-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('BINARY', 'IMAGE', 'DOCUMENT');

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);
