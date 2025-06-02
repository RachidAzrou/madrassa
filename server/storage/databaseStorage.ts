import { and, eq, desc, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  users, students, programs, courses, enrollments, attendance, 
  studentPrograms, grades, assessments, behaviorAssessments, events,
  fees, feeDiscounts, feeSettings, studentGroups, studentGroupEnrollments,
  lessons, examinations, guardians, studentGuardians, teachers, 
  teacherAvailability, teacherLanguages, teacherCourseAssignments,
  teacherAttendance, notifications
} from "@shared/schema";
import type { 
  InsertUser, User, InsertStudent, Student, InsertProgram,
  Program, InsertCourse, Course, InsertEnrollment, Enrollment,
  InsertAttendance, Attendance, InsertTeacherAttendance, TeacherAttendance,
  InsertStudentProgram, StudentProgram, InsertGrade, Grade,
  InsertBehaviorAssessment, BehaviorAssessment, InsertAssessment,
  Assessment, InsertEvent, Event, InsertFee, Fee, InsertFeeDiscount,
  FeeDiscount, InsertFeeSettings, FeeSettings, InsertStudentGroup,
  StudentGroup, InsertStudentGroupEnrollment, StudentGroupEnrollment,
  InsertLesson, Lesson, InsertExamination, Examination, InsertGuardian,
  Guardian, InsertStudentGuardian, StudentGuardian, InsertTeacher, 
  Teacher, InsertTeacherAvailability, TeacherAvailability,
  InsertTeacherLanguage, TeacherLanguage, InsertTeacherCourseAssignment,
  TeacherCourseAssignment, InsertNotification, Notification
} from "@shared/schema";
import type { IStorage } from "./IStorage";

