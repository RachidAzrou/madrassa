import { pgTable, text, serial, integer, boolean, date, timestamp, time, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("student"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

// Programs schema
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  duration: integer("duration"), // Duration in years
  departmentId: integer("department_id"),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true
});

// Students schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  studentId: text("student_id").notNull().unique(),
  programId: integer("program_id").notNull(),
  enrollmentYear: integer("enrollment_year").notNull(),
  currentYear: integer("current_year").notNull(),
  status: text("status").notNull().default("active"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  phone: text("phone"),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true
});

// Courses schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  credits: integer("credits").notNull(),
  programId: integer("program_id"),
  instructorId: integer("instructor_id"),
  capacity: integer("capacity").notNull(),
  enrolled: integer("enrolled").notNull().default(0),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true
});

// Course Enrollments schema
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  grade: text("grade"),
  finalScore: integer("final_score"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true
});

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  location: text("location"),
  eventType: text("event_type").notNull(),
  programId: integer("program_id"),
  courseId: integer("course_id"),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true
});

// Attendance schema
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late, excused
  remarks: text("remarks"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true
});

// Grades schema
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // midterm, assignment, project, final, etc.
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  date: date("date").notNull(),
  remarks: text("remarks"),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

// Extended schemas with validation for forms
export const studentFormSchema = insertStudentSchema.extend({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const courseFormSchema = insertCourseSchema.extend({
  name: z.string().min(3, "Course name is required"),
  code: z.string().min(2, "Course code is required"),
  credits: z.number().int().min(1, "Credits must be at least 1"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});

export const programFormSchema = insertProgramSchema.extend({
  name: z.string().min(3, "Program name is required"),
  code: z.string().min(2, "Program code is required"),
  duration: z.number().int().min(1, "Duration must be at least 1 year"),
});

export const eventFormSchema = insertEventSchema.extend({
  title: z.string().min(3, "Event title is required"),
  startDate: z.date(),
  endDate: z.date(),
});

export const attendanceFormSchema = insertAttendanceSchema.extend({
  date: z.date(),
  status: z.enum(["present", "absent", "late", "excused"]),
});

export const gradeFormSchema = insertGradeSchema.extend({
  assessmentType: z.string().min(1, "Assessment type is required"),
  score: z.number().int().min(0, "Score cannot be negative"),
  maxScore: z.number().int().min(1, "Maximum score must be at least 1"),
});

// Additional types for frontend components
export type StudentWithUser = Student & {
  user: User;
  program: Program;
};

export type CourseWithDetails = Course & {
  program: Program;
  instructor: User;
};

export type EnrollmentWithDetails = Enrollment & {
  student: StudentWithUser;
  course: CourseWithDetails;
};

export type AttendanceWithDetails = Attendance & {
  student: StudentWithUser;
  course: Course;
};

export type GradeWithDetails = Grade & {
  student: StudentWithUser;
  course: Course;
};
