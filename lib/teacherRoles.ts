import { UserRole } from '@/store/authStore';

export function getTeacherRoleNames(
  teacherRoles: { role: string }[] | string[] | undefined | null
): string[] {
  if (!teacherRoles) return [];
  return teacherRoles.map((r) => (typeof r === 'string' ? r : r.role));
}

export function isTeacherAdministrator(roles: string[]): boolean {
  return roles.includes('Administrator');
}

export function resolveAuthRoleFromTeacherRoles(
  teacherRoleNames: string[],
  username?: string
): UserRole {
  if (username === 'ayuhana' || isTeacherAdministrator(teacherRoleNames)) {
    return 'admin';
  }
  return 'teacher';
}