export class DatabaseStorage implements IStorage {
  // Health check - Test database connection
  async checkHealth(): Promise<{ connected: boolean; timestamp?: string; error?: string }> {
    try {
      // Execute a simple query to check database connection
      const result = await db.execute(sql`SELECT NOW() as timestamp`);
      
      if (result && result.rows && result.rows.length > 0) {
        return { 
          connected: true, 
          timestamp: result.rows[0].timestamp 
        };
      }
      
      return { 
        connected: false, 
        error: "Database connection successful but no data returned" 
      };
    } catch (error) {
      console.error("Database health check failed:", error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Unknown database error" 
      };
    }
  }
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }
  
  // Students
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
    const [updatedStudent] = await db.update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    try {
      // Eerst alle gerelateerde records verwijderen
      
      // Verwijder student-voogd relaties
      await db.delete(studentGuardians).where(eq(studentGuardians.studentId, id));
      
      // Verwijder student-groep inschrijvingen
      await db.delete(studentGroupEnrollments).where(eq(studentGroupEnrollments.studentId, id));
      
      // Verwijder broer/zus relaties (beide richtingen)
      await db.execute(sql`DELETE FROM student_siblings WHERE student_id = ${id} OR sibling_id = ${id}`);
      
      // Nu de student zelf verwijderen
      const result = await db.delete(students).where(eq(students.id, id)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
  
  // Programs
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
    const [updatedProgram] = await db.update(programs)
      .set(programData)
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram;
  }
  
  async deleteProgram(id: number): Promise<boolean> {
    await db.delete(programs).where(eq(programs.id, id));
    return true;
  }
  
  // Courses
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
    return await db.select().from(courses).where(eq(courses.programId, programId));
  }
  
  async getCoursesByFilter(filter: { isActive?: boolean }): Promise<Course[]> {
    let query = db.select().from(courses);
    if (filter.isActive !== undefined) {
      query = query.where(eq(courses.isActive, filter.isActive));
    }
    return await query;
  }
  
  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }
  
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    await db.delete(courses).where(eq(courses.id, id));
    return true;
  }
  
  // Student Groups
  async getStudentGroups(): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups);
  }
  
  async getStudentGroup(id: number): Promise<StudentGroup | undefined> {
    const [group] = await db.select().from(studentGroups).where(eq(studentGroups.id, id));
    return group;
  }
  
  async getStudentGroupsByProgram(programId: number): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups).where(eq(studentGroups.programId, programId));
  }
  
  async getStudentGroupsByCourse(courseId: number): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups).where(eq(studentGroups.courseId, courseId));
  }
  
  async getStudentGroupsByAcademicYear(academicYear: string): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups).where(eq(studentGroups.academicYear, academicYear));
  }
  
  async createStudentGroup(groupData: InsertStudentGroup): Promise<StudentGroup> {
    const [group] = await db.insert(studentGroups).values(groupData).returning();
    return group;
  }
  
  async updateStudentGroup(id: number, groupData: Partial<StudentGroup>): Promise<StudentGroup | undefined> {
    const [updatedGroup] = await db.update(studentGroups)
      .set(groupData)
      .where(eq(studentGroups.id, id))
      .returning();
    return updatedGroup;
  }
  
  async deleteStudentGroup(id: number): Promise<boolean> {
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
    return true;
  }
  
  // Student Group Enrollments
  async getStudentGroupEnrollments(): Promise<StudentGroupEnrollment[]> {
    return await db.select().from(studentGroupEnrollments);
  }
  
  async getStudentGroupEnrollment(id: number): Promise<StudentGroupEnrollment | undefined> {
    const [enrollment] = await db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.id, id));
    return enrollment;
  }
  
  async getStudentGroupEnrollmentsByStudent(studentId: number): Promise<StudentGroupEnrollment[]> {
    return await db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.studentId, studentId));
  }
  
  async getStudentGroupEnrollmentsByGroup(groupId: number): Promise<StudentGroupEnrollment[]> {
    return await db.select().from(studentGroupEnrollments).where(eq(studentGroupEnrollments.groupId, groupId));
  }
  
  async createStudentGroupEnrollment(enrollmentData: InsertStudentGroupEnrollment): Promise<StudentGroupEnrollment> {
    // Eerst alle actieve enrollments voor deze student deactiveren
    await db
      .update(studentGroupEnrollments)
      .set({ status: 'inactive' })
      .where(
        and(
          eq(studentGroupEnrollments.studentId, enrollmentData.studentId),
          eq(studentGroupEnrollments.status, 'active')
        )
      );
    
    // Dan de nieuwe enrollment aanmaken
    const [enrollment] = await db.insert(studentGroupEnrollments).values({
      ...enrollmentData,
      status: 'active'
    }).returning();
    return enrollment;
  }
  
  async updateStudentGroupEnrollment(id: number, enrollmentData: Partial<StudentGroupEnrollment>): Promise<StudentGroupEnrollment | undefined> {
    const [updatedEnrollment] = await db.update(studentGroupEnrollments)
      .set(enrollmentData)
      .where(eq(studentGroupEnrollments.id, id))
      .returning();
    return updatedEnrollment;
  }
  
  async deleteStudentGroupEnrollment(id: number): Promise<boolean> {
    await db.delete(studentGroupEnrollments).where(eq(studentGroupEnrollments.id, id));
    return true;
  }
  
  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }
  
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }
  
  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.email, email));
    return teacher;
  }
  
  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(teacherData).returning();
    return teacher;
  }
  
  async updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined> {
    const [updatedTeacher] = await db.update(teachers)
      .set(teacherData)
      .where(eq(teachers.id, id))
      .returning();
    return updatedTeacher;
  }
  
  async deleteTeacher(id: number): Promise<boolean> {
    await db.delete(teachers).where(eq(teachers.id, id));
    return true;
  }
  
  // Teacher Availability
  async getTeacherAvailabilities(): Promise<TeacherAvailability[]> {
    return await db.select().from(teacherAvailability);
  }
  
  async getTeacherAvailability(id: number): Promise<TeacherAvailability | undefined> {
    const [availability] = await db.select().from(teacherAvailability).where(eq(teacherAvailability.id, id));
    return availability;
  }
  
  async getTeacherAvailabilitiesByTeacher(teacherId: number): Promise<TeacherAvailability[]> {
    return await db.select().from(teacherAvailability).where(eq(teacherAvailability.teacherId, teacherId));
  }
  
  async createTeacherAvailability(availabilityData: InsertTeacherAvailability): Promise<TeacherAvailability> {
    const [availability] = await db.insert(teacherAvailability).values(availabilityData).returning();
    return availability;
  }
  
  async updateTeacherAvailability(id: number, availabilityData: Partial<TeacherAvailability>): Promise<TeacherAvailability | undefined> {
    const [updatedAvailability] = await db.update(teacherAvailability)
      .set(availabilityData)
      .where(eq(teacherAvailability.id, id))
      .returning();
    return updatedAvailability;
  }
  
  async deleteTeacherAvailability(id: number): Promise<boolean> {
    await db.delete(teacherAvailability).where(eq(teacherAvailability.id, id));
    return true;
  }
  
  // Lessons
  async getLessons(): Promise<Lesson[]> {
    return await db.select().from(lessons);
  }
  
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }
  
  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId));
  }
  
  async getLessonsByGroup(groupId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.groupId, groupId));
  }
  
  async getLessonsByDateRange(startDate: Date, endDate: Date): Promise<Lesson[]> {
    return await db.select().from(lessons)
      .where(
        and(
          sql`${lessons.date} >= ${startDate}`,
          sql`${lessons.date} <= ${endDate}`
        )
      );
  }
  
  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(lessonData).returning();
    return lesson;
  }
  
  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db.update(lessons)
      .set(lessonData)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    await db.delete(lessons).where(eq(lessons.id, id));
    return true;
  }
  
  // Guardians
  async getGuardians(): Promise<Guardian[]> {
    return await db.select().from(guardians);
  }
  
  async getGuardian(id: number): Promise<Guardian | undefined> {
    const [guardian] = await db.select().from(guardians).where(eq(guardians.id, id));
    return guardian;
  }
  
  async getGuardianByEmail(email: string): Promise<Guardian | undefined> {
    const [guardian] = await db.select().from(guardians).where(eq(guardians.email, email));
    return guardian;
  }
  
  async getGuardiansByStudent(studentId: number): Promise<Guardian[]> {
    // Gebruik student-guardian relaties om voogden van een student te vinden
    const relations = await db.select({
      guardianId: studentGuardians.guardianId
    })
    .from(studentGuardians)
    .where(eq(studentGuardians.studentId, studentId));
    
    if (relations.length === 0) {
      return [];
    }
    
    // Haal alle voogden op basis van de gevonden IDs
    const guardianIds = relations.map(rel => rel.guardianId);
    return await db.select()
      .from(guardians)
      .where(sql`${guardians.id} IN (${guardianIds.join(',')})`);
  }
  
  async createGuardian(guardianData: InsertGuardian): Promise<Guardian> {
    const [guardian] = await db.insert(guardians).values(guardianData).returning();
    return guardian;
  }
  
  async updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined> {
    const [updatedGuardian] = await db.update(guardians)
      .set(guardianData)
      .where(eq(guardians.id, id))
      .returning();
    return updatedGuardian;
  }
  
  async deleteGuardian(id: number): Promise<boolean> {
    await db.delete(guardians).where(eq(guardians.id, id));
    return true;
  }
  
  // Student Guardian relations
  async getStudentGuardians(): Promise<StudentGuardian[]> {
    return await db.select().from(studentGuardians);
  }
  
  async getStudentGuardian(id: number): Promise<StudentGuardian | undefined> {
    const [relation] = await db.select().from(studentGuardians).where(eq(studentGuardians.id, id));
    return relation;
  }
  
  async getStudentGuardiansByStudent(studentId: number): Promise<any[]> {
    try {
      // Eerste stap: haal de relaties op
      const relations = await db
        .select()
        .from(studentGuardians)
        .where(eq(studentGuardians.studentId, studentId));

      if (relations.length === 0) {
        return [];
      }

      // Tweede stap: haal voor elke relatie de voogd informatie op
      const result = [];
      for (const relation of relations) {
        const [guardian] = await db
          .select()
          .from(guardians)
          .where(eq(guardians.id, relation.guardianId));

        if (guardian) {
          result.push({
            ...relation,
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            email: guardian.email,
            phone: guardian.phone,
            isEmergencyContact: guardian.isEmergencyContact,
            emergencyContactName: guardian.emergencyContactName,
            emergencyContactPhone: guardian.emergencyContactPhone,
            emergencyContactRelation: guardian.emergencyContactRelation
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting student guardians:', error);
      return [];
    }
  }
  
  async getStudentGuardiansByGuardian(guardianId: number): Promise<any[]> {
    try {
      // Simpelere aanpak: eerst de relaties ophalen
      const relations = await db.select()
        .from(studentGuardians)
        .where(eq(studentGuardians.guardianId, guardianId));
      
      // Vervolgens voor elke relatie de studentgegevens ophalen
      const result = [];
      for (const relation of relations) {
        const [student] = await db.select()
          .from(students)
          .where(eq(students.id, relation.studentId));
        
        if (student) {
          result.push({
            ...relation,
            student: {
              id: student.id,
              studentId: student.studentId,
              firstName: student.firstName,
              lastName: student.lastName,
              status: student.status
            }
          });
        } else {
          // Als er geen student is gevonden, toch de relatie opnemen zonder studentgegevens
          result.push(relation);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Fout bij ophalen van student-voogd relaties:", error);
      return [];
    }
  }
  
  async createStudentGuardian(relationData: InsertStudentGuardian): Promise<StudentGuardian> {
    const [relation] = await db.insert(studentGuardians).values(relationData).returning();
    return relation;
  }
  
  async updateStudentGuardian(id: number, relationData: Partial<StudentGuardian>): Promise<StudentGuardian | undefined> {
    const [updatedRelation] = await db.update(studentGuardians)
      .set(relationData)
      .where(eq(studentGuardians.id, id))
      .returning();
    return updatedRelation;
  }
  
  async deleteStudentGuardian(id: number): Promise<boolean> {
    await db.delete(studentGuardians).where(eq(studentGuardians.id, id));
    return true;
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }
  
  async markNotificationAsUnread(id: number): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: false })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllNotificationsForUser(userId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  // Implementatie van de getOutstandingDebts functie voor de DatabaseStorage
  async getOutstandingDebts(): Promise<any[]> {
    const outstandingFees = await db.select({
      id: fees.id,
      studentId: fees.studentId,
      firstName: students.firstName,
      lastName: students.lastName,
      invoiceNumber: fees.invoiceNumber,
      amount: fees.amount,
      dueDate: fees.dueDate,
      status: fees.status
    })
    .from(fees)
    .innerJoin(students, eq(fees.studentId, students.id))
    .where(eq(fees.status, 'pending'))
    .orderBy(desc(fees.dueDate));
    
    return outstandingFees;
  }

  // Basic operations for compatibility
  async getStudents(): Promise<any[]> {
    try {
      const { students } = await import("@shared/schema");
      return await db.select().from(students);
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  async getTeachers(): Promise<any[]> {
    try {
      const { teachers } = await import("@shared/schema");
      return await db.select().from(teachers);
    } catch (error) {
      console.error('Error getting teachers:', error);
      return [];
    }
  }

  async getPrograms(): Promise<any[]> {
    try {
      const { programs } = await import("@shared/schema");
      return await db.select().from(programs);
    } catch (error) {
      console.error('Error getting programs:', error);
      return [];
    }
  }

  // Student Siblings operations
  async getStudentSiblings(studentId: number): Promise<any[]> {
    try {
      const { studentSiblings, students } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const siblings = await db
        .select({
          id: studentSiblings.id,
          studentId: studentSiblings.studentId,
          siblingId: studentSiblings.siblingId,
          relationship: studentSiblings.relationship,
          createdAt: studentSiblings.createdAt,
          firstName: students.firstName,
          lastName: students.lastName,
          studentIdCode: students.studentId
        })
        .from(studentSiblings)
        .innerJoin(students, eq(studentSiblings.siblingId, students.id))
        .where(eq(studentSiblings.studentId, studentId));

      return siblings;
    } catch (error) {
      console.error('Error getting student siblings:', error);
      return [];
    }
  }

  async addStudentSibling(studentId: number, siblingId: number, relationship: string = "sibling"): Promise<void> {
    try {
      const { studentSiblings } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      // Check if relationship already exists
      const existing = await db
        .select()
        .from(studentSiblings)
        .where(
          and(
            eq(studentSiblings.studentId, studentId),
            eq(studentSiblings.siblingId, siblingId)
          )
        );

      if (existing.length === 0) {
        // Add the relationship in both directions for bidirectionality
        await db.insert(studentSiblings).values([
          { studentId, siblingId, relationship },
          { studentId: siblingId, siblingId: studentId, relationship }
        ]);
      }
    } catch (error) {
      console.error('Error adding student sibling:', error);
      throw error;
    }
  }

  async removeStudentSibling(studentId: number, siblingId: number): Promise<void> {
    try {
      const { studentSiblings } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      // Remove the relationship in both directions
      await db.delete(studentSiblings).where(
        and(
          eq(studentSiblings.studentId, studentId),
          eq(studentSiblings.siblingId, siblingId)
        )
      );
      
      await db.delete(studentSiblings).where(
        and(
          eq(studentSiblings.studentId, siblingId),
          eq(studentSiblings.siblingId, studentId)
        )
      );
    } catch (error) {
      console.error('Error removing student sibling:', error);
      throw error;
    }
  }
}