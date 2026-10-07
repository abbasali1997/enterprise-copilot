export enum PERMISSIONS {
  ORGANIZATION_MANAGE = "organization:manage",

  MEMBER_INVITE = "member:invite",
  MEMBER_REMOVE = "member:remove",

  DOCUMENT_READ = "document:read",
  DOCUMENT_UPLOAD = "document:upload",
  DOCUMENT_DELETE = "document:delete",

  ASSISTANT_CREATE = "assistant:create",

  CHAT_USE = "chat:use",
}

export const rolePermissions = {
  OWNER: [
    "organization:manage",
    "member:invite",
    "member:remove",
    "document:read",
    "document:upload",
    "document:delete",
    "assistant:create",
    "chat:use",
  ],

  ADMIN: [
    "member:invite",
    "document:read",
    "document:upload",
    "document:delete",
    "assistant:create",
    "chat:use",
  ],

  MEMBER: ["document:read", "chat:use"],
} as const;
