import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { IStorage } from './IStorage';
import { 
  students, type Student, type InsertStudent,
  programs, type Program, type InsertProgram,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  attendance, type Attendance, type InsertAttendance,
  teacherAttendance, type TeacherAttendance, type InsertTeacherAttendance,
  grades, type Grade, type InsertGrade,
  events, type Event, type InsertEvent,
  users, type User, type InsertUser,
  fees, type Fee, type InsertFee,
  assessments, type Assessment, type InsertAssessment,
  studentGroups, type StudentGroup, type InsertStudentGroup,
  studentGroupEnrollments, type StudentGroupEnrollment, type InsertStudentGroupEnrollment,
  lessons, type Lesson, type InsertLesson,
  examinations, type Examination, type InsertExamination,
  guardians, type Guardian, type InsertGuardian,
  studentGuardians, type StudentGuardian, type InsertStudentGuardian,
  studentPrograms, type StudentProgram, type InsertStudentProgram,
  teachers, type Teacher, type InsertTeacher,
  teacherAvailability, type TeacherAvailability, type InsertTeacherAvailability,
  teacherLanguages, type TeacherLanguage, type InsertTeacherLanguage,
  teacherCourseAssignments, type TeacherCourseAssignment, type InsertTeacherCourseAssignment,
  behaviorAssessments, type BehaviorAssessment, type InsertBehaviorAssessment,
  feeSettings, type FeeSettings, type InsertFeeSettings,
  feeDiscounts, type FeeDiscount, type InsertFeeDiscount
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

  // Assessment operations
  async getAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments);
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const result = await db.select().from(assessments).where(eq(assessments.id, id));
    return result[0];
  }

  async getAssessmentsByCourse(courseId: number): Promise<Assessment[]> {
    return db.select().from(assessments).where(eq(assessments.courseId, courseId));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const result = await db.insert(assessments).values(assessment).returning();
    return result[0];
  }

  async updateAssessment(id: number, assessment: Partial<Assessment>): Promise<Assessment | undefined> {
    const result = await db.update(assessments)
      .set(assessment)
      .where(eq(assessments.id, id))
      .returning();
    return result[0];
  }

  async deleteAssessment(id: number): Promise<boolean> {
    const result = await db.delete(assessments)
      .where(eq(assessments.id, id))
      .returning({ id: assessments.id });
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
  
  async getGradesByAssessment(assessmentType: number): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.assessmentType, assessmentType.toString()));
  }
  
  async getGradesByStudentAndCourse(studentId: number, courseId: number): Promise<Grade[]> {
    const allGrades = await db.select().from(grades);
    return allGrades.filter(grade => grade.studentId === studentId && grade.courseId === courseId);
  }
  
  async batchCreateGrades(insertGrades: InsertGrade[]): Promise<Grade[]> {
    if (insertGrades.length === 0) return [];
    
    // Voor elke grade individueel invoegen en de resultaten verzamelen
    const results: Grade[] = [];
    
    for (const grade of insertGrades) {
      const result = await db.insert(grades).values(grade).returning();
      if (result.length > 0) {
        results.push(result[0]);
      }
    }
    
    return results;
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

  // Student Group operations
  async getStudentGroups(): Promise<StudentGroup[]> {
    return db.select().from(studentGroups);
  }

  async getStudentGroup(id: number): Promise<StudentGroup | undefined> {
    const result = await db.select().from(studentGroups).where(eq(studentGroups.id, id));
    return result[0];
  }

  async getStudentGroupsByProgram(programId: number): Promise<StudentGroup[]> {
    return db.select().from(studentGroups).where(eq(studentGroups.programId, programId));
  }

  async getStudentGroupsByCourse(courseId: number): Promise<StudentGroup[]> {
    return db.select().from(studentGroups).where(eq(studentGroups.courseId, courseId));
  }

  async getStudentGroupsByAcademicYear(academicYear: string): Promise<StudentGroup[]> {
    return db.select().from(studentGroups).where(eq(studentGroups.academicYear, academicYear));
  }

  async createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup> {
    const result = await db.insert(studentGroups).values(group).returning();
    return result[0];
  }

  async updateStudentGroup(id: number, group: Partial<StudentGroup>): Promise<StudentGroup | undefined> {
    const result = await db.update(studentGroups)
      .set(group)
      .where(eq(studentGroups.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentGroup(id: number): Promise<boolean> {
    const result = await db.delete(studentGroups)
      .where(eq(studentGroups.id, id))
      .returning({ id: studentGroups.id });
    return result.length > 0;
  }

  // Student Group Enrollment operations
  async getStudentGroupEnrollments(): Promise<StudentGroupEnrollment[]> {
    return db.select().from(studentGroupEnrollments);
  }

  async getStudentGroupEnrollment(id: number): Promise<StudentGroupEnrollment | undefined> {
    const result = await db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.id, id));
    return result[0];
  }

  async getStudentGroupEnrollmentsByStudent(studentId: number): Promise<StudentGroupEnrollment[]> {
    return db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.studentId, studentId));
  }

  async getStudentGroupEnrollmentsByGroup(groupId: number): Promise<StudentGroupEnrollment[]> {
    return db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.groupId, groupId));
  }

  async createStudentGroupEnrollment(enrollment: InsertStudentGroupEnrollment): Promise<StudentGroupEnrollment> {
    const result = await db.insert(studentGroupEnrollments).values(enrollment).returning();
    return result[0];
  }

  async updateStudentGroupEnrollment(id: number, enrollment: Partial<StudentGroupEnrollment>): Promise<StudentGroupEnrollment | undefined> {
    const result = await db.update(studentGroupEnrollments)
      .set(enrollment)
      .where(eq(studentGroupEnrollments.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentGroupEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(studentGroupEnrollments)
      .where(eq(studentGroupEnrollments.id, id))
      .returning({ id: studentGroupEnrollments.id });
    return result.length > 0;
  }

  // Lesson operations
  async getLessons(): Promise<Lesson[]> {
    return db.select().from(lessons);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const result = await db.select().from(lessons).where(eq(lessons.id, id));
    return result[0];
  }

  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.courseId, courseId));
  }

  async getLessonsByGroup(groupId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.groupId, groupId));
  }

  async getLessonsByDateRange(startDate: Date, endDate: Date): Promise<Lesson[]> {
    const allLessons = await db.select().from(lessons);
    
    // Filteren op datum
    return allLessons.filter(lesson => {
      const lessonDate = new Date(lesson.scheduledDate);
      return lessonDate >= startDate && lessonDate <= endDate;
    });
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const result = await db.insert(lessons).values(lesson).returning();
    return result[0];
  }

  async updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined> {
    const result = await db.update(lessons)
      .set(lesson)
      .where(eq(lessons.id, id))
      .returning();
    return result[0];
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons)
      .where(eq(lessons.id, id))
      .returning({ id: lessons.id });
    return result.length > 0;
  }

  // Examination operations
  async getExaminations(): Promise<Examination[]> {
    return db.select().from(examinations);
  }

  async getExamination(id: number): Promise<Examination | undefined> {
    const result = await db.select().from(examinations).where(eq(examinations.id, id));
    return result[0];
  }

  async getExaminationsByCourse(courseId: number): Promise<Examination[]> {
    return db.select().from(examinations).where(eq(examinations.courseId, courseId));
  }

  async getExaminationsByDateRange(startDate: Date, endDate: Date): Promise<Examination[]> {
    const allExams = await db.select().from(examinations);
    
    // Filteren op datum
    return allExams.filter(exam => {
      const examDate = new Date(exam.examDate);
      return examDate >= startDate && examDate <= endDate;
    });
  }

  async getExaminationsByAssessment(assessmentId: number): Promise<Examination[]> {
    return db.select().from(examinations).where(eq(examinations.assessmentId, assessmentId));
  }

  async createExamination(examination: InsertExamination): Promise<Examination> {
    const result = await db.insert(examinations).values(examination).returning();
    return result[0];
  }

  async updateExamination(id: number, examination: Partial<Examination>): Promise<Examination | undefined> {
    const result = await db.update(examinations)
      .set(examination)
      .where(eq(examinations.id, id))
      .returning();
    return result[0];
  }

  async deleteExamination(id: number): Promise<boolean> {
    const result = await db.delete(examinations)
      .where(eq(examinations.id, id))
      .returning({ id: examinations.id });
    return result.length > 0;
  }

  // Guardian operations
  async getGuardians(): Promise<Guardian[]> {
    return db.select().from(guardians);
  }

  async getGuardian(id: number): Promise<Guardian | undefined> {
    const result = await db.select().from(guardians).where(eq(guardians.id, id));
    return result[0];
  }

  async getGuardianByEmail(email: string): Promise<Guardian | undefined> {
    const result = await db.select().from(guardians).where(eq(guardians.email, email));
    return result[0];
  }

  async getGuardiansByStudent(studentId: number): Promise<Guardian[]> {
    // We moeten eerst de studentGuardians-relaties ophalen, en dan de bijbehorende guardians
    const relations = await db.select().from(studentGuardians).where(eq(studentGuardians.studentId, studentId));
    
    if (relations.length === 0) return [];
    
    // Verzamel alle guardian IDs
    const guardianIds = relations.map(relation => relation.guardianId);
    
    // Haal alle guardians op
    const allGuardians = await db.select().from(guardians);
    
    // Filter op de gevonden IDs
    return allGuardians.filter(guardian => guardianIds.includes(guardian.id));
  }

  async createGuardian(guardian: InsertGuardian): Promise<Guardian> {
    const result = await db.insert(guardians).values(guardian).returning();
    return result[0];
  }

  async updateGuardian(id: number, guardian: Partial<Guardian>): Promise<Guardian | undefined> {
    const result = await db.update(guardians)
      .set(guardian)
      .where(eq(guardians.id, id))
      .returning();
    return result[0];
  }

  async deleteGuardian(id: number): Promise<boolean> {
    const result = await db.delete(guardians)
      .where(eq(guardians.id, id))
      .returning({ id: guardians.id });
    return result.length > 0;
  }

  // Student Guardian operations
  async getStudentGuardians(): Promise<StudentGuardian[]> {
    return db.select().from(studentGuardians);
  }

  async getStudentGuardian(id: number): Promise<StudentGuardian | undefined> {
    const result = await db.select().from(studentGuardians).where(eq(studentGuardians.id, id));
    return result[0];
  }

  async getStudentGuardiansByStudent(studentId: number): Promise<StudentGuardian[]> {
    return db.select().from(studentGuardians).where(eq(studentGuardians.studentId, studentId));
  }

  async getStudentGuardiansByGuardian(guardianId: number): Promise<StudentGuardian[]> {
    return db.select().from(studentGuardians).where(eq(studentGuardians.guardianId, guardianId));
  }

  async createStudentGuardian(relation: InsertStudentGuardian): Promise<StudentGuardian> {
    const result = await db.insert(studentGuardians).values(relation).returning();
    return result[0];
  }

  async updateStudentGuardian(id: number, relation: Partial<StudentGuardian>): Promise<StudentGuardian | undefined> {
    const result = await db.update(studentGuardians)
      .set(relation)
      .where(eq(studentGuardians.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentGuardian(id: number): Promise<boolean> {
    const result = await db.delete(studentGuardians)
      .where(eq(studentGuardians.id, id))
      .returning({ id: studentGuardians.id });
    return result.length > 0;
  }

  // Student Program operations
  async getStudentPrograms(): Promise<StudentProgram[]> {
    return db.select().from(studentPrograms);
  }

  async getStudentProgram(id: number): Promise<StudentProgram | undefined> {
    const result = await db.select().from(studentPrograms).where(eq(studentPrograms.id, id));
    return result[0];
  }

  async getStudentProgramsByStudent(studentId: number): Promise<StudentProgram[]> {
    return db.select().from(studentPrograms).where(eq(studentPrograms.studentId, studentId));
  }

  async getStudentProgramsByProgram(programId: number): Promise<StudentProgram[]> {
    return db.select().from(studentPrograms).where(eq(studentPrograms.programId, programId));
  }

  async createStudentProgram(studentProgram: InsertStudentProgram): Promise<StudentProgram> {
    // Als dit als primair programma wordt gemarkeerd, update dan alle bestaande programma's van de student naar niet-primair
    if (studentProgram.isPrimary) {
      await db.update(studentPrograms)
        .set({ isPrimary: false })
        .where(eq(studentPrograms.studentId, studentProgram.studentId));
    }
    
    const result = await db.insert(studentPrograms).values(studentProgram).returning();
    return result[0];
  }

  async updateStudentProgram(id: number, studentProgram: Partial<StudentProgram>): Promise<StudentProgram | undefined> {
    // Als dit programma als primair wordt gemarkeerd, update dan alle andere programma's van de student
    if (studentProgram.isPrimary) {
      const currentProgram = await this.getStudentProgram(id);
      if (currentProgram) {
        await db.update(studentPrograms)
          .set({ isPrimary: false })
          .where(eq(studentPrograms.studentId, currentProgram.studentId));
      }
    }
    
    const result = await db.update(studentPrograms)
      .set(studentProgram)
      .where(eq(studentPrograms.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentProgram(id: number): Promise<boolean> {
    const result = await db.delete(studentPrograms)
      .where(eq(studentPrograms.id, id))
      .returning({ id: studentPrograms.id });
    return result.length > 0;
  }

  async getPrimaryProgramByStudent(studentId: number): Promise<StudentProgram | undefined> {
    const result = await db.select()
      .from(studentPrograms)
      .where(and(
        eq(studentPrograms.studentId, studentId),
        eq(studentPrograms.isPrimary, true)
      ));
    
    if (result.length > 0) {
      return result[0];
    }
    return undefined;
  }

  // Teacher operations
  async getTeachers(): Promise<Teacher[]> {
    return db.select().from(teachers);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.id, id));
    return result[0];
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.email, email));
    return result[0];
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const result = await db.insert(teachers).values(teacher).returning();
    return result[0];
  }

  async updateTeacher(id: number, teacher: Partial<Teacher>): Promise<Teacher | undefined> {
    const result = await db.update(teachers)
      .set(teacher)
      .where(eq(teachers.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers)
      .where(eq(teachers.id, id))
      .returning({ id: teachers.id });
    return result.length > 0;
  }
  
  // Teacher Availability operations
  async getTeacherAvailabilities(): Promise<TeacherAvailability[]> {
    return db.select().from(teacherAvailability);
  }

  async getTeacherAvailability(id: number): Promise<TeacherAvailability | undefined> {
    const result = await db.select().from(teacherAvailability).where(eq(teacherAvailability.id, id));
    return result[0];
  }

  async getTeacherAvailabilitiesByTeacher(teacherId: number): Promise<TeacherAvailability[]> {
    return db.select().from(teacherAvailability).where(eq(teacherAvailability.teacherId, teacherId));
  }

  async createTeacherAvailability(availability: InsertTeacherAvailability): Promise<TeacherAvailability> {
    const result = await db.insert(teacherAvailability).values(availability).returning();
    return result[0];
  }

  async updateTeacherAvailability(id: number, availability: Partial<TeacherAvailability>): Promise<TeacherAvailability | undefined> {
    const result = await db.update(teacherAvailability)
      .set(availability)
      .where(eq(teacherAvailability.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacherAvailability(id: number): Promise<boolean> {
    const result = await db.delete(teacherAvailability)
      .where(eq(teacherAvailability.id, id))
      .returning({ id: teacherAvailability.id });
    return result.length > 0;
  }
  
  // Teacher Language operations
  async getTeacherLanguages(): Promise<TeacherLanguage[]> {
    return db.select().from(teacherLanguages);
  }

  async getTeacherLanguage(id: number): Promise<TeacherLanguage | undefined> {
    const result = await db.select().from(teacherLanguages).where(eq(teacherLanguages.id, id));
    return result[0];
  }

  async getTeacherLanguagesByTeacher(teacherId: number): Promise<TeacherLanguage[]> {
    return db.select().from(teacherLanguages).where(eq(teacherLanguages.teacherId, teacherId));
  }

  async createTeacherLanguage(language: InsertTeacherLanguage): Promise<TeacherLanguage> {
    const result = await db.insert(teacherLanguages).values(language).returning();
    return result[0];
  }

  async updateTeacherLanguage(id: number, language: Partial<TeacherLanguage>): Promise<TeacherLanguage | undefined> {
    const result = await db.update(teacherLanguages)
      .set(language)
      .where(eq(teacherLanguages.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacherLanguage(id: number): Promise<boolean> {
    const result = await db.delete(teacherLanguages)
      .where(eq(teacherLanguages.id, id))
      .returning({ id: teacherLanguages.id });
    return result.length > 0;
  }
  
  // Teacher Course Assignment operations
  async getTeacherCourseAssignments(): Promise<TeacherCourseAssignment[]> {
    return db.select().from(teacherCourseAssignments);
  }

  async getTeacherCourseAssignment(id: number): Promise<TeacherCourseAssignment | undefined> {
    const result = await db.select().from(teacherCourseAssignments).where(eq(teacherCourseAssignments.id, id));
    return result[0];
  }

  async getTeacherCourseAssignmentsByTeacher(teacherId: number): Promise<TeacherCourseAssignment[]> {
    return db.select().from(teacherCourseAssignments).where(eq(teacherCourseAssignments.teacherId, teacherId));
  }

  async getTeacherCourseAssignmentsByCourse(courseId: number): Promise<TeacherCourseAssignment[]> {
    return db.select().from(teacherCourseAssignments).where(eq(teacherCourseAssignments.courseId, courseId));
  }

  async createTeacherCourseAssignment(assignment: InsertTeacherCourseAssignment): Promise<TeacherCourseAssignment> {
    const result = await db.insert(teacherCourseAssignments).values(assignment).returning();
    return result[0];
  }

  async updateTeacherCourseAssignment(id: number, assignment: Partial<TeacherCourseAssignment>): Promise<TeacherCourseAssignment | undefined> {
    const result = await db.update(teacherCourseAssignments)
      .set(assignment)
      .where(eq(teacherCourseAssignments.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacherCourseAssignment(id: number): Promise<boolean> {
    const result = await db.delete(teacherCourseAssignments)
      .where(eq(teacherCourseAssignments.id, id))
      .returning({ id: teacherCourseAssignments.id });
    return result.length > 0;
  }
  
  // Teacher Attendance operations
  async getTeacherAttendanceRecords(): Promise<TeacherAttendance[]> {
    return db.select().from(teacherAttendance);
  }

  async getTeacherAttendanceRecord(id: number): Promise<TeacherAttendance | undefined> {
    const result = await db.select().from(teacherAttendance).where(eq(teacherAttendance.id, id));
    return result[0];
  }

  async getTeacherAttendanceByTeacher(teacherId: number): Promise<TeacherAttendance[]> {
    return db.select().from(teacherAttendance).where(eq(teacherAttendance.teacherId, teacherId));
  }

  async getTeacherAttendanceByCourse(courseId: number): Promise<TeacherAttendance[]> {
    return db.select().from(teacherAttendance).where(eq(teacherAttendance.courseId, courseId));
  }

  async getTeacherAttendanceByDate(date: Date): Promise<TeacherAttendance[]> {
    // Converteer naar ISO string en gebruik alleen de datum (zonder tijd)
    const dateString = date.toISOString().split('T')[0];
    return db.select().from(teacherAttendance).where(eq(teacherAttendance.date, dateString));
  }

  async createTeacherAttendance(attendance: InsertTeacherAttendance): Promise<TeacherAttendance> {
    const result = await db.insert(teacherAttendance).values(attendance).returning();
    return result[0];
  }

  async updateTeacherAttendance(id: number, attendance: Partial<TeacherAttendance>): Promise<TeacherAttendance | undefined> {
    const result = await db.update(teacherAttendance)
      .set(attendance)
      .where(eq(teacherAttendance.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacherAttendance(id: number): Promise<boolean> {
    const result = await db.delete(teacherAttendance)
      .where(eq(teacherAttendance.id, id))
      .returning({ id: teacherAttendance.id });
    return result.length > 0;
  }
  
  // Enhanced Attendance operations (with teacher)
  async getAttendanceByTeacher(teacherId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.teacherId, teacherId));
  }

  async getAttendanceByClassAndDate(courseId: number, date: Date): Promise<Attendance[]> {
    // Converteer naar ISO string en gebruik alleen de datum (zonder tijd)
    const dateString = date.toISOString().split('T')[0];
    return db.select()
      .from(attendance)
      .where(and(
        eq(attendance.courseId, courseId),
        eq(attendance.date, dateString)
      ));
  }
  
  // Behavior Assessment operations
  async getBehaviorAssessments(filter?: any): Promise<BehaviorAssessment[]> {
    let query = db.select().from(behaviorAssessments);
    
    if (filter) {
      if (filter.studentId) {
        query = query.where(eq(behaviorAssessments.studentId, filter.studentId));
      }
      if (filter.classId) {
        query = query.where(eq(behaviorAssessments.classId, filter.classId));
      }
    }
    
    return query;
  }

  async getBehaviorAssessment(id: number): Promise<BehaviorAssessment | undefined> {
    const result = await db.select().from(behaviorAssessments).where(eq(behaviorAssessments.id, id));
    return result[0];
  }

  async getBehaviorAssessmentsByStudent(studentId: number): Promise<BehaviorAssessment[]> {
    return db.select().from(behaviorAssessments).where(eq(behaviorAssessments.studentId, studentId));
  }

  async getBehaviorAssessmentsByClass(classId: number): Promise<BehaviorAssessment[]> {
    return db.select().from(behaviorAssessments).where(eq(behaviorAssessments.classId, classId));
  }

  async createBehaviorAssessment(assessment: InsertBehaviorAssessment): Promise<BehaviorAssessment> {
    const result = await db.insert(behaviorAssessments).values(assessment).returning();
    return result[0];
  }

  async createBehaviorAssessments(assessments: InsertBehaviorAssessment[]): Promise<BehaviorAssessment[]> {
    if (assessments.length === 0) return [];
    const result = await db.insert(behaviorAssessments).values(assessments).returning();
    return result;
  }

  async updateBehaviorAssessment(id: number, assessment: Partial<BehaviorAssessment>): Promise<BehaviorAssessment | undefined> {
    const result = await db.update(behaviorAssessments)
      .set(assessment)
      .where(eq(behaviorAssessments.id, id))
      .returning();
    return result[0];
  }

  async deleteBehaviorAssessment(id: number): Promise<boolean> {
    const result = await db.delete(behaviorAssessments)
      .where(eq(behaviorAssessments.id, id))
      .returning({ id: behaviorAssessments.id });
    return result.length > 0;
  }
}