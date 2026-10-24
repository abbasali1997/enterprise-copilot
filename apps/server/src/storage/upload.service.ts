import {
  DeleteObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import {
  createAttachment,
  deleteAttachment,
  findAttachmentById,
} from "../repositories/attachment.repository.js";
import { s3Client } from "./s3.client.js";
import type { UploadInput, UploadResult } from "./storage.types.js";
import { TRPCError } from "@trpc/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const BUCKET = process.env.S3_BUCKET?.trim() ?? "enterprise-copilot";

/** Uploads to the configured bucket; an existing object at the same key is replaced. */
export const uploadToStorage = async (
  input: UploadInput,
): Promise<UploadResult> => {
  if (!input.key.trim() || Buffer.byteLength(input.key, "utf8") > 1024) {
    throw new Error("Upload key must contain 1 to 1024 UTF-8 bytes");
  }

  if (input.body == null) {
    throw new Error("Upload body is required");
  }

  if (
    input.contentLength !== undefined &&
    (!Number.isSafeInteger(input.contentLength) || input.contentLength < 0)
  ) {
    throw new Error("Content length must be a non-negative safe integer");
  }

  const bodySize = getBodySize(input.body);
  const fileSize = bodySize ?? input.contentLength;

  if (fileSize === undefined) {
    throw new Error("Content length is required for streaming uploads");
  }

  if (
    fileSize >= MAX_FILE_SIZE ||
    (input.contentLength ?? 0) >= MAX_FILE_SIZE
  ) {
    throw new Error(`File size must be below ${MAX_FILE_SIZE} bytes`);
  }

  const result = await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType ?? "application/octet-stream",
      ContentLength: input.contentLength,
      Metadata: input.metadata,
    }),
  );

  const mimeType = input.contentType ?? "application/octet-stream";
  const type = mimeType.startsWith("image/")
    ? "IMAGE"
    : mimeType.startsWith("text/") || mimeType === "application/pdf"
      ? "DOCUMENT"
      : "BINARY";

  const attachment = await createAttachment({
    key: input.key,
    name: input.name ?? input.key.split("/").filter(Boolean).pop() ?? input.key,
    type,
    mimeType,
    fileSize,
    source: `s3://${BUCKET}/${input.key}`,
  });

  return {
    attachmentId: attachment.id,
    bucket: BUCKET,
    key: input.key,
    etag: result.ETag,
    versionId: result.VersionId,
  };
};

export const deleteFromStorage = async (input: {
  attachmentId: string;
}): Promise<void> => {
  const attachment = await findAttachmentById(input.attachmentId);
  if (!attachment) {
    return;
  }

  // Preserve the exact object key, including spaces and URL-special characters.
  const location = /^s3:\/\/([^/]+)\/([\s\S]+)$/.exec(attachment.source);
  const bucket = location?.[1];
  const key = attachment.key;

  if (!bucket || !key || !key.trim() || Buffer.byteLength(key, "utf8") > 1024) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Attachment has an invalid S3 source",
    });
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  await deleteAttachment(attachment.id);
};

const getBodySize = (body: NonNullable<PutObjectCommandInput["Body"]>) =>
  typeof body === "string"
    ? Buffer.byteLength(body, "utf8")
    : body instanceof Uint8Array
      ? body.byteLength
      : body instanceof Blob
        ? body.size
        : undefined;
