import { can, PERMISSIONS, type OrganizationRole } from "@enterprise/auth";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { createUploadInputSchema } from "../schemas/document.schema.js";
import { s3Client } from "../storage/s3.client.js";
import { BUCKET } from "../storage/upload.service.js";

const UPLOAD_EXPIRY_SECONDS = 5 * 60;

export const createUpload = async (
  input: z.infer<typeof createUploadInputSchema>,
  userId: string,
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.DOCUMENT_UPLOAD)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to upload documents",
    });
  }

  const bucket = BUCKET;
  if (!bucket) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3_BUCKET must be configured before uploading",
    });
  }

  const key = `documents/${organizationId}/${userId}/${randomUUID()}.pdf`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.fileSize,
  });
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_EXPIRY_SECONDS,
    signableHeaders: new Set(["content-type", "content-length"]),
  });

  return {
    url,
    method: "PUT" as const,
    headers: {
      "Content-Type": input.contentType,
      "Content-Length": String(input.fileSize),
    },
    bucket,
    key,
    expiresIn: UPLOAD_EXPIRY_SECONDS,
  };
};
