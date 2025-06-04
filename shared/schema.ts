import { pgTable, text, serial, integer, boolean, date, timestamp, unique, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(), // Maak email optioneel maar wel uniek
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"), // Terugzetten naar date type
  address: text("address"), // Oude adresveld (behouden voor compatibiliteit)
  street: text("street"),  // Nieuwe adresvelden
  houseNumber: text("house_number"),
  postalCode: text("postal_code"),
  city: text("city"),
  programId: integer("program_id"), // Behouden voor backward compatibiliteit
  yearLevel: integer("year_level"),
  status: text("status").default("active"), // active, inactive, pending, graduated
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"), // Notities over de student
  gender: text("gender"), // man of vrouw
  photoUrl: text("photo_url"), // URL naar de foto van de student
});

// Maak een standaard schema maar omit ID (wordt gegenereerd door database)
const baseInsertStudentSchema = createInsertSchema(students).omit({
  id: true
});

// Hulpfunctie voor alle datumvelden
const flexibleDateSchema = z.union([
  // Accepteer een valide date string
  z.string().transform(val => {
    if (!val || val === "") return null;
    
    // Controleer DD-MM-YYYY format en converteer
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
      const [day, month, year] = val.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Controleer YYYY-MM-DD format (HTML date input format)
    const date = new Date(val);
    if (!isNaN(date.getTime())) return date;
    
    return null;
  }),
  // Accepteer null
  z.null(),
  // Accepteer undefined
  z.undefined(),
  // Accepteer Date objecten
  z.date()
]).nullable().optional().catch(null);

// Hulpfunctie voor het omzetten van string naar integer of null
const flexibleIntegerSchema = z.union([
  z.string().transform(val => {
    if (!val || val === "") return null;
    const num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  }),
  z.number(),
  z.null(),
  z.undefined()
]).nullable().optional().catch(null);

// Pas het schema aan met aangepaste validatie
export const insertStudentSchema = baseInsertStudentSchema.extend({
  // Validatie voor alle datum velden
  dateOfBirth: flexibleDateSchema,
  enrollmentDate: flexibleDateSchema,
  yearLevel: flexibleIntegerSchema,
  programId: flexibleIntegerSchema
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Student Programma's (voor meerdere programma's per student)
export const studentPrograms = pgTable("student_programs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  programId: integer("program_id").notNull(),
  yearLevel: integer("year_level"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  isPrimary: boolean("is_primary").default(false), // Geeft aan of dit het hoofdprogramma is
  status: text("status").default("active"), // active, inactive, pending, graduated
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.programId),
  };
});

export const insertStudentProgramSchema = createInsertSchema(studentPrograms).omit({
  id: true
});

export type InsertStudentProgram = z.infer<typeof insertStudentProgramSchema>;
export type StudentProgram = typeof studentPrograms.$inferSelect;

// Programs
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  duration: integer("duration").notNull(), // in years
  department: text("department").notNull(),
  isActive: boolean("is_active").default(true),
  entryRequirements: text("entry_requirements"), // Instroomvereisten
  learningObjectives: text("learning_objectives"), // Leerdoelen
  competencies: text("competencies"), // Competenties
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// Program Teachers (Many-to-Many relationship)
export const programTeachers = pgTable("program_teachers", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false), // Hoofddocent voor dit vak
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.programId, table.teacherId),
  };
});

export const insertProgramTeacherSchema = createInsertSchema(programTeachers).omit({
  id: true,
  assignedAt: true
});

export type InsertProgramTeacher = z.infer<typeof insertProgramTeacherSchema>;
export type ProgramTeacher = typeof programTeachers.$inferSelect;

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
  // Nieuwe velden voor uitgebreide cursusinformatie
  learningObjectives: text("learning_objectives"), // Lesdoelen
  materials: text("materials"), // Benodigde lesmaterialen
  competencies: text("competencies"), // Eindcompetenties wat studenten moeten kunnen
  prerequisites: text("prerequisites"), // Voorwaarden voor deelname
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

// Attendance van studenten, bijgehouden door docenten
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id").notNull(), // Docent die de aanwezigheid bijhoudt
  date: date("date").notNull(),
  status: text("status").notNull(), // aanwezig, afwezig, te laat
  notes: text("notes"),
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.courseId, table.date),
  };
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true
});

