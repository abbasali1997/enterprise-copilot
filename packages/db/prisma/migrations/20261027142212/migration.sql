-- CreateEnum
CREATE TYPE "AttchmentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "status" "AttchmentStatus" NOT NULL DEFAULT 'UPLOADED';

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');
