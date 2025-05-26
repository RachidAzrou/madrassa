import { 
  users, type User, type InsertUser, 
  feeDiscounts, type FeeDiscount, type InsertFeeDiscount,
  feeSettings, type FeeSettings, type InsertFeeSettings,
  fees, type Fee, type InsertFee,
  messages, type Message, type InsertMessage,
  students, teachers, guardians, studentGuardians
} from "@shared/schema";
import { db } from "./db";
import { and, eq, sql, count } from "drizzle-orm";

// Interface voor storage operaties
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Fee operations
  getFees(): Promise<Fee[]>;
  getFee(id: number): Promise<Fee | undefined>;
  getFeesByStudent(studentId: number): Promise<Fee[]>;
  getFeesByStatus(status: string): Promise<Fee[]>;
  getFeesByDateRange(startDate: Date, endDate: Date): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: number, fee: Partial<Fee>): Promise<Fee | undefined>;
  deleteFee(id: number): Promise<boolean>;
  getFeeStats(): Promise<{ 
    totalCollected: number; 
    pendingAmount: number; 
    totalStudents: number; 
    completionRate: number;
    overdueAmount: number;
    pendingInvoices: number;
  } | undefined>;
  getOutstandingDebts(): Promise<any[]>;
  
  // Fee Settings operations
  getFeeSettings(): Promise<FeeSettings[]>;
  getFeeSetting(id: number): Promise<FeeSettings | undefined>;
  getFeeSettingByAcademicYear(academicYear: string): Promise<FeeSettings | undefined>;
  createFeeSetting(setting: InsertFeeSettings): Promise<FeeSettings>;
  updateFeeSetting(id: number, setting: Partial<FeeSettings>): Promise<FeeSettings | undefined>;
  deleteFeeSetting(id: number): Promise<boolean>;
  
  // Fee Discount operations
  getFeeDiscounts(): Promise<FeeDiscount[]>;
  getFeeDiscount(id: number): Promise<FeeDiscount | undefined>;
  getFeeDiscountsByAcademicYear(academicYear: string): Promise<FeeDiscount[]>;
  createFeeDiscount(discount: InsertFeeDiscount): Promise<FeeDiscount>;
  updateFeeDiscount(id: number, discount: Partial<FeeDiscount>): Promise<FeeDiscount | undefined>;
  deleteFeeDiscount(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBySender(senderId: number, senderRole: string): Promise<Message[]>;
  getMessagesByReceiver(receiverId: number, receiverRole: string): Promise<Message[]>;
  getMessageThread(parentMessageId: number): Promise<Message[]>;
  getUnreadMessagesCount(userId: number, userRole: string): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  getAuthorizedReceivers(senderId: number, senderRole: string): Promise<{id: number, role: string, name: string}[]>;
  
  // Schedule operations
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
}