// Attendance van docenten (hun eigen aanwezigheid)
export const teacherAttendance = pgTable("teacher_attendance", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(), // De docent waarvan de aanwezigheid wordt bijgehouden
  courseId: integer("course_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // aanwezig, afwezig, vervangen
  replacementTeacherId: integer("replacement_teacher_id"), // Indien vervangen, door welke docent
  notes: text("notes"),
}, (table) => {
  return {
    unq: unique().on(table.teacherId, table.courseId, table.date),
  };
});

export const insertTeacherAttendanceSchema = createInsertSchema(teacherAttendance).omit({
  id: true
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertTeacherAttendance = z.infer<typeof insertTeacherAttendanceSchema>;
export type TeacherAttendance = typeof teacherAttendance.$inferSelect;

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

// Behavior Assessments
export const behaviorAssessments = pgTable("behavior_assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(), // student_groups id
  date: date("date").notNull(),
  behaviorScore: integer("behavior_score").notNull(), // 1-5 score
  punctualityScore: integer("punctuality_score"), // 1-5 score (optional, calculated)
  remarks: text("remarks"), // feedback or comments
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBehaviorAssessmentSchema = createInsertSchema(behaviorAssessments).omit({
  id: true,
  createdAt: true
});

export type InsertBehaviorAssessment = z.infer<typeof insertBehaviorAssessmentSchema>;
export type BehaviorAssessment = typeof behaviorAssessments.$inferSelect;

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

// Schedule (lessenrooster)
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(), // Maandag, Dinsdag, etc.
  timeSlot: text("time_slot").notNull(), // 08:30-09:20
  startTime: text("start_time").notNull(), // 08:30
  endTime: text("end_time").notNull(), // 09:20
  className: text("class_name").notNull(), // 1A, 2B, etc.
  classId: integer("class_id"),
  subjectName: text("subject_name").notNull(), // Arabisch, Koran Studies, etc.
  subjectId: integer("subject_id"),
  teacherName: text("teacher_name").notNull(), // Ahmed Al-Mansouri
  teacherId: integer("teacher_id"),
  roomName: text("room_name").notNull(), // Lokaal A1
  roomId: integer("room_id"),
  type: text("type").default("regular"), // regular, exam, special
  status: text("status").default("active"), // active, cancelled, rescheduled
  notes: text("notes"),
  academicYear: text("academic_year").default("2024-2025"),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

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
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // Het originele bedrag voor korting
  discountId: integer("discount_id"), // Koppeling naar kortingsregel als die is toegepast
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Kortingsbedrag
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // Hoeveel er al betaald is (voor gedeeltelijke betalingen)
  status: text("status").notNull().default("niet betaald"), // niet betaald, betaald, te laat, gedeeltelijk betaald, geannuleerd
  paymentMethod: text("payment_method"), // bank, contant, online, etc.
  academicYear: text("academic_year"),
  semester: text("semester"),
  notes: text("notes"), // Notities over betaling
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Kortingsregels voor collegegeld
export const feeDiscounts = pgTable("fee_discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Naam van de korting (bijv. "Vroegboekkorting")
  description: text("description"), // Beschrijving van de korting
  discountType: text("discount_type").notNull(), // percentage, vast bedrag
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // Percentage of bedrag
  academicYear: text("academic_year").notNull(), // Voor welk academisch jaar geldt deze korting
  startDate: date("start_date"), // Vanaf wanneer is de korting geldig
  endDate: date("end_date"), // Tot wanneer is de korting geldig
  applicableToAll: boolean("applicable_to_all").default(false), // Geldt voor alle studenten
  minStudentsPerFamily: integer("min_students_per_family"), // Minimum aantal studenten per familie voor familiekorting
  isActive: boolean("is_active").default(true), // Is de korting actief
});

// Collegegeld instellingen
export const feeSettings = pgTable("fee_settings", {
  id: serial("id").primaryKey(),
  academicYear: text("academic_year").notNull().unique(), // Academisch jaar (bijv. "2025-2026")
  standardTuition: decimal("standard_tuition", { precision: 10, scale: 2 }).notNull(), // Standaard collegegeld
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }), // Inschrijfgeld voor nieuwe studenten
  materialsFee: decimal("materials_fee", { precision: 10, scale: 2 }), // Kosten voor lesmateriaal
  dueDate: date("due_date"), // Standaard vervaldatum voor facturen
  earlyPaymentDate: date("early_payment_date"), // Datum voor vroegboekkorting
  earlyPaymentDiscount: decimal("early_payment_discount", { precision: 10, scale: 2 }), // Bedrag vroegboekkorting
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }), // Kosten voor te late betaling
  notes: text("notes"), // Notities over collegegeld voor dit jaar
  isActive: boolean("is_active").default(true), // Is deze instelling actief
});

