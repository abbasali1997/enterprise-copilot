import { can, PERMISSIONS, type OrganizationRole } from "@enterprise/auth";
import { randomUUID } from "node:crypto";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type {
  createUploadInputSchema,
  finalizeUploadInputSchema,
} from "../schemas/document.schema.js";
import { s3Client } from "../storage/s3.client.js";
import { BUCKET } from "../storage/upload.service.js";

import { logOperation } from "../utils/log-operation.js";

import { createDocumentAttachment } from "../repositories/document.repository.js";

const UPLOAD_EXPIRY_SECONDS = 5 * 60;

export const createUpload = async (
  input: z.infer<typeof createUploadInputSchema>,
  userId: string,
  organizationId: string,
  role: OrganizationRole,
) =>
  logOperation(
    "document.createUpload",
    { userId, organizationId, fileSize: input.fileSize },
    async () => {
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
        ContentType: input.mimeType,
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
          "Content-Type": input.mimeType,
          "Content-Length": String(input.fileSize),
        },
        bucket,
        key,
        expiresIn: UPLOAD_EXPIRY_SECONDS,
      };
    },
  );

export const finalizeUpload = async (
  input: z.infer<typeof finalizeUploadInputSchema>,
  userId: string,
  organizationId: string,
  role: OrganizationRole,
) =>
  logOperation(
    "document.finalizeUpload",
    { userId, organizationId },
    async () => {
      if (!can(role, PERMISSIONS.DOCUMENT_UPLOAD)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to upload documents",
        });
      }
      if (!input.key.startsWith(`documents/${organizationId}/${userId}/`)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Upload does not belong to this user and workspace",
        });
      }

      const object = await s3Client
        .send(new HeadObjectCommand({ Bucket: BUCKET, Key: input.key }))
        .catch((error: unknown) => {
          if (
            error instanceof S3ServiceException &&
            error.$metadata.httpStatusCode === 404
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Uploaded document was not found",
              cause: error,
            });
          }
          throw error;
        });

      const size = object.ContentLength;
      if (
        size === undefined ||
        size <= 0 ||
        size >= 20 * 1024 * 1024 ||
        size !== input.fileSize ||
        object.ContentType !== input.mimeType
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uploaded document size or content type does not match",
        });
      }

      return createDocumentAttachment({
        organizationId,
        key: input.key,
        name: input.name,
        type: "DOCUMENT",
        mimeType: object.ContentType,
        fileSize: size,
        source: `s3://${BUCKET}/${input.key}`,
      });
    },
  );