// DatabaseStorage implementatie die gebruik maakt van de database
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Fee operations
  async getFees(): Promise<Fee[]> {
    return await db.select().from(fees);
  }
  
  async getFee(id: number): Promise<Fee | undefined> {
    const [fee] = await db.select().from(fees).where(eq(fees.id, id));
    return fee || undefined;
  }
  
  async getFeesByStudent(studentId: number): Promise<Fee[]> {
    return await db.select().from(fees).where(eq(fees.studentId, studentId));
  }
  
  async getFeesByStatus(status: string): Promise<Fee[]> {
    return await db.select().from(fees).where(eq(fees.status, status));
  }
  
  async getFeesByDateRange(startDate: Date, endDate: Date): Promise<Fee[]> {
    return await db.select().from(fees).where(
      and(
        fee => fee.dueDate >= startDate,
        fee => fee.dueDate <= endDate
      )
    );
  }
  
  async createFee(fee: InsertFee): Promise<Fee> {
    const [newFee] = await db.insert(fees).values(fee).returning();
    return newFee;
  }
  
  async updateFee(id: number, fee: Partial<Fee>): Promise<Fee | undefined> {
    const [updatedFee] = await db
      .update(fees)
      .set(fee)
      .where(eq(fees.id, id))
      .returning();
    return updatedFee || undefined;
  }
  
  async deleteFee(id: number): Promise<boolean> {
    const result = await db.delete(fees).where(eq(fees.id, id));
    return result.rowCount > 0;
  }
  
  async getFeeStats(): Promise<{ 
    totalCollected: number; 
    pendingAmount: number; 
    totalStudents: number; 
    completionRate: number;
    overdueAmount: number;
    pendingInvoices: number;
  } | undefined> {
    // Placeholder implementation - real implementation would calculate these values
    return {
      totalCollected: 0,
      pendingAmount: 0,
      totalStudents: 0,
      completionRate: 0,
      overdueAmount: 0,
      pendingInvoices: 0
    };
  }
  
  async getOutstandingDebts(): Promise<any[]> {
    // Placeholder implementation
    return [];
  }
  
  // Fee Settings operations
  async getFeeSettings(): Promise<FeeSettings[]> {
    return await db.select().from(feeSettings);
  }
  
  async getFeeSetting(id: number): Promise<FeeSettings | undefined> {
    const [setting] = await db.select().from(feeSettings).where(eq(feeSettings.id, id));
    return setting || undefined;
  }
  
  async getFeeSettingByAcademicYear(academicYear: string): Promise<FeeSettings | undefined> {
    const [setting] = await db.select().from(feeSettings).where(eq(feeSettings.academicYear, academicYear));
    return setting || undefined;
  }
  
  async createFeeSetting(setting: InsertFeeSettings): Promise<FeeSettings> {
    const [newSetting] = await db.insert(feeSettings).values(setting).returning();
    return newSetting;
  }
  
  async updateFeeSetting(id: number, setting: Partial<FeeSettings>): Promise<FeeSettings | undefined> {
    const [updatedSetting] = await db
      .update(feeSettings)
      .set(setting)
      .where(eq(feeSettings.id, id))
      .returning();
    return updatedSetting || undefined;
  }
  
  async deleteFeeSetting(id: number): Promise<boolean> {
    const result = await db.delete(feeSettings).where(eq(feeSettings.id, id));
    return result.rowCount > 0;
  }
  
  // Fee Discount operations
  async getFeeDiscounts(): Promise<FeeDiscount[]> {
    return await db.select().from(feeDiscounts);
  }
  
  async getFeeDiscount(id: number): Promise<FeeDiscount | undefined> {
    const [discount] = await db.select().from(feeDiscounts).where(eq(feeDiscounts.id, id));
    return discount || undefined;
  }
  
  async getFeeDiscountsByAcademicYear(academicYear: string): Promise<FeeDiscount[]> {
    return await db.select().from(feeDiscounts).where(eq(feeDiscounts.academicYear, academicYear));
  }
  
  async createFeeDiscount(discount: InsertFeeDiscount): Promise<FeeDiscount> {
    const [newDiscount] = await db.insert(feeDiscounts).values(discount).returning();
    return newDiscount;
  }
  
  async updateFeeDiscount(id: number, discount: Partial<FeeDiscount>): Promise<FeeDiscount | undefined> {
    const [updatedDiscount] = await db
      .update(feeDiscounts)
      .set(discount)
      .where(eq(feeDiscounts.id, id))
      .returning();
    return updatedDiscount || undefined;
  }
  
  async deleteFeeDiscount(id: number): Promise<boolean> {
    const result = await db.delete(feeDiscounts).where(eq(feeDiscounts.id, id));
    return result.rowCount > 0;
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesBySender(senderId: number, senderRole: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(and(
        eq(messages.senderId, senderId),
        eq(messages.senderRole, senderRole)
      ));
  }

  async getMessagesByReceiver(receiverId: number, receiverRole: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(and(
        eq(messages.receiverId, receiverId),
        eq(messages.receiverRole, receiverRole)
      ));
  }

  async getMessageThread(parentMessageId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.parentMessageId, parentMessageId));
  }

  async getUnreadMessagesCount(userId: number, userRole: string): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.receiverRole, userRole),
        eq(messages.isRead, false)
      ));
    
    return Number(result[0]?.count) || 0;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [createdMessage] = await db.insert(messages).values(message).returning();
    return createdMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  async getAuthorizedReceivers(senderId: number, senderRole: string): Promise<{ id: number; role: string; name: string; }[]> {
    // Implementeer rolgebaseerde beperkingen voor berichten
    // Bijvoorbeeld: Docenten kunnen berichten sturen naar studenten en voogden, maar studenten kunnen alleen berichten sturen naar docenten
    
    let receivers: { id: number; role: string; name: string; }[] = [];
    
    // Implementeer de regels voor wie berichten kan ontvangen op basis van de rol van de afzender
    switch (senderRole) {
      case 'admin':
        // Admin kan berichten sturen naar iedereen
        const adminToTeachers = await db.select({
          id: teachers.id,
          role: sql<string>`'teacher'`.as('role'),
          name: sql<string>`CONCAT(${teachers.firstName}, ' ', ${teachers.lastName})`.as('name')
        }).from(teachers);
        
        const adminToStudents = await db.select({
          id: students.id,
          role: sql<string>`'student'`.as('role'),
          name: sql<string>`CONCAT(${students.firstName}, ' ', ${students.lastName})`.as('name')
        }).from(students);
        
        const adminToGuardians = await db.select({
          id: guardians.id,
          role: sql<string>`'guardian'`.as('role'),
          name: sql<string>`CONCAT(${guardians.firstName}, ' ', ${guardians.lastName})`.as('name')
        }).from(guardians);
        
        receivers = [
          ...(adminToTeachers as unknown as { id: number; role: string; name: string; }[]), 
          ...(adminToStudents as unknown as { id: number; role: string; name: string; }[]), 
          ...(adminToGuardians as unknown as { id: number; role: string; name: string; }[])
        ];
        break;
        
      case 'teacher':
        // Docenten kunnen berichten sturen naar studenten, voogden en admins
        const teacherToStudents = await db.select({
          id: students.id,
          role: sql<string>`'student'`.as('role'),
          name: sql<string>`CONCAT(${students.firstName}, ' ', ${students.lastName})`.as('name')
        }).from(students);
        
        const teacherToGuardians = await db.select({
          id: guardians.id,
          role: sql<string>`'guardian'`.as('role'),
          name: sql<string>`CONCAT(${guardians.firstName}, ' ', ${guardians.lastName})`.as('name')
        }).from(guardians);
        
        const teacherToAdmins = await db.select({
          id: users.id,
          role: users.role,
          name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('name')
        }).from(users).where(eq(users.role, 'admin'));
        
        receivers = [
          ...(teacherToStudents as unknown as { id: number; role: string; name: string; }[]), 
          ...(teacherToGuardians as unknown as { id: number; role: string; name: string; }[]), 
          ...(teacherToAdmins as unknown as { id: number; role: string; name: string; }[])
        ];
        break;
        
      case 'student':
        // Studenten kunnen alleen berichten sturen naar docenten en admins
        const studentToTeachers = await db.select({
          id: teachers.id,
          role: sql<string>`'teacher'`.as('role'),
          name: sql<string>`CONCAT(${teachers.firstName}, ' ', ${teachers.lastName})`.as('name')
        }).from(teachers);
        
        const studentToAdmins = await db.select({
          id: users.id,
          role: users.role,
          name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('name')
        }).from(users).where(eq(users.role, 'admin'));
        
        receivers = [
          ...(studentToTeachers as unknown as { id: number; role: string; name: string; }[]), 
          ...(studentToAdmins as unknown as { id: number; role: string; name: string; }[])
        ];
        break;
        
      case 'guardian':
        // Voogden kunnen berichten sturen naar docenten, admins en hun eigen studenten
        const guardianToTeachers = await db.select({
          id: teachers.id,
          role: sql<string>`'teacher'`.as('role'),
          name: sql<string>`CONCAT(${teachers.firstName}, ' ', ${teachers.lastName})`.as('name')
        }).from(teachers);
        
        const guardianToAdmins = await db.select({
          id: users.id,
          role: users.role,
          name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('name')
        }).from(users).where(eq(users.role, 'admin'));
        
        // Voeg alleen de studenten toe die aan deze voogd zijn gekoppeld
        const guardianStudents = await db.select({
          id: students.id,
          role: sql<string>`'student'`.as('role'),
          name: sql<string>`CONCAT(${students.firstName}, ' ', ${students.lastName})`.as('name')
        })
        .from(students)
        .innerJoin(studentGuardians, eq(students.id, studentGuardians.studentId))
        .where(eq(studentGuardians.guardianId, senderId));
        
        receivers = [
          ...(guardianToTeachers as unknown as { id: number; role: string; name: string; }[]), 
          ...(guardianToAdmins as unknown as { id: number; role: string; name: string; }[]), 
          ...(guardianStudents as unknown as { id: number; role: string; name: string; }[])
        ];
        break;
    }
    
    return receivers;
  }
}

export const storage = new DatabaseStorage();