export const insertFeeSchema = createInsertSchema(fees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});





// Insert schema voor kortingen
export const insertFeeDiscountSchema = createInsertSchema(feeDiscounts).omit({
  id: true
});

export type InsertFeeDiscount = z.infer<typeof insertFeeDiscountSchema>;
export type FeeDiscount = typeof feeDiscounts.$inferSelect;

// Insert schema voor collegegeld instellingen
export const insertFeeSettingsSchema = createInsertSchema(feeSettings).omit({
  id: true
});

export type InsertFeeSettings = z.infer<typeof insertFeeSettingsSchema>;
export type FeeSettings = typeof feeSettings.$inferSelect;

// StudentGroups (klassen)
export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Naam van de groep/klas
  academicYear: text("academic_year").notNull(), // Academisch jaar (bijv. "2024-2025")
  programId: integer("program_id"), // Gekoppeld aan een studierichting
  description: text("description"),
  courseId: integer("course_id"), // Optioneel gekoppeld aan een specifieke cursus
  instructor: text("instructor"), // Verantwoordelijke docent
  location: text("location"), // Locatie waar de klas plaatsvindt
  prerequisites: text("prerequisites"), // Instroomvereisten voor de klas
  learningGoals: text("learning_goals"), // Leerdoelen van de klas
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
  address: text("address"), // Oude adresveld (behouden voor compatibiliteit)
  street: text("street"), // Nieuwe adresvelden
  houseNumber: text("house_number"),
  postalCode: text("postal_code"),
  city: text("city"),
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
  relationship: text("relationship"), // Relatie tussen student en voogd (ouder, verzorger, etc.)
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

// Relatiedefinities
// Dit zorgt ervoor dat Drizzle ORM de relaties tussen tabellen kan interpreteren

// Student relations
export const studentsRelations = relations(students, ({ many }) => ({
  studentPrograms: many(studentPrograms),
  enrollments: many(enrollments),
  studentGuardians: many(studentGuardians),
}));

// Student Programs relations
export const studentProgramsRelations = relations(studentPrograms, ({ one }) => ({
  student: one(students, {
    fields: [studentPrograms.studentId],
    references: [students.id],
  }),
  program: one(programs, {
    fields: [studentPrograms.programId],
    references: [programs.id],
  }),
}));

// Program relations
export const programsRelations = relations(programs, ({ many }) => ({
  courses: many(courses),
  studentPrograms: many(studentPrograms),
}));

// Student Guardian relations
export const studentGuardiansRelations = relations(studentGuardians, ({ one }) => ({
  student: one(students, {
    fields: [studentGuardians.studentId],
    references: [students.id],
  }),
  guardian: one(guardians, {
    fields: [studentGuardians.guardianId],
    references: [guardians.id],
  }),
}));

// Guardian relations
export const guardiansRelations = relations(guardians, ({ many }) => ({
  studentGuardians: many(studentGuardians),
  messages: many(messages, { relationName: "guardian_messages" }),
}));

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role").notNull(), // student, teacher, guardian, admin
  receiverId: integer("receiver_id").notNull(),
  receiverRole: text("receiver_role").notNull(), // student, teacher, guardian, admin
  title: text("title"),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false),
  attachmentUrl: text("attachment_url"),
  parentMessageId: integer("parent_message_id"), // Voor antwoorden/threads
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "message_sender"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "message_receiver"
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: "parent_message"
  })
}));

// Teachers
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  teacherId: text("teacher_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  street: text("street"),
  houseNumber: text("house_number"),
  postalCode: text("postal_code"),
  city: text("city"),
  specialty: text("specialty"), // Beroep/Specialisatie
  bio: text("bio"), // Biografie
  status: text("status").default("active"), // Status (active/inactive)
  photoUrl: text("photo_url"), // Foto URL
  educations: text("educations").array(), // Opleidingen als array
  languages: text("languages").array(), // Gesproken talen als array
  subjects: integer("subjects").array(), // Vakken IDs als array
  isActive: boolean("is_active").default(true),
  hireDate: date("hire_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

// Teacher Availability
export const teacherAvailability = pgTable("teacher_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = zondag, 1 = maandag, etc.
  startTime: text("start_time").notNull(), // format: "HH:MM"
  endTime: text("end_time").notNull(), // format: "HH:MM"
  isBackup: boolean("is_backup").default(false),
  notes: text("notes"),
});

export const insertTeacherAvailabilitySchema = createInsertSchema(teacherAvailability).omit({
  id: true
});

export type InsertTeacherAvailability = z.infer<typeof insertTeacherAvailabilitySchema>;
export type TeacherAvailability = typeof teacherAvailability.$inferSelect;

// Teacher Languages
export const teacherLanguages = pgTable("teacher_languages", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id),
  language: text("language").notNull(),
  proficiencyLevel: text("proficiency_level").notNull(), // beginner, intermediate, advanced, native
});

