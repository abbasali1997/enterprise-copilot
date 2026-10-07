/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `OrganizationInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `invitedById` on the `OrganizationInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `OrganizationInvitation` table. All the data in the column will be lost.
  - Added the required column `invitedByUserId` to the `OrganizationInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- DropForeignKey
ALTER TABLE "OrganizationInvitation" DROP CONSTRAINT "OrganizationInvitation_invitedById_fkey";

-- DropIndex
DROP INDEX "OrganizationInvitation_organizationId_email_key";

-- AlterTable
ALTER TABLE "OrganizationInvitation" DROP COLUMN "acceptedAt",
DROP COLUMN "invitedById",
DROP COLUMN "revokedAt",
ADD COLUMN     "acceptedByUserId" TEXT,
ADD COLUMN     "invitedByUserId" TEXT NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" "OrganizationInvitationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_email_idx" ON "OrganizationInvitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_email_status_idx" ON "OrganizationInvitation"("organizationId", "email", "status");

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
