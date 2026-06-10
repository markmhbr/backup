/**
 * Converts a role name (e.g., "Super Admin") into a URL-friendly slug (e.g., "super-admin").
 */
export const getRoleSlug = (role: string): string => {
  if (!role) return "";
  return role.toLowerCase().replace(/\s+/g, "-");
};