export const insertTeacherLanguageSchema = createInsertSchema(teacherLanguages).omit({
  id: true
});

export type InsertTeacherLanguage = z.infer<typeof insertTeacherLanguageSchema>;
export type TeacherLanguage = typeof teacherLanguages.$inferSelect;

// Teacher Course Assignments
export const teacherCourseAssignments = pgTable("teacher_course_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  isPrimary: boolean("is_primary").default(false),
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
});

export const insertTeacherCourseAssignmentSchema = createInsertSchema(teacherCourseAssignments).omit({
  id: true
});

export type InsertTeacherCourseAssignment = z.infer<typeof insertTeacherCourseAssignmentSchema>;
export type TeacherCourseAssignment = typeof teacherCourseAssignments.$inferSelect;

// Teacher relations
export const teachersRelations = relations(teachers, ({ many }) => ({
  availability: many(teacherAvailability),
  languages: many(teacherLanguages),
  courseAssignments: many(teacherCourseAssignments),
  attendance: many(teacherAttendance),
  studentAttendance: many(attendance, { relationName: "recordedAttendance" })
}));

export const teacherAvailabilityRelations = relations(teacherAvailability, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherAvailability.teacherId],
    references: [teachers.id],
  }),
}));

export const teacherLanguagesRelations = relations(teacherLanguages, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherLanguages.teacherId],
    references: [teachers.id],
  }),
}));

export const teacherCourseAssignmentsRelations = relations(teacherCourseAssignments, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherCourseAssignments.teacherId],
    references: [teachers.id],
  }),
  course: one(courses, {
    fields: [teacherCourseAssignments.courseId],
    references: [courses.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id]
  }),
  course: one(courses, {
    fields: [attendance.courseId],
    references: [courses.id]
  }),
  teacher: one(teachers, {
    fields: [attendance.teacherId],
    references: [teachers.id],
    relationName: "recordedAttendance"
  })
}));

export const teacherAttendanceRelations = relations(teacherAttendance, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherAttendance.teacherId],
    references: [teachers.id]
  }),
  course: one(courses, {
    fields: [teacherAttendance.courseId],
    references: [courses.id]
  }),
  replacementTeacher: one(teachers, {
    fields: [teacherAttendance.replacementTeacherId],
    references: [teachers.id],
    relationName: "replacements"
  })
}));

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  type: text("type").notNull(), // class, exam, meeting, event
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  courseName: text("course_name"),
  classId: integer("class_id").references(() => studentGroups.id),
  className: text("class_name"),
  teacherId: integer("teacher_id").references(() => teachers.id),
  teacherName: text("teacher_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Calendar Events Relations
export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  course: one(courses, {
    fields: [calendarEvents.courseId],
    references: [courses.id],
  }),
  class: one(studentGroups, {
    fields: [calendarEvents.classId],
    references: [studentGroups.id],
  }),
  teacher: one(teachers, {
    fields: [calendarEvents.teacherId],
    references: [teachers.id],
  }),
}));

// Notificaties
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, error, success
  isRead: boolean("is_read").default(false),
  link: text("link"), // Optional link to navigate to
  createdAt: timestamp("created_at").defaultNow(),
  category: text("category"), // e.g. 'student', 'fee', 'attendance', etc.
  relatedEntityId: integer("related_entity_id"), // ID of the related entity (optional)
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

// Lokalen (Rooms)
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(30),
  location: text("location").notNull(),
  status: text("status", { enum: ["available", "occupied", "reserved"] }).notNull().default("available"),
  currentUse: text("current_use"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Student Siblings (broer/zus relaties)
export const studentSiblings = pgTable("student_siblings", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  siblingId: integer("sibling_id").notNull().references(() => students.id),
  relationship: text("relationship").notNull().default("sibling"), // sibling, half-sibling, step-sibling
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.studentId, table.siblingId),
  };
});

