export const PERMISSIONS = {
  ORGANIZATION_VIEW: "organization:view",
  ORGANIZATION_MANAGE: "organization:manage",

  MEMBER_INVITE: "member:invite",
  MEMBER_UPDATE: "member:update",
  MEMBER_REVOKE: "member:revoke",

  DOCUMENT_READ: "document:read",
  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_DELETE: "document:delete",

  ASSISTANT_CREATE: "assistant:create",

  CHAT_USE: "chat:use",
} as const;

export type PERMISSIONS = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const rolePermissions = {
  OWNER: [
    "organization:view",
    "organization:manage",
    "member:invite",
    "member:update",
    "member:revoke",
    "document:read",
    "document:upload",
    "document:delete",
    "assistant:create",
    "chat:use",
  ],

  ADMIN: [
    "organization:view",
    "member:invite",
    "member:update",
    "member:revoke",
    "document:read",
    "document:upload",
    "document:delete",
    "assistant:create",
    "chat:use",
  ],

  MEMBER: ["document:read", "chat:use"],
} as const;
