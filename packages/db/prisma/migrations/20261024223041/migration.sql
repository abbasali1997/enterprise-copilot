/*
  Warnings:

  - Added the required column `key` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');
