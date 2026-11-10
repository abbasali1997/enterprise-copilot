ALTER TABLE "OrganizationInvitation" ADD COLUMN "groupId" TEXT;
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrganizationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
