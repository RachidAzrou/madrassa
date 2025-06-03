// Role-Based Access Control (RBAC) System
export type UserRole = 'student' | 'teacher' | 'guardian' | 'secretariat' | 'admin';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Define all available resources in the system
export const RESOURCES = {
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  GUARDIANS: 'guardians',
  CLASSES: 'classes',
  PROGRAMS: 'programs',
  ACADEMIC_YEARS: 'academic_years',
  ENROLLMENTS: 'enrollments',
  RE_ENROLLMENTS: 're_enrollments',
  ACCOUNTS: 'accounts',
  PAYMENTS: 'payments',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
  NOTIFICATIONS: 'notifications'
} as const;

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions[] = [
  // ADMIN - Full access to everything
  {
    role: 'admin',
    permissions: [
      { resource: RESOURCES.STUDENTS, action: 'manage' },
      { resource: RESOURCES.TEACHERS, action: 'manage' },
      { resource: RESOURCES.GUARDIANS, action: 'manage' },
      { resource: RESOURCES.CLASSES, action: 'manage' },
      { resource: RESOURCES.PROGRAMS, action: 'manage' },
      { resource: RESOURCES.ACADEMIC_YEARS, action: 'manage' },
      { resource: RESOURCES.ENROLLMENTS, action: 'manage' },
      { resource: RESOURCES.RE_ENROLLMENTS, action: 'manage' },
      { resource: RESOURCES.ACCOUNTS, action: 'manage' },
      { resource: RESOURCES.PAYMENTS, action: 'manage' },
      { resource: RESOURCES.ATTENDANCE, action: 'manage' },
      { resource: RESOURCES.GRADES, action: 'manage' },
      { resource: RESOURCES.REPORTS, action: 'manage' },
      { resource: RESOURCES.SETTINGS, action: 'manage' },
      { resource: RESOURCES.DASHBOARD, action: 'manage' },
      { resource: RESOURCES.NOTIFICATIONS, action: 'manage' }
    ]
  },
  // SECRETARIAT - Administrative access
  {
    role: 'secretariat',
    permissions: [
      { resource: RESOURCES.STUDENTS, action: 'manage' },
      { resource: RESOURCES.GUARDIANS, action: 'manage' },
      { resource: RESOURCES.CLASSES, action: 'read' },
      { resource: RESOURCES.PROGRAMS, action: 'read' },
      { resource: RESOURCES.ENROLLMENTS, action: 'manage' },
      { resource: RESOURCES.RE_ENROLLMENTS, action: 'manage' },
      { resource: RESOURCES.PAYMENTS, action: 'manage' },
      { resource: RESOURCES.ATTENDANCE, action: 'read' },
      { resource: RESOURCES.REPORTS, action: 'read' },
      { resource: RESOURCES.DASHBOARD, action: 'read' },
      { resource: RESOURCES.NOTIFICATIONS, action: 'read' }
    ]
  },
  // TEACHER - Educational access
  {
    role: 'teacher',
    permissions: [
      { resource: RESOURCES.STUDENTS, action: 'read' }, // Own students only
      { resource: RESOURCES.CLASSES, action: 'read' }, // Own classes only
      { resource: RESOURCES.GUARDIANS, action: 'read' }, // Own students' guardians only
      { resource: RESOURCES.ATTENDANCE, action: 'manage' }, // Own classes only
      { resource: RESOURCES.GRADES, action: 'manage' }, // Own subjects only
      { resource: RESOURCES.REPORTS, action: 'manage' }, // Own students only
      { resource: RESOURCES.DASHBOARD, action: 'read' },
      { resource: RESOURCES.NOTIFICATIONS, action: 'read' }
    ]
  },
  // GUARDIAN - Limited access to own children
  {
    role: 'guardian',
    permissions: [
      { resource: RESOURCES.STUDENTS, action: 'read' }, // Only own children
      { resource: RESOURCES.PAYMENTS, action: 'read' }, // Only own payments
      { resource: RESOURCES.ATTENDANCE, action: 'read' }, // Only own children
      { resource: RESOURCES.GRADES, action: 'read' }, // Only own children
      { resource: RESOURCES.DASHBOARD, action: 'read' },
      { resource: RESOURCES.NOTIFICATIONS, action: 'read' }
    ]
  },
  // STUDENT - Very limited access
  {
    role: 'student',
    permissions: [
      { resource: RESOURCES.ATTENDANCE, action: 'read' }, // Only own attendance
      { resource: RESOURCES.GRADES, action: 'read' }, // Only own grades
      { resource: RESOURCES.DASHBOARD, action: 'read' },
      { resource: RESOURCES.NOTIFICATIONS, action: 'read' }
    ]
  }
];

// Helper functions for permission checking
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === userRole);
  if (!rolePermissions) return false;

  return rolePermissions.permissions.some(permission => 
    permission.resource === resource && 
    (permission.action === 'manage' || permission.action === action)
  );
}

export function canManage(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'manage');
}

export function canCreate(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'create') || hasPermission(userRole, resource, 'manage');
}

export function canRead(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'read') || hasPermission(userRole, resource, 'manage');
}

export function canUpdate(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'update') || hasPermission(userRole, resource, 'manage');
}

export function canDelete(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'delete') || hasPermission(userRole, resource, 'manage');
}

// Get all permissions for a role
export function getRolePermissions(userRole: UserRole): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === userRole);
  return rolePermissions ? rolePermissions.permissions : [];
}

// Check if user is admin
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

// Check if user has administrative privileges (admin or secretariat)
export function hasAdministrativeAccess(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'secretariat';
}

// Check if user can access management features
export function canAccessManagement(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'secretariat';
}