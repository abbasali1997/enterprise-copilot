import { can, type OrganizationRole, PERMISSIONS } from "@enterprise/auth";
import { randomUUID } from "node:crypto";
import { documentQueue } from "@enterprise/worker/queues";
import {
  DeleteObjectCommand,
  GetObjectCommand,
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
import { BUCKET, s3Client, s3PresigningClient } from "@enterprise/storage";

import { errorDetails, logOperation } from "../utils/log-operation.js";
import { logger } from "../utils/logger.js";

import {
  createDocumentAttachment,
  getDocumentById,
  getDocumentList,
  updateManyDocuments,
} from "../repositories/document.repository.js";

const PRESIGNED_URL_EXPIRY_SECONDS = 5 * 60;

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
      const url = await getSignedUrl(s3PresigningClient, command, {
        expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
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
        expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
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

      let attachment: Awaited<ReturnType<typeof createDocumentAttachment>>;
      try {
        attachment = await createDocumentAttachment({
          organizationId,
          key: input.key,
          name: input.name,
          type: "DOCUMENT",
          mimeType: object.ContentType,
          fileSize: size,
          source: `s3://${BUCKET}/${input.key}`,
        });
      } catch (error) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: BUCKET, Key: input.key }),
          );
        } catch (cleanupError) {
          logger.error(
            JSON.stringify({
              operation: "document.finalizeUpload.cleanup",
              userId,
              organizationId,
              ...errorDetails(cleanupError),
            }),
            "Failed to delete upload after attachment creation failed",
          );
        }
        throw error;
      }

      try {
        await documentQueue.add(
          "finalize-upload",
          { documentId: attachment.id, userId, organizationId },
          { jobId: attachment.id },
        );
      } catch (error) {
        // Retain the upload: enqueue may have succeeded before a connection error.
        try {
          await updateManyDocuments({
            where: { id: attachment.id, organizationId, status: "UPLOADED" },
            data: { status: "FAILED" },
          });
        } catch (statusError) {
          logger.error(
            JSON.stringify({
              documentId: attachment.id,
              organizationId,
              ...errorDetails(statusError),
            }),
            "Failed to mark document enqueue as failed",
          );
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not start document processing",
          cause: error,
        });
      }

      return attachment;
    },
  );

export const viewUpload = async (
  id: string,
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.DOCUMENT_READ)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to read documents",
    });
  }

  const bucket = BUCKET;
  if (!bucket) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3_BUCKET must be configured before viewing",
    });
  }

  const attachment = await getDocumentById(id);
  if (!attachment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Uploaded document with id ${id} was not found`,
    });
  }

  if (attachment.organizationId !== organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Attachment does not belong to your organization",
    });
  }

  const { key } = attachment;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3PresigningClient, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });

  return {
    url,
    method: "GET" as const,
    bucket,
    key,
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  };
};

export const getDocuments = (
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.DOCUMENT_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to view documents",
    });
  }

  return getDocumentList(organizationId);
};
