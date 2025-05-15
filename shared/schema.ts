import { pgTable, text, serial, integer, boolean, date, timestamp, unique, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  programId: integer("program_id"),
  yearLevel: integer("year_level"),
  status: text("status").default("active"), // active, inactive, pending, graduated
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
});

// Maak een standaard schema maar omit ID (wordt gegenereerd door database)
const baseInsertStudentSchema = createInsertSchema(students).omit({
  id: true
});

// Pas het schema aan met aangepaste datumvalidatie
export const insertStudentSchema = baseInsertStudentSchema.extend({
  // Voeg uitgebreide validatie voor geboortedatum toe die zowel null als string toestaat
  dateOfBirth: z.union([
    z.string(),
    z.null(),
    z.date()
  ]).optional().transform(val => {
    if (!val) return null;
    if (val instanceof Date) return val;
    
    try {
      // Converteer string naar Date object
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.error('Invalid date format:', val);
    }
    
    return null;
  })
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Programs
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  duration: integer("duration").notNull(), // in years
  department: text("department").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  credits: integer("credits").notNull(),
  programId: integer("program_id"),
  instructor: text("instructor"),
  maxStudents: integer("max_students"),
  isActive: boolean("is_active").default(true),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Enrollments (connecting students to courses)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, dropped, completed
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.courseId),
  };
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Attendance
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late, excused
  notes: text("notes"),
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.courseId, table.date),
  };
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Grades
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // midterm, final, assignment, project, quiz
  assessmentName: text("assessment_name").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  weight: integer("weight").notNull(), // percentage weight in final grade
  date: date("date").notNull(),
  remark: text("remark"), // feedback or comments
  outOf: integer("out_of"), // alternative to maxScore for some assessment types
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true
});

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

// Assessment Types Schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(), // foreign key to courses
  name: text("name").notNull(), // Name of the assessment
  type: text("type").notNull(), // Type: midterm, final, assignment, project, quiz
  maxScore: integer("max_score").notNull(), // Maximum possible score
  weight: integer("weight").notNull(), // Percentage weight in final grade
  dueDate: date("due_date"), // When the assessment is due
  description: text("description"), // Optional description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// Calendar Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  type: text("type").notNull(), // academic, exam, holiday, meeting, other
  isAllDay: boolean("is_all_day").default(false),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Users (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // admin, teacher, staff
  isActive: boolean("is_active").default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Fees (betalingen)
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, partial, cancelled
  paymentMethod: text("payment_method"), // bank, cash, online, etc.
  academicYear: text("academic_year"),
  semester: text("semester"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeeSchema = createInsertSchema(fees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof fees.$inferSelect;

// StudentGroups (klassen)
export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Naam van de groep/klas
  academicYear: text("academic_year").notNull(), // Academisch jaar (bijv. "2024-2025")
  programId: integer("program_id"), // Gekoppeld aan een studierichting
  description: text("description"),
  courseId: integer("course_id"), // Optioneel gekoppeld aan een specifieke cursus
  instructor: text("instructor"), // Verantwoordelijke docent
  startDate: date("start_date"), 
  endDate: date("end_date"),
  maxCapacity: integer("max_capacity"),
  isActive: boolean("is_active").default(true),
});

export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({
  id: true
});

export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;

// StudentGroupEnrollments (koppeling tussen studenten en groepen)
export const studentGroupEnrollments = pgTable("student_group_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  groupId: integer("group_id").notNull(), // Verwijst naar student_groups.id
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, inactive, completed
  notes: text("notes"),
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.groupId),
  };
});

export const insertStudentGroupEnrollmentSchema = createInsertSchema(studentGroupEnrollments).omit({
  id: true
});

export type InsertStudentGroupEnrollment = z.infer<typeof insertStudentGroupEnrollmentSchema>;
export type StudentGroupEnrollment = typeof studentGroupEnrollments.$inferSelect;

// Lessons (lessen)
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  courseId: integer("course_id").notNull(),
  groupId: integer("group_id"), // Optioneel gekoppeld aan een studentengroep
  scheduledDate: timestamp("scheduled_date").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  instructor: text("instructor"),
  description: text("description"),
  lessonMaterials: text("lesson_materials"), // URL of verwijzing naar lesmateriaal
  status: text("status").default("scheduled"), // scheduled, completed, cancelled
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Examinations (examens)
export const examinations = pgTable("examinations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  courseId: integer("course_id").notNull(),
  assessmentId: integer("assessment_id"), // Gekoppeld aan de beoordelingsstructuur
  examDate: timestamp("exam_date").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  supervisor: text("supervisor"), // Toezichthouder
  maxScore: integer("max_score").notNull(),
  duration: integer("duration").notNull(), // Duur in minuten
  format: text("format").notNull(), // written, oral, practical, online
  instructions: text("instructions"), // Specifieke instructies
  status: text("status").default("scheduled"), // scheduled, in-progress, completed, cancelled
});

export const insertExaminationSchema = createInsertSchema(examinations).omit({
  id: true
});

export type InsertExamination = z.infer<typeof insertExaminationSchema>;
export type Examination = typeof examinations.$inferSelect;

// Guardians (ouders/verzorgers)
export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  relationship: text("relationship").notNull(), // parent, guardian, other
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  occupation: text("occupation"),
  isEmergencyContact: boolean("is_emergency_contact").default(false),
  notes: text("notes"),
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true
});

export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Guardian = typeof guardians.$inferSelect;

// StudentGuardians (koppeling tussen studenten en verzorgers)
export const studentGuardians = pgTable("student_guardians", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  guardianId: integer("guardian_id").notNull(),
  isPrimary: boolean("is_primary").default(false), // Primaire contactpersoon
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.guardianId),
  };
});

export const insertStudentGuardianSchema = createInsertSchema(studentGuardians).omit({
  id: true
});

export type InsertStudentGuardian = z.infer<typeof insertStudentGuardianSchema>;
export type StudentGuardian = typeof studentGuardians.$inferSelect;
