export const ORGANIZATION_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