export const insertStudentSiblingSchema = createInsertSchema(studentSiblings).omit({
  id: true,
  createdAt: true
});

export type InsertStudentSibling = z.infer<typeof insertStudentSiblingSchema>;
export type StudentSibling = typeof studentSiblings.$inferSelect;

// Academic Years (Schooljaren)
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "2024-2025"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  registrationStartDate: date("registration_start_date"), // Wanneer herinschrijving start
  registrationEndDate: date("registration_end_date"), // Wanneer herinschrijving eindigt
  finalReportDate: date("final_report_date"), // Eindrapport datum
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unqName: unique().on(table.name),
  };
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true
});

export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYears.$inferSelect;

// School Holidays (Schoolvakanties)
export const schoolHolidays = pgTable("school_holidays", {
  id: serial("id").primaryKey(),
  academicYearId: integer("academic_year_id").notNull().references(() => academicYears.id),
  name: text("name").notNull(), // e.g. "Kerstvakantie", "Paasvakantie"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  type: text("type").notNull().default("holiday"), // holiday, closure, exam_period
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSchoolHolidaySchema = createInsertSchema(schoolHolidays).omit({
  id: true,
  createdAt: true
});

export type InsertSchoolHoliday = z.infer<typeof insertSchoolHolidaySchema>;
export type SchoolHoliday = typeof schoolHolidays.$inferSelect;

// Academic Progress (Academische Voortgang)
export const academicProgress = pgTable("academic_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  academicYearId: integer("academic_year_id").notNull().references(() => academicYears.id),
  classId: integer("class_id").notNull().references(() => studentGroups.id),
  programId: integer("program_id").notNull().references(() => programs.id),
  finalGrade: decimal("final_grade", { precision: 4, scale: 2 }), // Eindcijfer
  averageGrade: decimal("average_grade", { precision: 4, scale: 2 }), // Gemiddeld cijfer
  attendancePercentage: decimal("attendance_percentage", { precision: 5, scale: 2 }), // Aanwezigheidspercentage
  isPassed: boolean("is_passed"), // Geslaagd of niet
  status: text("status").notNull().default("in_progress"), // in_progress, passed, failed, transferred
  promotionEligible: boolean("promotion_eligible").default(false), // Geschikt voor promotie
  notes: text("notes"), // Opmerkingen van docenten
  completedAt: timestamp("completed_at"), // Wanneer het jaar voltooid is
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unqStudentYear: unique().on(table.studentId, table.academicYearId),
  };
});

export const insertAcademicProgressSchema = createInsertSchema(academicProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertAcademicProgress = z.infer<typeof insertAcademicProgressSchema>;
export type AcademicProgress = typeof academicProgress.$inferSelect;

// Re-enrollments (Herinschrijvingen)
export const reEnrollments = pgTable("re_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  fromAcademicYearId: integer("from_academic_year_id").notNull().references(() => academicYears.id),
  toAcademicYearId: integer("to_academic_year_id").notNull().references(() => academicYears.id),
  fromClassId: integer("from_class_id").references(() => studentGroups.id),
  toClassId: integer("to_class_id").references(() => studentGroups.id),
  fromProgramId: integer("from_program_id").references(() => programs.id),
  toProgramId: integer("to_program_id").references(() => programs.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  isPromotion: boolean("is_promotion").default(true), // true = promotie, false = blijven zitten
  applicationDate: timestamp("application_date").defaultNow(),
  approvedBy: integer("approved_by").references(() => teachers.id),
  approvedAt: timestamp("approved_at"),
  rejectedReason: text("rejected_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReEnrollmentSchema = createInsertSchema(reEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  applicationDate: true
});

export type InsertReEnrollment = z.infer<typeof insertReEnrollmentSchema>;
export type ReEnrollment = typeof reEnrollments.$inferSelect;

// Relations voor de nieuwe tabellen
export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  schoolHolidays: many(schoolHolidays),
  academicProgress: many(academicProgress),
  reEnrollmentsFrom: many(reEnrollments, { relationName: "from_academic_year" }),
  reEnrollmentsTo: many(reEnrollments, { relationName: "to_academic_year" }),
}));

