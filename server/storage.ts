import { 
  users, type User, type InsertUser, 
  feeDiscounts, type FeeDiscount, type InsertFeeDiscount,
  feeSettings, type FeeSettings, type InsertFeeSettings,
  fees, type Fee, type InsertFee,
  messages, type Message, type InsertMessage,
  payments, type Payment, type InsertPayment,
  invoices, type Invoice, type InsertInvoice,
  tuitionRates, type TuitionRate, type InsertTuitionRate,
  students, teachers, guardians, studentGuardians
} from "@shared/schema";
import { db } from "./db";
import { and, eq, sql, count, desc } from "drizzle-orm";

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
  
  // Schedule operations (temporarily disabled)
  // getSchedules(): Promise<Schedule[]>;
  // getSchedule(id: number): Promise<Schedule | undefined>;
  // createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  // updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule | undefined>;
  // deleteSchedule(id: number): Promise<boolean>;
  
  // Invoice operations (Facturen)
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesByStudent(studentId: number): Promise<Invoice[]>;
  getInvoicesByClass(classId: number): Promise<Invoice[]>;
  getInvoicesByStatus(status: string): Promise<Invoice[]>;
  getInvoicesByType(type: string): Promise<Invoice[]>;
  getInvoicesByAcademicYear(academicYear: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  generateInvoiceNumber(type: string): Promise<string>;
  calculateInvoiceAmount(baseAmount: number, studentId: number, academicYear: string): Promise<{ finalAmount: number; discountAmount: number; appliedDiscounts: string[] }>;
  
  // Tuition Rate operations (Tarieven)
  getTuitionRates(): Promise<TuitionRate[]>;
  getTuitionRate(id: number): Promise<TuitionRate | undefined>;
  getTuitionRateByTypeAndYear(type: string, academicYear: string): Promise<TuitionRate | undefined>;
  createTuitionRate(rate: InsertTuitionRate): Promise<TuitionRate>;
  updateTuitionRate(id: number, rate: Partial<TuitionRate>): Promise<TuitionRate | undefined>;
  deleteTuitionRate(id: number): Promise<boolean>;

  // Payment operations (Mollie)
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByMollieId(molliePaymentId: string): Promise<Payment | undefined>;
  getPaymentsByStudent(studentId: number): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  getPaymentsByStatus(status: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  updatePaymentByMollieId(molliePaymentId: string, payment: Partial<Payment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  getPaymentStats(): Promise<{ 
    totalPaid: number; 
    totalPending: number; 
    totalFailed: number; 
    successRate: number;
  } | undefined>;

  // Student Siblings operations
  getStudentSiblings(studentId: number): Promise<StudentSibling[]>;
  addStudentSibling(studentId: number, siblingId: number, relationship?: string): Promise<void>;
  removeStudentSibling(studentId: number, siblingId: number): Promise<void>;
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
    try {
      // Bereken echte statistieken van facturen en betalingen
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      
      const totalCollectedResult = await db.select({ 
        total: sql`COALESCE(SUM(${invoices.finalAmount}), 0)` 
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'paid'),
        eq(invoices.academicYear, academicYear)
      ));

      const pendingAmountResult = await db.select({ 
        total: sql`COALESCE(SUM(${invoices.finalAmount}), 0)` 
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'open'),
        eq(invoices.academicYear, academicYear)
      ));

      const overdueAmountResult = await db.select({ 
        total: sql`COALESCE(SUM(${invoices.finalAmount}), 0)` 
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'overdue'),
        eq(invoices.academicYear, academicYear)
      ));

      const totalStudentsResult = await db.select({ 
        count: sql`COUNT(DISTINCT ${students.id})` 
      })
      .from(students)
      .where(eq(students.status, 'active'));

      const pendingInvoicesResult = await db.select({ 
        count: sql`COUNT(*)` 
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'open'),
        eq(invoices.academicYear, academicYear)
      ));

      const totalCollected = Number(totalCollectedResult[0]?.total) || 0;
      const pendingAmount = Number(pendingAmountResult[0]?.total) || 0;
      const overdueAmount = Number(overdueAmountResult[0]?.total) || 0;
      const totalStudents = Number(totalStudentsResult[0]?.count) || 0;
      const pendingInvoices = Number(pendingInvoicesResult[0]?.count) || 0;
      
      const totalAmount = totalCollected + pendingAmount + overdueAmount;
      const completionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

      return {
        totalCollected,
        pendingAmount,
        totalStudents,
        completionRate,
        overdueAmount,
        pendingInvoices
      };
    } catch (error) {
      console.error('Error calculating fee stats:', error);
      return {
        totalCollected: 0,
        pendingAmount: 0,
        totalStudents: 0,
        completionRate: 0,
        overdueAmount: 0,
        pendingInvoices: 0
      };
    }
  }
  
  async getOutstandingDebts(): Promise<any[]> {
    try {
      return await db.select({
        studentId: invoices.studentId,
        studentName: sql`CONCAT(${students.firstName}, ' ', ${students.lastName})`,
        totalAmount: sql`SUM(${invoices.finalAmount})`,
        oldestDueDate: sql`MIN(${invoices.dueDate})`,
        invoiceCount: sql`COUNT(*)`
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(eq(invoices.status, 'overdue'))
      .groupBy(invoices.studentId, students.firstName, students.lastName)
      .orderBy(sql`MIN(${invoices.dueDate})`);
    } catch (error) {
      console.error('Error fetching outstanding debts:', error);
      return [];
    }
  }

  // Invoice operations implementatie
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice || undefined;
  }

  async getInvoicesByStudent(studentId: number): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByClass(classId: number): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.classId, classId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.status, status))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByType(type: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.type, type))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByAcademicYear(academicYear: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.academicYear, academicYear))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async generateInvoiceNumber(type: string): Promise<string> {
    // Genereer uniek factuurnummer met prefix
    const year = new Date().getFullYear();
    const prefix = type.toUpperCase();
    
    // Zoek het hoogste nummer voor dit type in dit jaar
    const lastInvoice = await db.select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${`${prefix}${year}%`}`)
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoiceNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
  }

  async calculateInvoiceAmount(baseAmount: number, studentId: number, academicYear: string): Promise<{ finalAmount: number; discountAmount: number; appliedDiscounts: string[] }> {
    // Zoek alle actieve kortingen voor dit academisch jaar
    const applicableDiscounts = await db.select()
      .from(feeDiscounts)
      .where(and(
        eq(feeDiscounts.academicYear, academicYear),
        eq(feeDiscounts.isActive, true)
      ));

    let totalDiscountAmount = 0;
    const appliedDiscounts: string[] = [];

    for (const discount of applicableDiscounts) {
      // Hier kun je logica toevoegen om te controleren of korting van toepassing is
      // Voor nu passen we alle kortingen toe (kan uitgebreid worden)
      
      if (discount.type === 'percentage') {
        const discountAmount = (baseAmount * (discount.value || 0)) / 100;
        totalDiscountAmount += discountAmount;
        appliedDiscounts.push(`${discount.name} (${discount.value}%)`);
      } else if (discount.type === 'fixed') {
        totalDiscountAmount += discount.value || 0;
        appliedDiscounts.push(`${discount.name} (€${discount.value})`);
      }
    }

    const finalAmount = Math.max(0, baseAmount - totalDiscountAmount);

    return {
      finalAmount,
      discountAmount: totalDiscountAmount,
      appliedDiscounts
    };
  }

  // Tuition Rate operations implementatie
  async getTuitionRates(): Promise<TuitionRate[]> {
    return await db.select().from(tuitionRates).orderBy(desc(tuitionRates.academicYear));
  }

  async getTuitionRate(id: number): Promise<TuitionRate | undefined> {
    const [rate] = await db.select().from(tuitionRates).where(eq(tuitionRates.id, id));
    return rate || undefined;
  }

  async getTuitionRateByTypeAndYear(type: string, academicYear: string): Promise<TuitionRate | undefined> {
    const [rate] = await db.select().from(tuitionRates)
      .where(and(
        eq(tuitionRates.type, type),
        eq(tuitionRates.academicYear, academicYear),
        eq(tuitionRates.isActive, true)
      ));
    return rate || undefined;
  }

  async createTuitionRate(rate: InsertTuitionRate): Promise<TuitionRate> {
    const [newRate] = await db.insert(tuitionRates).values(rate).returning();
    return newRate;
  }

  async updateTuitionRate(id: number, rate: Partial<TuitionRate>): Promise<TuitionRate | undefined> {
    const [updatedRate] = await db
      .update(tuitionRates)
      .set(rate)
      .where(eq(tuitionRates.id, id))
      .returning();
    return updatedRate || undefined;
  }

  async deleteTuitionRate(id: number): Promise<boolean> {
    const result = await db.delete(tuitionRates).where(eq(tuitionRates.id, id));
    return (result.rowCount || 0) > 0;
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

  // Payment operations (Mollie)
  async getPayments(): Promise<Payment[]> {
    const result = await db.select().from(payments).orderBy(desc(payments.createdAt));
    return result;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByMollieId(molliePaymentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.molliePaymentId, molliePaymentId));
    return payment || undefined;
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    const result = await db.select().from(payments).where(eq(payments.studentId, studentId));
    return result;
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    const result = await db.select().from(payments).where(eq(payments.status, status));
    return result;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  async updatePaymentByMollieId(molliePaymentId: string, payment: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.molliePaymentId, molliePaymentId))
      .returning();
    return updatedPayment || undefined;
  }

  async deletePayment(id: number): Promise<boolean> {
    const [deletedPayment] = await db.delete(payments).where(eq(payments.id, id)).returning();
    return !!deletedPayment;
  }

  async getPaymentStats(): Promise<{ 
    totalPaid: number; 
    totalPending: number; 
    totalFailed: number; 
    successRate: number;
  } | undefined> {
    try {
      const result = await db
        .select({
          status: payments.status,
          amount: payments.amount,
          count: sql<number>`count(*)`
        })
        .from(payments)
        .groupBy(payments.status);

      let totalPaid = 0;
      let totalPending = 0;
      let totalFailed = 0;
      let totalCount = 0;
      let paidCount = 0;

      for (const row of result) {
        const amount = parseFloat(row.amount);
        const count = row.count;
        totalCount += count;
        
        if (row.status === 'paid') {
          totalPaid += amount * count;
          paidCount += count;
        } else if (row.status === 'pending') {
          totalPending += amount * count;
        } else if (row.status === 'failed' || row.status === 'canceled') {
          totalFailed += amount * count;
        }
      }

      const successRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

      return {
        totalPaid,
        totalPending,
        totalFailed,
        successRate
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();