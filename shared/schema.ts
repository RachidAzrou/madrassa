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

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true
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
