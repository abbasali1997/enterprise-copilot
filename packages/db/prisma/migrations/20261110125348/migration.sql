/*
  Warnings:

  - The `embedding` column on the `DocumentChunk` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DocumentChunk" DROP COLUMN "embedding",
ADD COLUMN     "embedding" DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '48 hours');