export const schoolHolidaysRelations = relations(schoolHolidays, ({ one }) => ({
  academicYear: one(academicYears, {
    fields: [schoolHolidays.academicYearId],
    references: [academicYears.id],
  }),
}));

export const academicProgressRelations = relations(academicProgress, ({ one }) => ({
  student: one(students, {
    fields: [academicProgress.studentId],
    references: [students.id],
  }),
  academicYear: one(academicYears, {
    fields: [academicProgress.academicYearId],
    references: [academicYears.id],
  }),
  class: one(studentGroups, {
    fields: [academicProgress.classId],
    references: [studentGroups.id],
  }),
  program: one(programs, {
    fields: [academicProgress.programId],
    references: [programs.id],
  }),
}));

export const reEnrollmentsRelations = relations(reEnrollments, ({ one }) => ({
  student: one(students, {
    fields: [reEnrollments.studentId],
    references: [students.id],
  }),
  fromAcademicYear: one(academicYears, {
    fields: [reEnrollments.fromAcademicYearId],
    references: [academicYears.id],
    relationName: "from_academic_year"
  }),
  toAcademicYear: one(academicYears, {
    fields: [reEnrollments.toAcademicYearId],
    references: [academicYears.id],
    relationName: "to_academic_year"
  }),
  fromClass: one(studentGroups, {
    fields: [reEnrollments.fromClassId],
    references: [studentGroups.id],
    relationName: "from_class"
  }),
  toClass: one(studentGroups, {
    fields: [reEnrollments.toClassId],
    references: [studentGroups.id],
    relationName: "to_class"
  }),
  fromProgram: one(programs, {
    fields: [reEnrollments.fromProgramId],
    references: [programs.id],
    relationName: "from_program"
  }),
  toProgram: one(programs, {
    fields: [reEnrollments.toProgramId],
    references: [programs.id],
    relationName: "to_program"
  }),
  approver: one(teachers, {
    fields: [reEnrollments.approvedBy],
    references: [teachers.id],
  }),
}));

// User Accounts (for RBAC authentication)
export const userAccounts = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  role: text("role").notNull(), // student, teacher, guardian, secretariat, admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Link to person records
  personId: integer("person_id").notNull(),
  personType: text("person_type").notNull(), // student, teacher, guardian
  // Additional fields for RBAC
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  // Profile fields
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  profileImageUrl: text("profile_image_url"),
});

export const insertUserAccountSchema = createInsertSchema(userAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type UserAccount = typeof userAccounts.$inferSelect;

// User Account Relations
export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
  student: one(students, {
    fields: [userAccounts.personId],
    references: [students.id],
    relationName: "studentAccount"
  }),
  teacher: one(teachers, {
    fields: [userAccounts.personId],
    references: [teachers.id],
    relationName: "teacherAccount"
  }),
  guardian: one(guardians, {
    fields: [userAccounts.personId],
    references: [guardians.id],
    relationName: "guardianAccount"
  })
}));

// Mollie Payments (voor betalingsverwerking)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id), // Koppeling naar factuur
  studentId: integer("student_id").notNull().references(() => students.id),
  molliePaymentId: text("mollie_payment_id").unique(), // Mollie's payment ID
  stripePaymentId: text("stripe_payment_id"), // Stripe payment ID
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  description: text("description").notNull(),
  status: text("status").notNull().default("openstaand"), // openstaand, betaald, verwerking, mislukt, geannuleerd
  type: text("type").notNull(), // schoolgeld, boekenpakket, uitstap, examen, overig
  academicYear: text("academic_year"),
  semester: text("semester"),
  mollieStatus: text("mollie_status"), // Originele status van Mollie
  paymentMethod: text("payment_method"), // ideal, creditcard, bancontact, etc.
  checkoutUrl: text("checkout_url"), // URL waar student naartoe moet om te betalen
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  failureReason: text("failure_reason"), // Reden waarom betaling is mislukt
  webhookUrl: text("webhook_url"), // URL voor status updates van Mollie
  redirectUrl: text("redirect_url"), // URL waar student naartoe gaat na betaling
  metadata: text("metadata"), // JSON metadata voor Mollie
  notes: text("notes"),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facturen - Uitgebreid systeem voor alle soorten schoolbetalingen
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(), // Uniek factuurnummer met prefix
  studentId: integer("student_id").notNull().references(() => students.id),
  type: text("type").notNull(), // INS, MTR, TRP, COL (inschrijving, materiaal, uitstap, collegegeld)
  description: text("description").notNull(),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("open"), // open, paid, overdue, cancelled
  dueDate: date("due_date").notNull(),
  issueDate: date("issue_date").defaultNow(),
  paidDate: date("paid_date"),
  academicYear: text("academic_year").notNull(),
  semester: text("semester"),
  classId: integer("class_id"), // Voor klasgebonden facturen
  appliedDiscounts: text("applied_discounts").array(), // JSON array van toegepaste kortingen
  notes: text("notes"),
  remindersSent: integer("reminders_sent").default(0),
  lastReminderDate: date("last_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tarieventabel per academisch jaar
export const tuitionRates = pgTable("tuition_rates", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id),
  academicYear: text("academic_year").notNull(),
  type: text("type").notNull(), // COL, INS, MTR, TRP etc.
  name: text("name").notNull(), // Collegegeld, Inschrijfgeld, etc.
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.academicYear, table.type),
  };
});

