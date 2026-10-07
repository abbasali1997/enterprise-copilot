import { PERMISSIONS, rolePermissions } from "./permissions.js";

import type { OrganizationRole } from "./roles.js";

export function can(role: OrganizationRole, permission: PERMISSIONS) {
  return (rolePermissions[role] as readonly string[]).includes(permission);
}
