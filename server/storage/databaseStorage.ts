import { eq, and, like, desc, sql, or, isNull } from "drizzle-orm";
import { IStorage } from "./IStorage";
import { db } from "../db";
import { 
  students, Student, InsertStudent,
  programs, Program, InsertProgram,
  courses, Course, InsertCourse,
  enrollments, Enrollment, InsertEnrollment,
  attendance, Attendance, InsertAttendance,
  grades, Grade, InsertGrade,
  events, Event, InsertEvent,
  users, User, InsertUser
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Student operations
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(studentData).returning();
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const [student] = await db.update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return true; // Drizzle doesn't return deleted count directly
  }

  // Program operations
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.code, code));
    return program;
  }

  async createProgram(programData: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(programData).returning();
    return program;
  }

  async updateProgram(id: number, programData: Partial<Program>): Promise<Program | undefined> {
    const [program] = await db.update(programs)
      .set(programData)
      .where(eq(programs.id, id))
      .returning();
    return program;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id));
    return true;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.code, code));
    return course;
  }

  async getCoursesByProgram(programId: number): Promise<Course[]> {
    return await db.select()
      .from(courses)
      .where(eq(courses.programId, programId));
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const [course] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return true;
  }

  // Enrollment operations
  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select()
      .from(enrollments)
      .where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db.select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments)
      .values(enrollmentData)
      .returning();
    return enrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments)
      .set(enrollmentData)
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
    return true;
  }

  // Attendance operations
  async getAttendanceRecords(): Promise<Attendance[]> {
    return await db.select().from(attendance);
  }

  async getAttendanceRecord(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select()
      .from(attendance)
      .where(eq(attendance.id, id));
    return record;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId));
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendance)
      .where(eq(attendance.courseId, courseId));
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    // Converteer Date naar string-formaat zoals opgeslagen in de database
    const dateStr = date.toISOString().split('T')[0];
    return await db.select()
      .from(attendance)
      .where(eq(attendance.date, dateStr));
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance)
      .values(attendanceData)
      .returning();
    return record;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const [record] = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    await db.delete(attendance).where(eq(attendance.id, id));
    return true;
  }

  // Grade operations
  async getGrades(): Promise<Grade[]> {
    return await db.select().from(grades);
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    const [grade] = await db.select()
      .from(grades)
      .where(eq(grades.id, id));
    return grade;
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return await db.select()
      .from(grades)
      .where(eq(grades.studentId, studentId));
  }

  async getGradesByCourse(courseId: number): Promise<Grade[]> {
    return await db.select()
      .from(grades)
      .where(eq(grades.courseId, courseId));
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    const [grade] = await db.insert(grades)
      .values(gradeData)
      .returning();
    return grade;
  }

  async updateGrade(id: number, gradeData: Partial<Grade>): Promise<Grade | undefined> {
    const [grade] = await db.update(grades)
      .set(gradeData)
      .where(eq(grades.id, id))
      .returning();
    return grade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    await db.delete(grades).where(eq(grades.id, id));
    return true;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select()
      .from(events)
      .where(eq(events.id, id));
    return event;
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where(
        and(
          sql`${events.startDate} >= ${startDate.toISOString()}`,
          sql`${events.endDate} <= ${endDate.toISOString()}`
        )
      );
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events)
      .values(eventData)
      .returning();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true;
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
}