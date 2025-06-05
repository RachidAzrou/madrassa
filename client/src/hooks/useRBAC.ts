import { useAuth } from '@/hooks/useAuth';
import { 
  UserRole, 
  hasPermission, 
  canCreate, 
  canRead, 
  canUpdate, 
  canDelete, 
  canManage,
  isAdmin,
  hasAdministrativeAccess,
  canAccessManagement,
  RESOURCES 
} from '@shared/rbac';

export function useRBAC() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  return {
    // Basic permission checks
    hasPermission: (resource: string, action: string) => 
      userRole ? hasPermission(userRole, resource, action) : false,
    
    canCreate: (resource: string) => 
      userRole ? canCreate(userRole, resource) : false,
    
    canRead: (resource: string) => 
      userRole ? canRead(userRole, resource) : false,
    
    canUpdate: (resource: string) => 
      userRole ? canUpdate(userRole, resource) : false,
    
    canDelete: (resource: string) => 
      userRole ? canDelete(userRole, resource) : false,
    
    canManage: (resource: string) => 
      userRole ? canManage(userRole, resource) : false,

    // Role checks
    isAdmin: () => userRole ? isAdmin(userRole) : false,
    hasAdministrativeAccess: () => userRole ? hasAdministrativeAccess(userRole) : false,
    canAccessManagement: () => userRole ? canAccessManagement(userRole) : false,

    // Specific resource checks for common use cases
    students: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.STUDENTS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.STUDENTS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.STUDENTS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.STUDENTS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.STUDENTS) : false,
    },

    teachers: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.TEACHERS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.TEACHERS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.TEACHERS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.TEACHERS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.TEACHERS) : false,
    },

    guardians: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.GUARDIANS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.GUARDIANS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.GUARDIANS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.GUARDIANS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.GUARDIANS) : false,
    },

    accounts: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.ACCOUNTS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.ACCOUNTS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.ACCOUNTS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.ACCOUNTS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.ACCOUNTS) : false,
    },

    academicYears: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.ACADEMIC_YEARS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.ACADEMIC_YEARS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.ACADEMIC_YEARS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.ACADEMIC_YEARS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.ACADEMIC_YEARS) : false,
    },

    reEnrollments: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.RE_ENROLLMENTS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.RE_ENROLLMENTS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.RE_ENROLLMENTS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.RE_ENROLLMENTS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.RE_ENROLLMENTS) : false,
    },

    payments: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.PAYMENTS) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.PAYMENTS) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.PAYMENTS) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.PAYMENTS) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.PAYMENTS) : false,
    },

    attendance: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.ATTENDANCE) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.ATTENDANCE) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.ATTENDANCE) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.ATTENDANCE) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.ATTENDANCE) : false,
    },

    grades: {
      canCreate: () => userRole ? canCreate(userRole, RESOURCES.GRADES) : false,
      canRead: () => userRole ? canRead(userRole, RESOURCES.GRADES) : false,
      canUpdate: () => userRole ? canUpdate(userRole, RESOURCES.GRADES) : false,
      canDelete: () => userRole ? canDelete(userRole, RESOURCES.GRADES) : false,
      canManage: () => userRole ? canManage(userRole, RESOURCES.GRADES) : false,
    },

    // Current user info
    currentUser: user,
    currentRole: userRole,
    isAuthenticated: !!user,
  };
}