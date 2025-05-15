import { eq } from 'drizzle-orm';
import { db } from '../db';
import { IStorage } from './IStorage';
import { 
  students, type Student, type InsertStudent,
  programs, type Program, type InsertProgram,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  attendance, type Attendance, type InsertAttendance,
  grades, type Grade, type InsertGrade,
  events, type Event, type InsertEvent,
  users, type User, type InsertUser,
  fees, type Fee, type InsertFee,
  assessments, type Assessment, type InsertAssessment
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Student operations
  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.email, email));
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined> {
    const result = await db.update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students)
      .where(eq(students.id, id))
      .returning({ id: students.id });
    return result.length > 0;
  }

  // Program operations
  async getPrograms(): Promise<Program[]> {
    return db.select().from(programs);
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.id, id));
    return result[0];
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.code, code));
    return result[0];
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const result = await db.insert(programs).values(program).returning();
    return result[0];
  }

  async updateProgram(id: number, program: Partial<Program>): Promise<Program | undefined> {
    const result = await db.update(programs)
      .set(program)
      .where(eq(programs.id, id))
      .returning();
    return result[0];
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs)
      .where(eq(programs.id, id))
      .returning({ id: programs.id });
    return result.length > 0;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.code, code));
    return result[0];
  }

  async getCoursesByProgram(programId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.programId, programId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined> {
    const result = await db.update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses)
      .where(eq(courses.id, id))
      .returning({ id: courses.id });
    return result.length > 0;
  }

  // Enrollment operations
  async getEnrollments(): Promise<Enrollment[]> {
    return db.select().from(enrollments);
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return result[0];
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(enrollments).values(enrollment).returning();
    return result[0];
  }

  async updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const result = await db.update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(enrollments)
      .where(eq(enrollments.id, id))
      .returning({ id: enrollments.id });
    return result.length > 0;
  }

  // Attendance operations
  async getAttendanceRecords(): Promise<Attendance[]> {
    return db.select().from(attendance);
  }

  async getAttendanceRecord(id: number): Promise<Attendance | undefined> {
    const result = await db.select().from(attendance).where(eq(attendance.id, id));
    return result[0];
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.courseId, courseId));
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    // We moeten hier string naar Date converteren voor de vergelijking
    const dateString = date.toISOString().split('T')[0];
    const records = await db.select().from(attendance);
    return records.filter(record => {
      // Vergelijk alleen de datum-component (zonder tijd)
      const recordDate = record.date.split('T')[0];
      return recordDate === dateString;
    });
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values(attendanceData).returning();
    return result[0];
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const result = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db.delete(attendance)
      .where(eq(attendance.id, id))
      .returning({ id: attendance.id });
    return result.length > 0;
  }

  // Grade operations
  async getGrades(): Promise<Grade[]> {
    return db.select().from(grades);
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    const result = await db.select().from(grades).where(eq(grades.id, id));
    return result[0];
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async getGradesByCourse(courseId: number): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.courseId, courseId));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const result = await db.insert(grades).values(grade).returning();
    return result[0];
  }

  async updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined> {
    const result = await db.update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return result[0];
  }

  async deleteGrade(id: number): Promise<boolean> {
    const result = await db.delete(grades)
      .where(eq(grades.id, id))
      .returning({ id: grades.id });
    return result.length > 0;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const allEvents = await db.select().from(events);
    
    return allEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (
        (eventStart >= startDate && eventStart <= endDate) || 
        (eventEnd >= startDate && eventEnd <= endDate) ||
        (eventStart <= startDate && eventEnd >= endDate)
      );
    });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });
    return result.length > 0;
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return result.length > 0;
  }

  // Fee operations
  async getFees(): Promise<Fee[]> {
    return db.select().from(fees);
  }

  async getFee(id: number): Promise<Fee | undefined> {
    const result = await db.select().from(fees).where(eq(fees.id, id));
    return result[0];
  }

  async getFeesByStudent(studentId: number): Promise<Fee[]> {
    return db.select().from(fees).where(eq(fees.studentId, studentId));
  }

  async getFeesByStatus(status: string): Promise<Fee[]> {
    return db.select().from(fees).where(eq(fees.status, status));
  }

  async getFeesByDateRange(startDate: Date, endDate: Date): Promise<Fee[]> {
    // Voor datum vergelijkingen, eerst de datums converteren naar strings zonder tijdcomponent
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const allFees = await db.select().from(fees);
    
    // Filteren op datum - vergelijk alleen de datum component
    return allFees.filter(fee => {
      // Converteer naar string en verwijder de tijdcomponent
      const dueDateStr = new Date(fee.dueDate).toISOString().split('T')[0];
      
      // Check of de vervaldag binnen de opgegeven periode valt
      return dueDateStr >= startDateStr && dueDateStr <= endDateStr;
    });
  }

  async createFee(fee: InsertFee): Promise<Fee> {
    const result = await db.insert(fees).values(fee).returning();
    return result[0];
  }

  async updateFee(id: number, fee: Partial<Fee>): Promise<Fee | undefined> {
    const result = await db.update(fees)
      .set(fee)
      .where(eq(fees.id, id))
      .returning();
    return result[0];
  }

  async deleteFee(id: number): Promise<boolean> {
    const result = await db.delete(fees)
      .where(eq(fees.id, id))
      .returning({ id: fees.id });
    return result.length > 0;
  }
}