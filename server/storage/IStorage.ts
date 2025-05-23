import { 
  type Student, type InsertStudent,
  type Program, type InsertProgram,
  type Course, type InsertCourse,
  type Enrollment, type InsertEnrollment,
  type Attendance, type InsertAttendance,
  type Grade, type InsertGrade,
  type Event, type InsertEvent,
  type User, type InsertUser,
  type Fee, type InsertFee,
  type Assessment, type InsertAssessment,
  type StudentGroup, type InsertStudentGroup,
  type StudentGroupEnrollment, type InsertStudentGroupEnrollment,
  type Lesson, type InsertLesson,
  type Examination, type InsertExamination,
  type Guardian, type InsertGuardian,
  type StudentGuardian, type InsertStudentGuardian,
  type StudentProgram, type InsertStudentProgram,
  type Teacher, type InsertTeacher,
  type TeacherAvailability, type InsertTeacherAvailability,
  type TeacherLanguage, type InsertTeacherLanguage,
  type TeacherCourseAssignment, type InsertTeacherCourseAssignment,
  type TeacherAttendance, type InsertTeacherAttendance,
  type BehaviorAssessment, type InsertBehaviorAssessment,
  type FeeSettings, type InsertFeeSettings,
  type FeeDiscount, type InsertFeeDiscount,
  type Notification, type InsertNotification
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Program operations
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<Program>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCoursesByProgram(programId: number): Promise<Course[]>;
  getCoursesByFilter(filter: { isActive?: boolean }): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Enrollment operations
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;

  // Attendance operations
  getAttendanceRecords(): Promise<Attendance[]>;
  getAttendanceRecord(id: number): Promise<Attendance | undefined>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByCourse(courseId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Assessment operations
  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByCourse(courseId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<Assessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Grade operations
  getGrades(): Promise<Grade[]>;
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByCourse(courseId: number): Promise<Grade[]>;
  getGradesByAssessment(assessmentId: number): Promise<Grade[]>;
  getGradesByStudentAndCourse(studentId: number, courseId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  batchCreateGrades(grades: InsertGrade[]): Promise<Grade[]>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Fee operations
  getFees(): Promise<Fee[]>;
  getFee(id: number): Promise<Fee | undefined>;
  getFeesByStudent(studentId: number): Promise<Fee[]>;
  getFeesByStatus(status: string): Promise<Fee[]>;
  getFeesByDateRange(startDate: Date, endDate: Date): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: number, fee: Partial<Fee>): Promise<Fee | undefined>;
  deleteFee(id: number): Promise<boolean>;
  getFeeStats(): Promise<{ 
    totalCollected: number; 
    pendingAmount: number; 
    totalStudents: number; 
    completionRate: number;
    overdueAmount: number;
    pendingInvoices: number;
  } | undefined>;
  getOutstandingDebts(): Promise<any[]>;
  
  // Fee Settings operations
  getFeeSettings(): Promise<FeeSettings[]>;
  getFeeSetting(id: number): Promise<FeeSettings | undefined>;
  getFeeSettingByAcademicYear(academicYear: string): Promise<FeeSettings | undefined>;
  createFeeSetting(setting: InsertFeeSettings): Promise<FeeSettings>;
  updateFeeSetting(id: number, setting: Partial<FeeSettings>): Promise<FeeSettings | undefined>;
  deleteFeeSetting(id: number): Promise<boolean>;
  
  // Fee Discount operations
  getFeeDiscounts(): Promise<FeeDiscount[]>;
  getFeeDiscount(id: number): Promise<FeeDiscount | undefined>;
  getFeeDiscountsByAcademicYear(academicYear: string): Promise<FeeDiscount[]>;
  createFeeDiscount(discount: InsertFeeDiscount): Promise<FeeDiscount>;
  updateFeeDiscount(id: number, discount: Partial<FeeDiscount>): Promise<FeeDiscount | undefined>;
  deleteFeeDiscount(id: number): Promise<boolean>;

  // Student Group operations
  getStudentGroups(): Promise<StudentGroup[]>;
  getStudentGroup(id: number): Promise<StudentGroup | undefined>;
  getStudentGroupsByProgram(programId: number): Promise<StudentGroup[]>;
  getStudentGroupsByCourse(courseId: number): Promise<StudentGroup[]>;
  getStudentGroupsByAcademicYear(academicYear: string): Promise<StudentGroup[]>;
  createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup>;
  updateStudentGroup(id: number, group: Partial<StudentGroup>): Promise<StudentGroup | undefined>;
  deleteStudentGroup(id: number): Promise<boolean>;

  // Student Group Enrollment operations
  getStudentGroupEnrollments(): Promise<StudentGroupEnrollment[]>;
  getStudentGroupEnrollment(id: number): Promise<StudentGroupEnrollment | undefined>;
  getStudentGroupEnrollmentsByStudent(studentId: number): Promise<StudentGroupEnrollment[]>;
  getStudentGroupEnrollmentsByGroup(groupId: number): Promise<StudentGroupEnrollment[]>;
  createStudentGroupEnrollment(enrollment: InsertStudentGroupEnrollment): Promise<StudentGroupEnrollment>;
  updateStudentGroupEnrollment(id: number, enrollment: Partial<StudentGroupEnrollment>): Promise<StudentGroupEnrollment | undefined>;
  deleteStudentGroupEnrollment(id: number): Promise<boolean>;
  
  // Lesson operations
  getLessons(): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  getLessonsByGroup(groupId: number): Promise<Lesson[]>;
  getLessonsByDateRange(startDate: Date, endDate: Date): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Examination operations
  getExaminations(): Promise<Examination[]>;
  getExamination(id: number): Promise<Examination | undefined>;
  getExaminationsByCourse(courseId: number): Promise<Examination[]>;
  getExaminationsByDateRange(startDate: Date, endDate: Date): Promise<Examination[]>;
  getExaminationsByAssessment(assessmentId: number): Promise<Examination[]>;
  createExamination(examination: InsertExamination): Promise<Examination>;
  updateExamination(id: number, examination: Partial<Examination>): Promise<Examination | undefined>;
  deleteExamination(id: number): Promise<boolean>;
  
  // Guardian operations
  getGuardians(): Promise<Guardian[]>;
  getGuardian(id: number): Promise<Guardian | undefined>;
  getGuardianByEmail(email: string): Promise<Guardian | undefined>;
  getGuardiansByStudent(studentId: number): Promise<Guardian[]>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  updateGuardian(id: number, guardian: Partial<Guardian>): Promise<Guardian | undefined>;
  deleteGuardian(id: number): Promise<boolean>;
  
  // Student Guardian operations
  getStudentGuardians(): Promise<StudentGuardian[]>;
  getStudentGuardian(id: number): Promise<StudentGuardian | undefined>;
  getStudentGuardiansByStudent(studentId: number): Promise<StudentGuardian[]>;
  getStudentGuardiansByGuardian(guardianId: number): Promise<StudentGuardian[]>;
  createStudentGuardian(relation: InsertStudentGuardian): Promise<StudentGuardian>;
  updateStudentGuardian(id: number, relation: Partial<StudentGuardian>): Promise<StudentGuardian | undefined>;
  deleteStudentGuardian(id: number): Promise<boolean>;
  
  // Student Program operations
  getStudentPrograms(): Promise<StudentProgram[]>;
  getStudentProgram(id: number): Promise<StudentProgram | undefined>;
  getStudentProgramsByStudent(studentId: number): Promise<StudentProgram[]>;
  getStudentProgramsByProgram(programId: number): Promise<StudentProgram[]>;
  createStudentProgram(studentProgram: InsertStudentProgram): Promise<StudentProgram>;
  updateStudentProgram(id: number, studentProgram: Partial<StudentProgram>): Promise<StudentProgram | undefined>;
  deleteStudentProgram(id: number): Promise<boolean>;
  getPrimaryProgramByStudent(studentId: number): Promise<StudentProgram | undefined>;
  
  // Teacher operations
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<Teacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;
  
  // Teacher Availability operations
  getTeacherAvailabilities(): Promise<TeacherAvailability[]>;
  getTeacherAvailability(id: number): Promise<TeacherAvailability | undefined>;
  getTeacherAvailabilitiesByTeacher(teacherId: number): Promise<TeacherAvailability[]>;
  createTeacherAvailability(availability: InsertTeacherAvailability): Promise<TeacherAvailability>;
  updateTeacherAvailability(id: number, availability: Partial<TeacherAvailability>): Promise<TeacherAvailability | undefined>;
  deleteTeacherAvailability(id: number): Promise<boolean>;
  
  // Teacher Language operations
  getTeacherLanguages(): Promise<TeacherLanguage[]>;
  getTeacherLanguage(id: number): Promise<TeacherLanguage | undefined>;
  getTeacherLanguagesByTeacher(teacherId: number): Promise<TeacherLanguage[]>;
  createTeacherLanguage(language: InsertTeacherLanguage): Promise<TeacherLanguage>;
  updateTeacherLanguage(id: number, language: Partial<TeacherLanguage>): Promise<TeacherLanguage | undefined>;
  deleteTeacherLanguage(id: number): Promise<boolean>;
  
  // Teacher Course Assignment operations
  getTeacherCourseAssignments(): Promise<TeacherCourseAssignment[]>;
  getTeacherCourseAssignment(id: number): Promise<TeacherCourseAssignment | undefined>;
  getTeacherCourseAssignmentsByTeacher(teacherId: number): Promise<TeacherCourseAssignment[]>;
  getTeacherCourseAssignmentsByCourse(courseId: number): Promise<TeacherCourseAssignment[]>;
  createTeacherCourseAssignment(assignment: InsertTeacherCourseAssignment): Promise<TeacherCourseAssignment>;
  updateTeacherCourseAssignment(id: number, assignment: Partial<TeacherCourseAssignment>): Promise<TeacherCourseAssignment | undefined>;
  deleteTeacherCourseAssignment(id: number): Promise<boolean>;
  
  // Teacher Attendance operations
  getTeacherAttendanceRecords(): Promise<TeacherAttendance[]>;
  getTeacherAttendanceRecord(id: number): Promise<TeacherAttendance | undefined>;
  getTeacherAttendanceByTeacher(teacherId: number): Promise<TeacherAttendance[]>;
  getTeacherAttendanceByCourse(courseId: number): Promise<TeacherAttendance[]>;
  getTeacherAttendanceByDate(date: Date): Promise<TeacherAttendance[]>;
  createTeacherAttendance(attendance: InsertTeacherAttendance): Promise<TeacherAttendance>;
  updateTeacherAttendance(id: number, attendance: Partial<TeacherAttendance>): Promise<TeacherAttendance | undefined>;
  deleteTeacherAttendance(id: number): Promise<boolean>;
  
  // Enhanced Attendance operations (with teacher who recorded attendance)
  getAttendanceByTeacher(teacherId: number): Promise<Attendance[]>; // Attendance records created by this teacher
  getAttendanceByClassAndDate(courseId: number, date: Date): Promise<Attendance[]>; // All student attendance for a class on a specific date
  
  // Behavior Assessment operations
  getBehaviorAssessments(filter?: any): Promise<BehaviorAssessment[]>;
  getBehaviorAssessment(id: number): Promise<BehaviorAssessment | undefined>;
  getBehaviorAssessmentsByStudent(studentId: number): Promise<BehaviorAssessment[]>;
  getBehaviorAssessmentsByClass(classId: number): Promise<BehaviorAssessment[]>;
  createBehaviorAssessment(assessment: InsertBehaviorAssessment): Promise<BehaviorAssessment>;
  createBehaviorAssessments(assessments: InsertBehaviorAssessment[]): Promise<BehaviorAssessment[]>;
  updateBehaviorAssessment(id: number, assessment: Partial<BehaviorAssessment>): Promise<BehaviorAssessment | undefined>;
  deleteBehaviorAssessment(id: number): Promise<boolean>;
  
  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markNotificationAsUnread(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  deleteAllNotificationsForUser(userId: number): Promise<void>;
  
  // Health check operations
  checkHealth(): Promise<{ connected: boolean; timestamp?: string; error?: string }>;
}