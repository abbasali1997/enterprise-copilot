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
