import type { OrganizationRole } from "./roles.js";

export const PERMISSIONS = {
  // =========================================================
  // Organization
  // =========================================================

  ORGANIZATION_VIEW: "organization:view",
  ORGANIZATION_MANAGE: "organization:manage",
  ORGANIZATION_UPDATE: "organization:update",
  ORGANIZATION_DELETE: "organization:delete",

  ORGANIZATION_SETTINGS_VIEW: "organization_settings:view",
  ORGANIZATION_SETTINGS_UPDATE: "organization_settings:update",

  // =========================================================
  // Members
  // =========================================================

  MEMBER_VIEW: "member:view",
  MEMBER_INVITE: "member:invite",
  MEMBER_UPDATE: "member:update",
  MEMBER_SUSPEND: "member:suspend",
  MEMBER_REACTIVATE: "member:reactivate",
  MEMBER_REMOVE: "member:remove",

  MEMBER_ROLE_UPDATE: "member_role:update",

  MEMBER_INVITATION_VIEW: "member_invitation:view",
  MEMBER_INVITATION_REVOKE: "member_invitation:revoke",
  MEMBER_INVITATION_RESEND: "member_invitation:resend",

  // =========================================================
  // Groups / Teams
  // =========================================================

  GROUP_VIEW: "group:view",
  GROUP_CREATE: "group:create",
  GROUP_UPDATE: "group:update",
  GROUP_DELETE: "group:delete",

  GROUP_MEMBER_VIEW: "group_member:view",
  GROUP_MEMBER_ADD: "group_member:add",
  GROUP_MEMBER_REMOVE: "group_member:remove",

  // =========================================================
  // Documents / Knowledge Base
  // =========================================================

  DOCUMENT_VIEW: "document:view",
  DOCUMENT_READ: "document:read",
  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",

  DOCUMENT_DOWNLOAD: "document:download",

  DOCUMENT_PERMISSION_VIEW: "document_permission:view",
  DOCUMENT_PERMISSION_UPDATE: "document_permission:update",

  DOCUMENT_REINDEX: "document:reindex",

  KNOWLEDGE_BASE_VIEW: "knowledge_base:view",
  KNOWLEDGE_BASE_MANAGE: "knowledge_base:manage",

  // =========================================================
  // Conversations / Chat
  // =========================================================

  CHAT_USE: "chat:use",

  CONVERSATION_CREATE: "conversation:create",
  CONVERSATION_READ_OWN: "conversation:read_own",
  CONVERSATION_UPDATE_OWN: "conversation:update_own",
  CONVERSATION_DELETE_OWN: "conversation:delete_own",

  CONVERSATION_READ_ALL: "conversation:read_all",
  CONVERSATION_DELETE_ALL: "conversation:delete_all",

  // =========================================================
  // Assistants
  // =========================================================

  ASSISTANT_VIEW: "assistant:view",
  ASSISTANT_USE: "assistant:use",

  ASSISTANT_CREATE: "assistant:create",
  ASSISTANT_UPDATE: "assistant:update",
  ASSISTANT_DELETE: "assistant:delete",

  ASSISTANT_PERMISSION_VIEW: "assistant_permission:view",
  ASSISTANT_PERMISSION_UPDATE: "assistant_permission:update",

  ASSISTANT_PUBLISH: "assistant:publish",

  // =========================================================
  // LLM / Models
  // =========================================================

  MODEL_VIEW: "model:view",
  MODEL_USE: "model:use",

  MODEL_SETTINGS_VIEW: "model_settings:view",
  MODEL_SETTINGS_UPDATE: "model_settings:update",

  MODEL_PROVIDER_MANAGE: "model_provider:manage",

  // =========================================================
  // Tools / MCP
  // =========================================================

  TOOL_VIEW: "tool:view",
  TOOL_USE: "tool:use",

  TOOL_CREATE: "tool:create",
  TOOL_UPDATE: "tool:update",
  TOOL_DELETE: "tool:delete",

  TOOL_PERMISSION_VIEW: "tool_permission:view",
  TOOL_PERMISSION_UPDATE: "tool_permission:update",

  MCP_SERVER_VIEW: "mcp_server:view",
  MCP_SERVER_CREATE: "mcp_server:create",
  MCP_SERVER_UPDATE: "mcp_server:update",
  MCP_SERVER_DELETE: "mcp_server:delete",

  MCP_TOOL_USE: "mcp_tool:use",

  // =========================================================
  // Human Approval / Actions
  // =========================================================

  APPROVAL_VIEW_OWN: "approval:view_own",
  APPROVAL_VIEW_ALL: "approval:view_all",

  APPROVAL_REQUEST: "approval:request",
  APPROVAL_APPROVE: "approval:approve",
  APPROVAL_REJECT: "approval:reject",

  ACTION_EXECUTE: "action:execute",

  // =========================================================
  // Integrations
  // =========================================================

  INTEGRATION_VIEW: "integration:view",
  INTEGRATION_CREATE: "integration:create",
  INTEGRATION_UPDATE: "integration:update",
  INTEGRATION_DELETE: "integration:delete",

  INTEGRATION_CONNECT: "integration:connect",
  INTEGRATION_DISCONNECT: "integration:disconnect",

  INTEGRATION_SYNC: "integration:sync",

  // =========================================================
  // API Keys
  // =========================================================

  API_KEY_VIEW: "api_key:view",
  API_KEY_CREATE: "api_key:create",
  API_KEY_REVOKE: "api_key:revoke",

  // =========================================================
  // Usage / Cost
  // =========================================================

  USAGE_VIEW_OWN: "usage:view_own",
  USAGE_VIEW_ORGANIZATION: "usage:view_organization",

  COST_VIEW: "cost:view",

  USAGE_LIMIT_VIEW: "usage_limit:view",
  USAGE_LIMIT_UPDATE: "usage_limit:update",

  // =========================================================
  // Audit Logs
  // =========================================================

  AUDIT_LOG_VIEW: "audit_log:view",
  AUDIT_LOG_EXPORT: "audit_log:export",

  // =========================================================
  // Analytics
  // =========================================================

  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // =========================================================
  // Jobs / Background Processing
  // =========================================================

  JOB_VIEW: "job:view",
  JOB_RETRY: "job:retry",
  JOB_CANCEL: "job:cancel",

  // =========================================================
  // Security
  // =========================================================

  SECURITY_SETTINGS_VIEW: "security_settings:view",
  SECURITY_SETTINGS_UPDATE: "security_settings:update",

  RATE_LIMIT_VIEW: "rate_limit:view",
  RATE_LIMIT_UPDATE: "rate_limit:update",

  // =========================================================
  // Data Management
  // =========================================================

  DATA_EXPORT: "data:export",
  DATA_DELETE: "data:delete",

  DATA_RETENTION_VIEW: "data_retention:view",
  DATA_RETENTION_UPDATE: "data_retention:update",

  // =========================================================
  // Admin
  // =========================================================

  ADMIN_DASHBOARD_VIEW: "admin_dashboard:view",
  ADMIN_SYSTEM_MANAGE: "admin_system:manage",
} as const;

