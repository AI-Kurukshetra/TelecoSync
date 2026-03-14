export type AppPermission = `${string}:${string}`;

export function assertPermission(
  permissions: AppPermission[],
  required: AppPermission
) {
  if (!permissions.includes(required)) {
    throw new Error(`Missing permission: ${required}`);
  }
}
