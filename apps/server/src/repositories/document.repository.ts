import { type DbClient, Prisma, prisma } from "@enterprise/db";
import type { CreateAttachmentInputType } from "../types/attachment.type.js";

export const createDocumentAttachment = (
  input: CreateAttachmentInputType,
  db: DbClient = prisma,
) => db.attachment.create({ data: input });

export const getDocumentList = (
  organizationId: string,
  db: DbClient = prisma,
) =>
  db.attachment.findMany({
    where: {
      organizationId: organizationId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      fileSize: true,
      mimeType: true,
    },
  });

export const getDocumentById = (id: string, db: DbClient = prisma) =>
  db.attachment.findUnique({
    where: {
      id: id,
    },
  });

export const updateManyDocuments = (
  args: Prisma.AttachmentUpdateManyArgs,
  db: DbClient = prisma,
) => db.attachment.updateMany(args);