export type PERMISSIONS = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const rolePermissions = {
  OWNER: [
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_MANAGE,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.ORGANIZATION_DELETE,
    PERMISSIONS.ORGANIZATION_SETTINGS_VIEW,
    PERMISSIONS.ORGANIZATION_SETTINGS_UPDATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_UPDATE,
    PERMISSIONS.MEMBER_SUSPEND,
    PERMISSIONS.MEMBER_REACTIVATE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_ROLE_UPDATE,
    PERMISSIONS.MEMBER_INVITATION_VIEW,
    PERMISSIONS.MEMBER_INVITATION_REVOKE,
    PERMISSIONS.MEMBER_INVITATION_RESEND,
    PERMISSIONS.GROUP_VIEW,
    PERMISSIONS.GROUP_CREATE,
    PERMISSIONS.GROUP_UPDATE,
    PERMISSIONS.GROUP_DELETE,
    PERMISSIONS.GROUP_MEMBER_VIEW,
    PERMISSIONS.GROUP_MEMBER_ADD,
    PERMISSIONS.GROUP_MEMBER_REMOVE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_DOWNLOAD,
    PERMISSIONS.DOCUMENT_PERMISSION_VIEW,
    PERMISSIONS.DOCUMENT_PERMISSION_UPDATE,
    PERMISSIONS.DOCUMENT_REINDEX,
    PERMISSIONS.KNOWLEDGE_BASE_VIEW,
    PERMISSIONS.KNOWLEDGE_BASE_MANAGE,
    PERMISSIONS.CHAT_USE,
    PERMISSIONS.CONVERSATION_CREATE,
    PERMISSIONS.CONVERSATION_READ_OWN,
    PERMISSIONS.CONVERSATION_UPDATE_OWN,
    PERMISSIONS.CONVERSATION_DELETE_OWN,
    PERMISSIONS.CONVERSATION_READ_ALL,
    PERMISSIONS.CONVERSATION_DELETE_ALL,
    PERMISSIONS.ASSISTANT_VIEW,
    PERMISSIONS.ASSISTANT_USE,
    PERMISSIONS.ASSISTANT_CREATE,
    PERMISSIONS.ASSISTANT_UPDATE,
    PERMISSIONS.ASSISTANT_DELETE,
    PERMISSIONS.ASSISTANT_PERMISSION_VIEW,
    PERMISSIONS.ASSISTANT_PERMISSION_UPDATE,
    PERMISSIONS.ASSISTANT_PUBLISH,
    PERMISSIONS.MODEL_VIEW,
    PERMISSIONS.MODEL_USE,
    PERMISSIONS.MODEL_SETTINGS_VIEW,
    PERMISSIONS.MODEL_SETTINGS_UPDATE,
    PERMISSIONS.MODEL_PROVIDER_MANAGE,
    PERMISSIONS.TOOL_VIEW,
    PERMISSIONS.TOOL_USE,
    PERMISSIONS.TOOL_CREATE,
    PERMISSIONS.TOOL_UPDATE,
    PERMISSIONS.TOOL_DELETE,
    PERMISSIONS.TOOL_PERMISSION_VIEW,
    PERMISSIONS.TOOL_PERMISSION_UPDATE,
    PERMISSIONS.MCP_SERVER_VIEW,
    PERMISSIONS.MCP_SERVER_CREATE,
    PERMISSIONS.MCP_SERVER_UPDATE,
    PERMISSIONS.MCP_SERVER_DELETE,
    PERMISSIONS.MCP_TOOL_USE,
    PERMISSIONS.APPROVAL_VIEW_OWN,
    PERMISSIONS.APPROVAL_VIEW_ALL,
    PERMISSIONS.APPROVAL_REQUEST,
    PERMISSIONS.APPROVAL_APPROVE,
    PERMISSIONS.APPROVAL_REJECT,
    PERMISSIONS.ACTION_EXECUTE,
    PERMISSIONS.INTEGRATION_VIEW,
    PERMISSIONS.INTEGRATION_CREATE,
    PERMISSIONS.INTEGRATION_UPDATE,
    PERMISSIONS.INTEGRATION_DELETE,
    PERMISSIONS.INTEGRATION_CONNECT,
    PERMISSIONS.INTEGRATION_DISCONNECT,
    PERMISSIONS.INTEGRATION_SYNC,
    PERMISSIONS.API_KEY_VIEW,
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_REVOKE,
    PERMISSIONS.USAGE_VIEW_OWN,
    PERMISSIONS.USAGE_VIEW_ORGANIZATION,
    PERMISSIONS.COST_VIEW,
    PERMISSIONS.USAGE_LIMIT_VIEW,
    PERMISSIONS.USAGE_LIMIT_UPDATE,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.AUDIT_LOG_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_RETRY,
    PERMISSIONS.JOB_CANCEL,
    PERMISSIONS.SECURITY_SETTINGS_VIEW,
    PERMISSIONS.SECURITY_SETTINGS_UPDATE,
    PERMISSIONS.RATE_LIMIT_VIEW,
    PERMISSIONS.RATE_LIMIT_UPDATE,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.DATA_DELETE,
    PERMISSIONS.DATA_RETENTION_VIEW,
    PERMISSIONS.DATA_RETENTION_UPDATE,
    PERMISSIONS.ADMIN_DASHBOARD_VIEW,
    PERMISSIONS.ADMIN_SYSTEM_MANAGE,
  ],

  // Workspace administration; sensitive organization and system actions are owner-only.
  ADMIN: [
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.ORGANIZATION_SETTINGS_VIEW,
    PERMISSIONS.ORGANIZATION_SETTINGS_UPDATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_UPDATE,
    PERMISSIONS.MEMBER_SUSPEND,
    PERMISSIONS.MEMBER_REACTIVATE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_ROLE_UPDATE,
    PERMISSIONS.MEMBER_INVITATION_VIEW,
    PERMISSIONS.MEMBER_INVITATION_REVOKE,
    PERMISSIONS.MEMBER_INVITATION_RESEND,
    PERMISSIONS.GROUP_VIEW,
    PERMISSIONS.GROUP_CREATE,
    PERMISSIONS.GROUP_UPDATE,
    PERMISSIONS.GROUP_DELETE,
    PERMISSIONS.GROUP_MEMBER_VIEW,
    PERMISSIONS.GROUP_MEMBER_ADD,
    PERMISSIONS.GROUP_MEMBER_REMOVE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_DOWNLOAD,
    PERMISSIONS.DOCUMENT_PERMISSION_VIEW,
    PERMISSIONS.DOCUMENT_PERMISSION_UPDATE,
    PERMISSIONS.DOCUMENT_REINDEX,
    PERMISSIONS.KNOWLEDGE_BASE_VIEW,
    PERMISSIONS.KNOWLEDGE_BASE_MANAGE,
    PERMISSIONS.CHAT_USE,
    PERMISSIONS.CONVERSATION_CREATE,
    PERMISSIONS.CONVERSATION_READ_OWN,
    PERMISSIONS.CONVERSATION_UPDATE_OWN,
    PERMISSIONS.CONVERSATION_DELETE_OWN,
    PERMISSIONS.CONVERSATION_READ_ALL,
    PERMISSIONS.CONVERSATION_DELETE_ALL,
    PERMISSIONS.ASSISTANT_VIEW,
    PERMISSIONS.ASSISTANT_USE,
    PERMISSIONS.ASSISTANT_CREATE,
    PERMISSIONS.ASSISTANT_UPDATE,
    PERMISSIONS.ASSISTANT_DELETE,
    PERMISSIONS.ASSISTANT_PERMISSION_VIEW,
    PERMISSIONS.ASSISTANT_PERMISSION_UPDATE,
    PERMISSIONS.ASSISTANT_PUBLISH,
    PERMISSIONS.MODEL_VIEW,
    PERMISSIONS.MODEL_USE,
    PERMISSIONS.MODEL_SETTINGS_VIEW,
    PERMISSIONS.MODEL_SETTINGS_UPDATE,
    PERMISSIONS.TOOL_VIEW,
    PERMISSIONS.TOOL_USE,
    PERMISSIONS.TOOL_CREATE,
    PERMISSIONS.TOOL_UPDATE,
    PERMISSIONS.TOOL_DELETE,
    PERMISSIONS.TOOL_PERMISSION_VIEW,
    PERMISSIONS.TOOL_PERMISSION_UPDATE,
    PERMISSIONS.MCP_SERVER_VIEW,
    PERMISSIONS.MCP_SERVER_CREATE,
    PERMISSIONS.MCP_SERVER_UPDATE,
    PERMISSIONS.MCP_SERVER_DELETE,
    PERMISSIONS.MCP_TOOL_USE,
    PERMISSIONS.APPROVAL_VIEW_OWN,
    PERMISSIONS.APPROVAL_VIEW_ALL,
    PERMISSIONS.APPROVAL_REQUEST,
    PERMISSIONS.APPROVAL_APPROVE,
    PERMISSIONS.APPROVAL_REJECT,
    PERMISSIONS.ACTION_EXECUTE,
    PERMISSIONS.INTEGRATION_VIEW,
    PERMISSIONS.INTEGRATION_CREATE,
    PERMISSIONS.INTEGRATION_UPDATE,
    PERMISSIONS.INTEGRATION_DELETE,
    PERMISSIONS.INTEGRATION_CONNECT,
    PERMISSIONS.INTEGRATION_DISCONNECT,
    PERMISSIONS.INTEGRATION_SYNC,
    PERMISSIONS.USAGE_VIEW_OWN,
    PERMISSIONS.USAGE_VIEW_ORGANIZATION,
    PERMISSIONS.COST_VIEW,
    PERMISSIONS.USAGE_LIMIT_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.AUDIT_LOG_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_RETRY,
    PERMISSIONS.JOB_CANCEL,
    PERMISSIONS.SECURITY_SETTINGS_VIEW,
    PERMISSIONS.RATE_LIMIT_VIEW,
    PERMISSIONS.DATA_RETENTION_VIEW,
    PERMISSIONS.ADMIN_DASHBOARD_VIEW,
  ],

  MEMBER: [
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.CHAT_USE,
    PERMISSIONS.CONVERSATION_CREATE,
    PERMISSIONS.CONVERSATION_READ_OWN,
    PERMISSIONS.CONVERSATION_UPDATE_OWN,
    PERMISSIONS.CONVERSATION_DELETE_OWN,
    PERMISSIONS.ASSISTANT_VIEW,
    PERMISSIONS.ASSISTANT_USE,
    PERMISSIONS.TOOL_VIEW,
    PERMISSIONS.TOOL_USE,
    PERMISSIONS.USAGE_VIEW_OWN,
  ],
} as const satisfies Record<OrganizationRole, readonly PERMISSIONS[]>;
