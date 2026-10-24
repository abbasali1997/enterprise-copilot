import { type DbClient, prisma } from "@enterprise/db";
import type { CreateAttachmentInputType } from "../types/attachment.type.js";

export const createAttachment = (
  input: CreateAttachmentInputType,
  db: DbClient = prisma,
) =>
  db.attachment.create({
    data: input,
  });

export const deleteAttachment = (id: string, db: DbClient = prisma) =>
  db.attachment.deleteMany({
    where: {
      id: id,
    },
  });

export const findAttachmentById = (id: string, db: DbClient = prisma) =>
  db.attachment.findUnique({
    where: { id },
  });