// Insert schemas voor nieuwe tabellen
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTuitionRateSchema = createInsertSchema(tuitionRates).omit({
  id: true,
  createdAt: true
});

// Type exports
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertTuitionRate = z.infer<typeof insertTuitionRateSchema>;
export type TuitionRate = typeof tuitionRates.$inferSelect;

// Payment Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  payments: many(payments),
}));

export const tuitionRatesRelations = relations(tuitionRates, ({ one }) => ({
  program: one(programs, {
    fields: [tuitionRates.programId],
    references: [programs.id],
  }),
}));

// Tuition Fees (Collegegeld) - Standaard bedragen per schooljaar
export const tuitionFees = pgTable("tuition_fees", {
  id: serial("id").primaryKey(),
  academicYearId: integer("academic_year_id").notNull().references(() => academicYears.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.academicYearId),
  };
});

// Enhanced Discounts System - Nieuwe korting aanmaken functionaliteit
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // percentage of amount
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isAutomatic: boolean("is_automatic").default(false),
  rule: text("rule"), // Regel voor automatische toekenning
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discount Applications - Kortingen toekennen aan studenten
export const discountApplications = pgTable("discount_applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  discountId: integer("discount_id").notNull().references(() => discounts.id),
  applicationDate: date("application_date").notNull(),
  reason: text("reason"),
  appliedBy: integer("applied_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Kortingssysteem - Automatische en handmatige kortingen (legacy)
export const discountTypes = pgTable("discount_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  defaultPercentage: decimal("default_percentage", { precision: 5, scale: 2 }),
  isAutomatic: boolean("is_automatic").default(false),
  requiresProof: boolean("requires_proof").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentDiscounts = pgTable("student_discounts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  discountType: text("discount_type").notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  isAutomatic: boolean("is_automatic").default(false),
  proofDocument: text("proof_document"),
  appliedBy: integer("applied_by").references(() => users.id),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(true),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas voor nieuwe tabellen
export const insertTuitionFeeSchema = createInsertSchema(tuitionFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDiscountSchema = createInsertSchema(discounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDiscountApplicationSchema = createInsertSchema(discountApplications).omit({
  id: true,
  createdAt: true
});

// Insert schemas voor kortingen (legacy)
export const insertDiscountTypeSchema = createInsertSchema(discountTypes).omit({
  id: true,
  createdAt: true
});

export const insertStudentDiscountSchema = createInsertSchema(studentDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type exports voor nieuwe tabellen
export type InsertTuitionFee = z.infer<typeof insertTuitionFeeSchema>;
export type TuitionFee = typeof tuitionFees.$inferSelect;

export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Discount = typeof discounts.$inferSelect;

export type InsertDiscountApplication = z.infer<typeof insertDiscountApplicationSchema>;
export type DiscountApplication = typeof discountApplications.$inferSelect;

// Type exports voor kortingen (legacy)
export type InsertDiscountType = z.infer<typeof insertDiscountTypeSchema>;
export type DiscountType = typeof discountTypes.$inferSelect;

export type InsertStudentDiscount = z.infer<typeof insertStudentDiscountSchema>;
export type StudentDiscount = typeof studentDiscounts.$inferSelect;

// Korting Relations
export const studentDiscountsRelations = relations(studentDiscounts, ({ one }) => ({
  student: one(students, {
    fields: [studentDiscounts.studentId],
    references: [students.id],
  }),
  appliedByUser: one(users, {
    fields: [studentDiscounts.appliedBy],
    references: [users.id],
  }),
}));
