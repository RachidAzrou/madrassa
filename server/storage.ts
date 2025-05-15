// Import de types uit schema
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
  type StudentGuardian, type InsertStudentGuardian
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
  getGradesByAssessment(assessmentType: number): Promise<Grade[]>;
  getGradesByStudentAndCourse(studentId: number, courseId: number): Promise<Grade[]>;
  batchCreateGrades(insertGrades: InsertGrade[]): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Fee operations
  getFees(): Promise<Fee[]>;
  getFee(id: number): Promise<Fee | undefined>;
  getFeesByStudent(studentId: number): Promise<Fee[]>;
  getFeesByStatus(status: string): Promise<Fee[]>;
  getFeesByDateRange(startDate: Date, endDate: Date): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: number, fee: Partial<Fee>): Promise<Fee | undefined>;
  deleteFee(id: number): Promise<boolean>;
  
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
  getStudentGroupEnrollmentsByGroup(groupId: number): Promise<StudentGroupEnrollment[]>;
  getStudentGroupEnrollmentsByStudent(studentId: number): Promise<StudentGroupEnrollment[]>;
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
  createExamination(examination: InsertExamination): Promise<Examination>;
  updateExamination(id: number, examination: Partial<Examination>): Promise<Examination | undefined>;
  deleteExamination(id: number): Promise<boolean>;
  
  // Guardian operations
  getGuardians(): Promise<Guardian[]>;
  getGuardian(id: number): Promise<Guardian | undefined>;
  getGuardianByEmail(email: string): Promise<Guardian | undefined>;
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
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

// Import de storage implementatie
import { storage } from './storage/index';

// Exporteer de storage interface en de storage instantie
export { storage };