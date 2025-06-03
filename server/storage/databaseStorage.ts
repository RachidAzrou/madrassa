import { and, eq, desc, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  users, students, programs, courses, enrollments, attendance, 
  studentPrograms, grades, assessments, behaviorAssessments, events,
  fees, feeDiscounts, feeSettings, studentGroups, studentGroupEnrollments,
  lessons, examinations, guardians, studentGuardians, teachers, 
  teacherAvailability, teacherLanguages, teacherCourseAssignments,
  teacherAttendance, notifications, messages, payments, invoices, tuitionRates,
  discountTypes, studentDiscounts
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
  TeacherCourseAssignment, InsertNotification, Notification,
  InsertMessage, Message, InsertPayment, Payment, InsertInvoice, Invoice,
  InsertTuitionRate, TuitionRate, InsertDiscountType, DiscountType,
  InsertStudentDiscount, StudentDiscount
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
            relationship: relation.relationship, // Expliciet de relatie uit de studentGuardians tabel
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

  // Message operations
  async getMessages(): Promise<Message[]> {
    try {
      const allMessages = await db.select().from(messages).orderBy(desc(messages.sentAt));
      return allMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const [message] = await db.select().from(messages).where(eq(messages.id, id));
      return message;
    } catch (error) {
      console.error('Error fetching message:', error);
      throw error;
    }
  }

  async getMessagesBySender(senderId: number, senderRole: string): Promise<Message[]> {
    try {
      const senderMessages = await db.select().from(messages)
        .where(and(eq(messages.senderId, senderId), eq(messages.senderRole, senderRole)))
        .orderBy(desc(messages.sentAt));
      return senderMessages;
    } catch (error) {
      console.error('Error fetching messages by sender:', error);
      throw error;
    }
  }

  async getMessagesByReceiver(receiverId: number, receiverRole: string): Promise<Message[]> {
    try {
      const receiverMessages = await db.select().from(messages)
        .where(and(eq(messages.receiverId, receiverId), eq(messages.receiverRole, receiverRole)))
        .orderBy(desc(messages.sentAt));
      return receiverMessages;
    } catch (error) {
      console.error('Error fetching messages by receiver:', error);
      throw error;
    }
  }

  async getMessageThread(parentMessageId: number): Promise<Message[]> {
    try {
      const threadMessages = await db.select().from(messages)
        .where(eq(messages.parentMessageId, parentMessageId))
        .orderBy(messages.sentAt);
      return threadMessages;
    } catch (error) {
      console.error('Error fetching message thread:', error);
      throw error;
    }
  }

  async getUnreadMessagesCount(userId: number, userRole: string): Promise<number> {
    try {
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId), 
          eq(messages.receiverRole, userRole),
          eq(messages.isRead, false)
        ));
      return result?.count || 0;
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      throw error;
    }
  }

  async getAuthorizedReceivers(senderId: number, senderRole: string): Promise<{ id: number; role: string; name: string }[]> {
    try {
      const receivers: { id: number; role: string; name: string }[] = [];

      // Role-based communication rules
      switch (senderRole) {
        case 'admin':
        case 'secretariaat':
          // Admin and secretariaat can message everyone
          const allStudents = await db.select().from(students);
          const allTeachers = await db.select().from(teachers);
          const allGuardians = await db.select().from(guardians);
          
          receivers.push(...allStudents.map(s => ({ 
            id: s.id, 
            role: 'student', 
            name: `${s.firstName} ${s.lastName}` 
          })));
          receivers.push(...allTeachers.map(t => ({ 
            id: t.id, 
            role: 'docent', 
            name: `${t.firstName} ${t.lastName}` 
          })));
          receivers.push(...allGuardians.map(g => ({ 
            id: g.id, 
            role: 'voogd', 
            name: `${g.firstName} ${g.lastName}` 
          })));
          break;

        case 'docent':
          // Teachers can message their students, guardians of their students, other teachers, and admin/secretariaat
          const teacherStudents = await db.select({ 
            student: students 
          })
          .from(students)
          .innerJoin(enrollments, eq(students.id, enrollments.studentId))
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .innerJoin(teacherCourseAssignments, eq(courses.id, teacherCourseAssignments.courseId))
          .where(eq(teacherCourseAssignments.teacherId, senderId));

          for (const { student } of teacherStudents) {
            receivers.push({ 
              id: student.id, 
              role: 'student', 
              name: `${student.firstName} ${student.lastName}` 
            });

            // Add guardians of these students
            const studentGuardianRelations = await db.select({ guardian: guardians })
              .from(guardians)
              .innerJoin(studentGuardians, eq(guardians.id, studentGuardians.guardianId))
              .where(eq(studentGuardians.studentId, student.id));

            for (const { guardian } of studentGuardianRelations) {
              receivers.push({ 
                id: guardian.id, 
                role: 'voogd', 
                name: `${guardian.firstName} ${guardian.lastName}` 
              });
            }
          }

          // Add other teachers
          const otherTeachers = await db.select().from(teachers).where(sql`${teachers.id} != ${senderId}`);
          receivers.push(...otherTeachers.map(t => ({ 
            id: t.id, 
            role: 'docent', 
            name: `${t.firstName} ${t.lastName}` 
          })));
          break;

        case 'student':
          // Students can message their teachers and classmates
          const studentTeachers = await db.select({ teacher: teachers })
            .from(teachers)
            .innerJoin(teacherCourseAssignments, eq(teachers.id, teacherCourseAssignments.teacherId))
            .innerJoin(courses, eq(teacherCourseAssignments.courseId, courses.id))
            .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
            .where(eq(enrollments.studentId, senderId));

          receivers.push(...studentTeachers.map(({ teacher }) => ({ 
            id: teacher.id, 
            role: 'docent', 
            name: `${teacher.firstName} ${teacher.lastName}` 
          })));

          // Add classmates
          const classmates = await db.select({ student: students })
            .from(students)
            .innerJoin(enrollments, eq(students.id, enrollments.studentId))
            .where(and(
              eq(enrollments.courseId, sql`(SELECT course_id FROM enrollments WHERE student_id = ${senderId} LIMIT 1)`),
              sql`${students.id} != ${senderId}`
            ));

          receivers.push(...classmates.map(({ student }) => ({ 
            id: student.id, 
            role: 'student', 
            name: `${student.firstName} ${student.lastName}` 
          })));
          break;

        case 'voogd':
          // Guardians can message their children, children's teachers, admin, and secretariaat
          const guardianChildren = await db.select({ student: students })
            .from(students)
            .innerJoin(studentGuardians, eq(students.id, studentGuardians.studentId))
            .where(eq(studentGuardians.guardianId, senderId));

          for (const { student } of guardianChildren) {
            receivers.push({ 
              id: student.id, 
              role: 'student', 
              name: `${student.firstName} ${student.lastName}` 
            });

            // Add teachers of these children
            const childTeachers = await db.select({ teacher: teachers })
              .from(teachers)
              .innerJoin(teacherCourseAssignments, eq(teachers.id, teacherCourseAssignments.teacherId))
              .innerJoin(courses, eq(teacherCourseAssignments.courseId, courses.id))
              .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
              .where(eq(enrollments.studentId, student.id));

            receivers.push(...childTeachers.map(({ teacher }) => ({ 
              id: teacher.id, 
              role: 'docent', 
              name: `${teacher.firstName} ${teacher.lastName}` 
            })));
          }
          break;
      }

      // Remove duplicates
      const uniqueReceivers = receivers.filter((receiver, index, self) => 
        index === self.findIndex(r => r.id === receiver.id && r.role === receiver.role)
      );

      return uniqueReceivers;
    } catch (error) {
      console.error('Error fetching authorized receivers:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const [newMessage] = await db.insert(messages).values(message).returning();
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number): Promise<Message | undefined> {
    try {
      const [updatedMessage] = await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId))
        .returning();
      return updatedMessage;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<boolean> {
    try {
      const result = await db.delete(messages).where(eq(messages.id, messageId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    try {
      const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
      return allPayments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, id));
      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async getPaymentByMollieId(molliePaymentId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.molliePaymentId, molliePaymentId));
      return payment;
    } catch (error) {
      console.error('Error fetching payment by Mollie ID:', error);
      throw error;
    }
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    try {
      const studentPayments = await db.select().from(payments)
        .where(eq(payments.studentId, studentId))
        .orderBy(desc(payments.createdAt));
      return studentPayments;
    } catch (error) {
      console.error('Error fetching payments by student:', error);
      throw error;
    }
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    try {
      const invoicePayments = await db.select().from(payments)
        .where(eq(payments.invoiceId, invoiceId))
        .orderBy(desc(payments.createdAt));
      return invoicePayments;
    } catch (error) {
      console.error('Error fetching payments by invoice:', error);
      throw error;
    }
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    try {
      const statusPayments = await db.select().from(payments)
        .where(eq(payments.status, status))
        .orderBy(desc(payments.createdAt));
      return statusPayments;
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      throw error;
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const [newPayment] = await db.insert(payments).values(payment).returning();
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const [updatedPayment] = await db.update(payments)
        .set(payment)
        .where(eq(payments.id, id))
        .returning();
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async updatePaymentByMollieId(molliePaymentId: string, payment: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const [updatedPayment] = await db.update(payments)
        .set(payment)
        .where(eq(payments.molliePaymentId, molliePaymentId))
        .returning();
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment by Mollie ID:', error);
      throw error;
    }
  }

  async deletePayment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(payments).where(eq(payments.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  async getPaymentStats(): Promise<{ 
    totalPaid: number; 
    totalPending: number; 
    totalFailed: number; 
    successRate: number;
  } | undefined> {
    try {
      const [paidStats] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
      }).from(payments).where(eq(payments.status, 'betaald'));

      const [pendingStats] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
      }).from(payments).where(eq(payments.status, 'openstaand'));

      const [failedStats] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
      }).from(payments).where(eq(payments.status, 'mislukt'));

      const [totalStats] = await db.select({ 
        count: sql<number>`COUNT(*)`
      }).from(payments);

      const [successStats] = await db.select({ 
        count: sql<number>`COUNT(*)`
      }).from(payments).where(eq(payments.status, 'betaald'));

      const totalPaid = Number(paidStats?.total || 0);
      const totalPending = Number(pendingStats?.total || 0);
      const totalFailed = Number(failedStats?.total || 0);
      const successRate = totalStats?.count > 0 ? (Number(successStats?.count || 0) / Number(totalStats.count)) * 100 : 0;

      return {
        totalPaid,
        totalPending,
        totalFailed,
        successRate
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    try {
      const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
      return allInvoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      return invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
      return invoice;
    } catch (error) {
      console.error('Error fetching invoice by number:', error);
      throw error;
    }
  }

  async getInvoicesByStudent(studentId: number): Promise<Invoice[]> {
    try {
      const studentInvoices = await db.select().from(invoices)
        .where(eq(invoices.studentId, studentId))
        .orderBy(desc(invoices.createdAt));
      return studentInvoices;
    } catch (error) {
      console.error('Error fetching invoices by student:', error);
      throw error;
    }
  }

  async getInvoicesByClass(classId: number): Promise<Invoice[]> {
    try {
      const classInvoices = await db.select().from(invoices)
        .where(eq(invoices.classId, classId))
        .orderBy(desc(invoices.createdAt));
      return classInvoices;
    } catch (error) {
      console.error('Error fetching invoices by class:', error);
      throw error;
    }
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    try {
      const statusInvoices = await db.select().from(invoices)
        .where(eq(invoices.status, status))
        .orderBy(desc(invoices.createdAt));
      return statusInvoices;
    } catch (error) {
      console.error('Error fetching invoices by status:', error);
      throw error;
    }
  }

  async getInvoicesByType(type: string): Promise<Invoice[]> {
    try {
      const typeInvoices = await db.select().from(invoices)
        .where(eq(invoices.type, type))
        .orderBy(desc(invoices.createdAt));
      return typeInvoices;
    } catch (error) {
      console.error('Error fetching invoices by type:', error);
      throw error;
    }
  }

  async getInvoicesByAcademicYear(academicYear: string): Promise<Invoice[]> {
    try {
      const yearInvoices = await db.select().from(invoices)
        .where(eq(invoices.academicYear, academicYear))
        .orderBy(desc(invoices.createdAt));
      return yearInvoices;
    } catch (error) {
      console.error('Error fetching invoices by academic year:', error);
      throw error;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [newInvoice] = await db.insert(invoices).values(invoice).returning();
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const [updatedInvoice] = await db.update(invoices)
        .set(invoice)
        .where(eq(invoices.id, id))
        .returning();
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(type: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const [lastInvoice] = await db.select()
        .from(invoices)
        .where(and(
          eq(invoices.type, type),
          sql`EXTRACT(YEAR FROM created_at) = ${year}`
        ))
        .orderBy(desc(invoices.createdAt))
        .limit(1);

      let sequence = 1;
      if (lastInvoice) {
        const lastNumber = lastInvoice.invoiceNumber;
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          sequence = parseInt(match[1]) + 1;
        }
      }

      return `${type}${year}${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  async calculateInvoiceAmount(baseAmount: number, studentId: number, academicYear: string): Promise<{ finalAmount: number; discountAmount: number; appliedDiscounts: string[] }> {
    try {
      let discountAmount = 0;
      const appliedDiscounts: string[] = [];

      // Get active discounts for this student
      const studentDiscountsList = await db.select()
        .from(studentDiscounts)
        .where(and(
          eq(studentDiscounts.studentId, studentId),
          eq(studentDiscounts.academicYear, academicYear),
          eq(studentDiscounts.isActive, true)
        ));

      // Calculate automatic family discount if applicable
      const familyDiscount = await this.calculateFamilyDiscount(studentId, academicYear);
      if (familyDiscount.percentage > 0) {
        const familyDiscountAmount = (baseAmount * familyDiscount.percentage) / 100;
        discountAmount += familyDiscountAmount;
        appliedDiscounts.push(`Familiekorting (${familyDiscount.percentage}%)`);
        
        // Auto-apply family discount if not already exists
        const existingFamilyDiscount = studentDiscountsList.find(d => d.discountType === 'FAMILY');
        if (!existingFamilyDiscount) {
          await this.createStudentDiscount({
            studentId,
            discountType: 'FAMILY',
            discountPercentage: familyDiscount.percentage,
            discountAmount: familyDiscountAmount.toString(),
            description: `Automatische familiekorting - ${familyDiscount.siblingCount} kinderen`,
            isAutomatic: true,
            academicYear,
            isActive: true,
          });
        }
      }

      // Apply manual discounts
      for (const discount of studentDiscountsList) {
        if (discount.discountType !== 'FAMILY') { // Family discount already calculated
          const manualDiscountAmount = discount.discountAmount 
            ? parseFloat(discount.discountAmount) 
            : (baseAmount * parseFloat(discount.discountPercentage)) / 100;
          
          discountAmount += manualDiscountAmount;
          appliedDiscounts.push(`${discount.description} (${discount.discountPercentage}%)`);
        }
      }

      const finalAmount = Math.max(0, baseAmount - discountAmount);

      return {
        finalAmount,
        discountAmount,
        appliedDiscounts
      };
    } catch (error) {
      console.error('Error calculating invoice amount:', error);
      throw error;
    }
  }

  // Discount operations
  async getDiscountTypes(): Promise<DiscountType[]> {
    try {
      const types = await db.select().from(discountTypes).where(eq(discountTypes.isActive, true));
      return types;
    } catch (error) {
      console.error('Error fetching discount types:', error);
      throw error;
    }
  }

  async getStudentDiscounts(studentId: number, academicYear?: string): Promise<StudentDiscount[]> {
    try {
      let query = db.select().from(studentDiscounts).where(eq(studentDiscounts.studentId, studentId));
      
      if (academicYear) {
        query = query.where(eq(studentDiscounts.academicYear, academicYear));
      }
      
      const discounts = await query.orderBy(desc(studentDiscounts.createdAt));
      return discounts;
    } catch (error) {
      console.error('Error fetching student discounts:', error);
      throw error;
    }
  }

  async createStudentDiscount(discount: InsertStudentDiscount): Promise<StudentDiscount> {
    try {
      const [newDiscount] = await db.insert(studentDiscounts).values(discount).returning();
      return newDiscount;
    } catch (error) {
      console.error('Error creating student discount:', error);
      throw error;
    }
  }

  async updateStudentDiscount(id: number, discount: Partial<StudentDiscount>): Promise<StudentDiscount | undefined> {
    try {
      const [updatedDiscount] = await db.update(studentDiscounts)
        .set({ ...discount, updatedAt: new Date() })
        .where(eq(studentDiscounts.id, id))
        .returning();
      return updatedDiscount;
    } catch (error) {
      console.error('Error updating student discount:', error);
      throw error;
    }
  }

  async deleteStudentDiscount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(studentDiscounts).where(eq(studentDiscounts.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting student discount:', error);
      throw error;
    }
  }

  async calculateFamilyDiscount(studentId: number, academicYear: string): Promise<{ percentage: number; siblingCount: number }> {
    try {
      // Get student's guardians
      const studentGuardianRelations = await db.select()
        .from(studentGuardians)
        .where(eq(studentGuardians.studentId, studentId));

      if (studentGuardianRelations.length === 0) {
        return { percentage: 0, siblingCount: 0 };
      }

      // Get all students with same guardians
      const guardianIds = studentGuardianRelations.map(sg => sg.guardianId);
      const siblingRelations = await db.select({ studentId: studentGuardians.studentId })
        .from(studentGuardians)
        .where(sql`${studentGuardians.guardianId} = ANY(${guardianIds})`);

      const uniqueSiblingIds = [...new Set(siblingRelations.map(sr => sr.studentId))];
      const siblingCount = uniqueSiblingIds.length;

      // Family discount logic: 10% per child if >= 2 children
      if (siblingCount >= 2) {
        const basePercentage = 10;
        const additionalPercentage = Math.min((siblingCount - 2) * 5, 20); // Max 20% additional
        return { 
          percentage: basePercentage + additionalPercentage, 
          siblingCount 
        };
      }

      return { percentage: 0, siblingCount };
    } catch (error) {
      console.error('Error calculating family discount:', error);
      return { percentage: 0, siblingCount: 0 };
    }
  }

  async applyAutomaticDiscounts(studentId: number, academicYear: string): Promise<void> {
    try {
      // Apply family discount
      const familyDiscount = await this.calculateFamilyDiscount(studentId, academicYear);
      
      if (familyDiscount.percentage > 0) {
        // Check if family discount already exists
        const existingDiscount = await db.select()
          .from(studentDiscounts)
          .where(and(
            eq(studentDiscounts.studentId, studentId),
            eq(studentDiscounts.discountType, 'FAMILY'),
            eq(studentDiscounts.academicYear, academicYear),
            eq(studentDiscounts.isActive, true)
          ));

        if (existingDiscount.length === 0) {
          await this.createStudentDiscount({
            studentId,
            discountType: 'FAMILY',
            discountPercentage: familyDiscount.percentage,
            description: `Automatische familiekorting - ${familyDiscount.siblingCount} kinderen`,
            isAutomatic: true,
            academicYear,
            isActive: true,
          });
        }
      }
    } catch (error) {
      console.error('Error applying automatic discounts:', error);
      throw error;
    }
  }

  // Tuition Rate operations
  async getTuitionRates(): Promise<TuitionRate[]> {
    try {
      const allRates = await db.select().from(tuitionRates).orderBy(desc(tuitionRates.createdAt));
      return allRates;
    } catch (error) {
      console.error('Error fetching tuition rates:', error);
      throw error;
    }
  }

  async getTuitionRate(id: number): Promise<TuitionRate | undefined> {
    try {
      const [rate] = await db.select().from(tuitionRates).where(eq(tuitionRates.id, id));
      return rate;
    } catch (error) {
      console.error('Error fetching tuition rate:', error);
      throw error;
    }
  }

  async getTuitionRateByTypeAndYear(type: string, academicYear: string): Promise<TuitionRate | undefined> {
    try {
      const [rate] = await db.select().from(tuitionRates)
        .where(and(eq(tuitionRates.type, type), eq(tuitionRates.academicYear, academicYear)));
      return rate;
    } catch (error) {
      console.error('Error fetching tuition rate by type and year:', error);
      throw error;
    }
  }

  async createTuitionRate(rate: InsertTuitionRate): Promise<TuitionRate> {
    try {
      const [newRate] = await db.insert(tuitionRates).values(rate).returning();
      return newRate;
    } catch (error) {
      console.error('Error creating tuition rate:', error);
      throw error;
    }
  }

  async updateTuitionRate(id: number, rate: Partial<TuitionRate>): Promise<TuitionRate | undefined> {
    try {
      const [updatedRate] = await db.update(tuitionRates)
        .set(rate)
        .where(eq(tuitionRates.id, id))
        .returning();
      return updatedRate;
    } catch (error) {
      console.error('Error updating tuition rate:', error);
      throw error;
    }
  }

  async deleteTuitionRate(id: number): Promise<boolean> {
    try {
      const result = await db.delete(tuitionRates).where(eq(tuitionRates.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting tuition rate:', error);
      throw error;
    }
  }
}