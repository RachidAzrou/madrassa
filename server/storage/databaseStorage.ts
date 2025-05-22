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
  // Users
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
}