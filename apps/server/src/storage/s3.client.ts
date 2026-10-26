import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
  throw new Error(
    "S3_ACCESS_KEY and S3_SECRET_KEY must be configured together",
  );
}

export const s3Client = new S3Client({
  region: "eu-central-1",
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
    : {}),
});

// Presign against the browser-accessible endpoint; never rewrite a signed hostname.
export const s3PresigningClient = new S3Client({
  region: "eu-central-1",
  ...((process.env.S3_PUBLIC_ENDPOINT || endpoint)
    ? { endpoint: process.env.S3_PUBLIC_ENDPOINT || endpoint, forcePathStyle: true }
    : {}),
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
    : {}),
  // The file is sent later by the browser, so no body checksum can be calculated here.
  requestChecksumCalculation: "WHEN_REQUIRED",
});
