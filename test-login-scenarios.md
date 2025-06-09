# RBAC Test Scenarios - myMadrassa Platform

## Test Accounts Created
- **Admin**: admin@mymadrassa.nl (existing)
- **Secretariat**: secretariat@mymadrassa.nl 
- **Teacher**: teacher@mymadrassa.nl
- **Guardian**: guardian@mymadrassa.nl
- **Student**: student@mymadrassa.nl
- **Password**: test123 (for all test accounts)

## Test Scenarios to Validate

### 1. Admin Role Tests
- Login with admin@mymadrassa.nl
- Verify access to all dashboard sections
- Test student management (create, edit, delete)
- Test teacher management
- Test guardian management
- Test system settings access
- Test academic year management
- Test financial overview

### 2. Secretariat Role Tests
- Login with secretariat@mymadrassa.nl
- Verify secretariat dashboard loads
- Test student enrollment management
- Test guardian relationship management
- Test communication tools
- Test payment overview (read-only)
- Verify restricted access to teacher management
- Test appointments and tasks management

### 3. Teacher Role Tests
- Login with teacher@mymadrassa.nl
- Verify teacher dashboard loads
- Test class attendance management
- Test grade entry for assigned subjects
- Test student communication
- Verify restricted access to other students
- Test schedule viewing
- Test report generation for own classes

### 4. Guardian Role Tests
- Login with guardian@mymadrassa.nl
- Verify guardian dashboard loads
- Test viewing own children's data
- Test payment history viewing
- Test communication with teachers
- Test attendance viewing for own children
- Verify restricted access to other students' data

### 5. Student Role Tests
- Login with student@mymadrassa.nl
- Verify student dashboard loads
- Test viewing own grades
- Test viewing own attendance
- Test schedule viewing
- Test communication with teachers
- Verify restricted access to other students' data

## Integration Points to Test

### Navigation Restrictions
- Each role should only see permitted menu items
- Direct URL access should be blocked for unauthorized pages
- Dashboard widgets should be role-appropriate

### Communication Matrix
- Admin can message all roles
- Secretariat can message admin, teachers, guardians
- Teachers can message admin, secretariat, guardians, assigned students
- Guardians can message admin, secretariat, their children's teachers
- Students can message admin, secretariat, their teachers

### Data Access Boundaries
- Users should only see data they're authorized to access
- API endpoints should enforce role-based filtering
- Database queries should be properly scoped

### Action Permissions
- Create, edit, delete operations should respect role permissions
- Bulk operations should be restricted appropriately
- System configuration changes should be admin-only