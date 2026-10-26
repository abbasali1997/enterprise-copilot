export type CreateAttachmentInputType = {
  organizationId: string;
  key: string;
  name: string;
  type: "BINARY" | "IMAGE" | "DOCUMENT";
  mimeType: string;
  fileSize: number;
  source: string;
};
