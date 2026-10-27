import { randomUUID } from "node:crypto";
import { type Job } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { processJob } from "../process-job.js";
import { createWorker } from "./create-worker.js";
import type { FinalizeDocumentJob } from "../job-inputs.js";
import { prisma } from "@enterprise/db";
import { BUCKET, s3Client } from "@enterprise/storage";
import {
  GetObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddingGateway } from "../lib/llm.js";
import { logger } from "../utils/logger.js";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

const parseDocument = async (
  upload: GetObjectCommandOutput,
  documentId: string,
): Promise<ExtractedPage[]> => {
  if (!upload.Body) {
    throw new Error(`Document ${documentId} has no content in storage`);
  }

  const data = await upload.Body.transformToByteArray();

  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));
  } finally {
    await parser.destroy();
  }
};

const chunkText = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks = await splitter.splitText(text);

  return chunks
    .map((content, index) => ({
      index,
      content: content.trim(),
    }))
    .filter((chunk) => chunk.content.length > 0);
};

export const processDocumentJob = async (job: Job<FinalizeDocumentJob>) => {
  if (job.name !== "finalize-upload") return processJob(job);

  const { documentId, organizationId } = job.data;
  const attachment = await prisma.attachment.findFirst({
    where: { id: documentId, organizationId },
  });
  if (!attachment) throw new Error("Document not found in this organization");
  if (
    attachment.type !== "DOCUMENT" ||
    attachment.mimeType !== "application/pdf"
  ) {
    throw new Error(`Attachment ${documentId} is not a PDF document`);
  }

  await prisma.attachment.update({
    where: { id: documentId, organizationId },
    data: { status: "PROCESSING" },
  });

  try {
    if (!BUCKET) throw new Error("S3_BUCKET must be configured");
    const upload = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: attachment.key }),
    );
    const pages = await parseDocument(upload, documentId);

    const extractedChunks: Array<{
      pageNumber: number;
      chunkIndex: number;
      content: string;
      embedding: string;
    }> = [];

    for (const page of pages) {
      const chunks = await chunkText(page.text);
      for (const chunk of chunks) {
        const embedding = await embeddingGateway.embed({
          provider: "gemini",
          text: chunk.content,
          options: { type: "document", title: attachment.name },
        });
        extractedChunks.push({
          pageNumber: page.pageNumber,
          chunkIndex: chunk.index,
          content: chunk.content,
          embedding: JSON.stringify(embedding),
        });
      }
    }

    if (!extractedChunks.length) {
      throw new Error("Document contains no extractable text");
    }

    // Keep network requests outside the transaction. Replace chunks atomically on replay.
    await prisma.$transaction(async (tx) => {
      // Lock the attachment before replacing its chunks to serialize concurrent writes.
      await tx.attachment.update({
        where: { id: documentId, organizationId },
        data: { status: "PROCESSING" },
      });

      // Remove previous chunks that were saved after job failed
      await tx.documentChunk.deleteMany({ where: { documentId } });
      for (const chunk of extractedChunks) {
        await tx.$executeRaw`
          INSERT INTO "DocumentChunk"
            ("id", "documentId", "chunkIndex", "content", "pageNumber", "embedding", "modelName", "createdAt", "updatedAt")
          VALUES
            (${randomUUID()}, ${documentId}, ${chunk.chunkIndex}, ${chunk.content},
             ${chunk.pageNumber}, ${chunk.embedding}::vector, ${"gemini-embedding-2"}, NOW(), NOW())
        `;
      }

      await tx.attachment.update({
        where: { id: documentId, organizationId },
        data: { status: "READY" },
      });
    });
  } catch (error) {
    try {
      await prisma.attachment.updateMany({
        where: { id: documentId, organizationId, status: "PROCESSING" },
        data: { status: "FAILED" },
      });
    } catch (statusError) {
      logger.error(
        JSON.stringify({
          documentId,
          organizationId,
          errorType:
            statusError instanceof Error ? statusError.name : "UnknownError",
        }),
        "Failed to mark document processing as failed",
      );
    }
    throw error;
  }
};

export const documentWorker = createWorker(
  QUEUE_NAMES.documents,
  processDocumentJob,
);
