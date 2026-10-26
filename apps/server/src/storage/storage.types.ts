import type { PutObjectCommandInput } from "@aws-sdk/client-s3";

export type UploadInput = {
  organizationId: string;
  name?: string;
  key: string;
  body: NonNullable<PutObjectCommandInput["Body"]>;
  contentType: ContentTypes[number];
  contentLength?: number;
  metadata?: Record<string, string>;
};

export type UploadResult = {
  attachmentId: string;
  bucket: string;
  key: string;
  etag?: string;
  versionId?: string;
};

type ContentTypes = ["application/pdf"];
