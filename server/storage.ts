import { 
  users, type User, type InsertUser, 
  feeDiscounts, type FeeDiscount, type InsertFeeDiscount,
  feeSettings, type FeeSettings, type InsertFeeSettings,
  fees, type Fee, type InsertFee,
  messages, type Message, type InsertMessage,
  payments, type Payment, type InsertPayment,
  invoices, type Invoice, type InsertInvoice,
  tuitionRates, type TuitionRate, type InsertTuitionRate,
  students, teachers, guardians, studentGuardians, studentSiblings, type StudentSibling, type InsertStudentSibling,
  studentGroupEnrollments,
  grades, type Grade, type InsertGrade,
  assessments, type Assessment, type InsertAssessment,
  attendance, teacherAttendance, type Attendance, type TeacherAttendance, type InsertAttendance, type InsertTeacherAttendance
} from "@shared/schema";
import { db } from "./db";
import { and, eq, sql, count, desc, inArray } from "drizzle-orm";

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

  // Student operations
  getStudents(): Promise<any[]>;
  getStudent(id: number): Promise<any | undefined>;
  getStudentsByClass(classId: number): Promise<any[]>;
  
  // Student Siblings operations
  getStudentSiblings(studentId: number): Promise<StudentSibling[]>;
  addStudentSibling(studentId: number, siblingId: number, relationship?: string): Promise<void>;
  removeStudentSibling(studentId: number, siblingId: number): Promise<void>;

  // Attendance operations
  getAttendanceByDate(date: Date): Promise<any[]>;
  getAttendanceByStudent(studentId: number): Promise<any[]>;
  getAttendanceByCourse(courseId: number): Promise<any[]>;
  getAttendanceByClassAndDate(classId: number, date: Date): Promise<any[]>;
  createAttendance(attendance: any): Promise<any>;
  updateAttendance(id: number, attendance: any): Promise<any>;
  
  // Teacher Attendance operations
  getTeacherAttendanceByDate(date: Date): Promise<any[]>;
  getTeacherAttendanceByCourse(courseId: number): Promise<any[]>;
  createTeacherAttendance(attendance: any): Promise<any>;
  updateTeacherAttendance(id: number, attendance: any): Promise<any>;
  
  // Program Teachers operations
  getProgramTeachers(programId: number): Promise<any[]>;
  assignTeacherToProgram(programId: number, teacherId: number, isPrimary?: boolean): Promise<void>;
  removeTeacherFromProgram(programId: number, teacherId: number): Promise<void>;
  
  // Assessment operations
  getAssessments(): Promise<any[]>;
  getAssessment(id: number): Promise<any | undefined>;
  getAssessmentById(id: number): Promise<any | undefined>;
  getAssessmentsByCourse(courseId: number): Promise<any[]>;
  createAssessment(assessment: any): Promise<any>;
  updateAssessment(id: number, assessment: any): Promise<any | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Grades operations
  getGrades(): Promise<Grade[]>;
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByCourse(courseId: number): Promise<Grade[]>;
  getGradesByStudentAndCourse(studentId: number, courseId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  batchCreateGrades(grades: InsertGrade[]): Promise<Grade[]>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBySender(senderId: number, senderRole: string): Promise<Message[]>;
  getMessagesByReceiver(receiverId: number, receiverRole: string): Promise<Message[]>;
  getMessageThread(parentMessageId: number): Promise<Message[]>;
  getUnreadMessagesCount(receiverId: number, receiverRole: string): Promise<number>;
  getAuthorizedReceivers(senderId: number, senderRole: string): Promise<{id: number, role: string, name: string}[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
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

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    const result = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
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

  // Attendance operations
  async getAttendanceByDate(date: Date): Promise<any[]> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const attendanceData = await db.select().from(attendance).where(eq(attendance.date, dateString));
      return attendanceData;
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return [];
    }
  }

  async getAttendanceByClassAndDate(classId: number, date: Date): Promise<any[]> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const attendanceData = await db.select().from(attendance)
        .where(and(eq(attendance.courseId, classId), eq(attendance.date, dateString)));
      return attendanceData;
    } catch (error) {
      console.error('Error getting attendance by class and date:', error);
      return [];
    }
  }

  async getAttendanceByStudent(studentId: number): Promise<any[]> {
    try {
      const attendanceData = await db.select().from(attendance).where(eq(attendance.studentId, studentId));
      return attendanceData;
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      return [];
    }
  }

  async getAttendanceByCourse(courseId: number): Promise<any[]> {
    try {
      const attendanceData = await db.select().from(attendance).where(eq(attendance.courseId, courseId));
      return attendanceData;
    } catch (error) {
      console.error('Error getting attendance by course:', error);
      return [];
    }
  }

  async getTeacherAttendanceByDate(date: Date): Promise<any[]> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const attendanceData = await db.select().from(teacherAttendance).where(eq(teacherAttendance.date, dateString));
      return attendanceData;
    } catch (error) {
      console.error('Error getting teacher attendance by date:', error);
      return [];
    }
  }

  async getTeacherAttendanceByCourse(courseId: number): Promise<any[]> {
    try {
      const attendanceData = await db.select().from(teacherAttendance).where(eq(teacherAttendance.classId, courseId));
      return attendanceData;
    } catch (error) {
      console.error('Error getting teacher attendance by course:', error);
      return [];
    }
  }

  async createAttendance(attendanceData: any): Promise<any> {
    try {
      const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
      return newAttendance;
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  async updateAttendance(id: number, attendanceData: any): Promise<any> {
    try {
      const [updatedAttendance] = await db.update(attendance)
        .set(attendanceData)
        .where(eq(attendance.id, id))
        .returning();
      return updatedAttendance;
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  // Student operations
  async getStudents(): Promise<any[]> {
    try {
      const studentsData = await db.select().from(students);
      return studentsData;
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  async getStudent(id: number): Promise<any | undefined> {
    try {
      const [student] = await db.select().from(students).where(eq(students.id, id));
      return student || undefined;
    } catch (error) {
      console.error('Error getting student:', error);
      return undefined;
    }
  }

  async getStudentsByClass(classId: number): Promise<any[]> {
    try {
      console.log('Getting students for class:', classId);
      
      // First get the enrollments for this class
      const enrollments = await db
        .select()
        .from(studentGroupEnrollments)
        .where(eq(studentGroupEnrollments.groupId, classId));
      
      console.log('Found enrollments:', enrollments.length);
      
      if (enrollments.length === 0) {
        return [];
      }
      
      // Get student IDs from enrollments
      const studentIds = enrollments.map(e => e.studentId);
      console.log('Student IDs:', studentIds);
      
      // Get students with these IDs
      const studentsData = await db
        .select()
        .from(students)
        .where(inArray(students.id, studentIds));
      
      console.log('Found students:', studentsData.length);
      return studentsData;
    } catch (error) {
      console.error('Error getting students by class:', error);
      console.error('Full error:', error);
      return [];
    }
  }

  // Student Siblings operations
  async getStudentSiblings(studentId: number): Promise<StudentSibling[]> {
    try {
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

      return siblings as StudentSibling[];
    } catch (error) {
      console.error('Error getting student siblings:', error);
      return [];
    }
  }

  async addStudentSibling(studentId: number, siblingId: number, relationship: string = "sibling"): Promise<void> {
    try {
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

  // Program Teachers operations
  async getProgramTeachers(programId: number): Promise<any[]> {
    try {
      // For now, return empty array as this functionality isn't fully implemented
      return [];
    } catch (error) {
      console.error('Error getting program teachers:', error);
      return [];
    }
  }

  async assignTeacherToProgram(programId: number, teacherId: number, isPrimary: boolean = false): Promise<void> {
    try {
      // For now, this is a placeholder implementation
      console.log(`Assigning teacher ${teacherId} to program ${programId} (primary: ${isPrimary})`);
    } catch (error) {
      console.error('Error assigning teacher to program:', error);
      throw error;
    }
  }

  async removeTeacherFromProgram(programId: number, teacherId: number): Promise<void> {
    try {
      // For now, this is a placeholder implementation
      console.log(`Removing teacher ${teacherId} from program ${programId}`);
    } catch (error) {
      console.error('Error removing teacher from program:', error);
      throw error;
    }
  }

  // Grades operations

  async getGrades(): Promise<Grade[]> {
    try {
      const gradesData = await db.select().from(grades);
      return gradesData;
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    try {
      const [grade] = await db.select().from(grades).where(eq(grades.id, id));
      return grade || undefined;
    } catch (error) {
      console.error('Error getting grade:', error);
      return undefined;
    }
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    try {
      const gradesData = await db.select().from(grades).where(eq(grades.studentId, studentId));
      return gradesData;
    } catch (error) {
      console.error('Error getting grades by student:', error);
      return [];
    }
  }

  async getGradesByCourse(courseId: number): Promise<Grade[]> {
    try {
      const gradesData = await db.select().from(grades).where(eq(grades.courseId, courseId));
      return gradesData;
    } catch (error) {
      console.error('Error getting grades by course:', error);
      return [];
    }
  }

  async getGradesByStudentAndCourse(studentId: number, courseId: number): Promise<Grade[]> {
    try {
      const gradesData = await db.select().from(grades)
        .where(and(eq(grades.studentId, studentId), eq(grades.courseId, courseId)));
      return gradesData;
    } catch (error) {
      console.error('Error getting grades by student and course:', error);
      return [];
    }
  }

  // Assessment operations implementation
  async getAssessments(): Promise<any[]> {
    try {
      const assessmentsData = await db.select().from(assessments);
      return assessmentsData;
    } catch (error) {
      console.error('Error getting assessments:', error);
      return [];
    }
  }

  async getAssessment(id: number): Promise<any | undefined> {
    try {
      const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
      return assessment || undefined;
    } catch (error) {
      console.error('Error getting assessment:', error);
      return undefined;
    }
  }

  async getAssessmentById(id: number): Promise<any | undefined> {
    return this.getAssessment(id);
  }

  async getAssessmentsByCourse(courseId: number): Promise<any[]> {
    try {
      const assessmentsData = await db.select().from(assessments)
        .where(eq(assessments.courseId, courseId));
      return assessmentsData;
    } catch (error) {
      console.error('Error getting assessments by course:', error);
      return [];
    }
  }

  async createAssessment(assessment: any): Promise<any> {
    try {
      const [newAssessment] = await db.insert(assessments).values(assessment).returning();
      return newAssessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment');
    }
  }

  async updateAssessment(id: number, assessment: any): Promise<any | undefined> {
    try {
      const [updatedAssessment] = await db
        .update(assessments)
        .set(assessment)
        .where(eq(assessments.id, id))
        .returning();
      return updatedAssessment || undefined;
    } catch (error) {
      console.error('Error updating assessment:', error);
      return undefined;
    }
  }

  async deleteAssessment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assessments).where(eq(assessments.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      return false;
    }
  }

  async createGrade(grade: any): Promise<Grade> {
    try {
      console.log('Creating grade in storage:', grade);
      const [newGrade] = await db.insert(grades).values(grade).returning();
      return newGrade;
    } catch (error) {
      console.error('Error creating grade:', error);
      throw new Error('Failed to create grade');
    }
  }

  async updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined> {
    try {
      const [updatedGrade] = await db.update(grades)
        .set(grade)
        .where(eq(grades.id, id))
        .returning();
      return updatedGrade || undefined;
    } catch (error) {
      console.error('Error updating grade:', error);
      return undefined;
    }
  }

  async deleteGrade(id: number): Promise<boolean> {
    try {
      const result = await db.delete(grades).where(eq(grades.id, id));
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('Error deleting grade:', error);
      return false;
    }
  }

  async batchCreateGrades(gradesList: InsertGrade[]): Promise<Grade[]> {
    try {
      const newGrades = await db.insert(grades).values(gradesList).returning();
      return newGrades;
    } catch (error) {
      console.error('Error batch creating grades:', error);
      throw new Error('Failed to batch create grades');
    }
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    try {
      return await db.select().from(messages).orderBy(desc(messages.sentAt));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const [message] = await db.select().from(messages).where(eq(messages.id, id));
      return message || undefined;
    } catch (error) {
      console.error('Error getting message:', error);
      return undefined;
    }
  }

  async getMessagesBySender(senderId: number, senderRole: string): Promise<Message[]> {
    try {
      return await db.select().from(messages)
        .where(and(eq(messages.senderId, senderId), eq(messages.senderRole, senderRole)))
        .orderBy(desc(messages.sentAt));
    } catch (error) {
      console.error('Error getting messages by sender:', error);
      return [];
    }
  }

  async getMessagesByReceiver(receiverId: number, receiverRole: string): Promise<Message[]> {
    try {
      return await db.select().from(messages)
        .where(and(eq(messages.receiverId, receiverId), eq(messages.receiverRole, receiverRole)))
        .orderBy(desc(messages.sentAt));
    } catch (error) {
      console.error('Error getting messages by receiver:', error);
      return [];
    }
  }

  async getMessageThread(parentMessageId: number): Promise<Message[]> {
    try {
      return await db.select().from(messages)
        .where(eq(messages.parentMessageId, parentMessageId))
        .orderBy(messages.sentAt);
    } catch (error) {
      console.error('Error getting message thread:', error);
      return [];
    }
  }

  async getUnreadMessagesCount(receiverId: number, receiverRole: string): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.receiverId, receiverId),
          eq(messages.receiverRole, receiverRole),
          eq(messages.isRead, false)
        ));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread messages count:', error);
      return 0;
    }
  }

  async getAuthorizedReceivers(senderId: number, senderRole: string): Promise<{id: number, role: string, name: string}[]> {
    try {
      const receivers: {id: number, role: string, name: string}[] = [];
      
      // Role-based communication rules
      switch (senderRole.toLowerCase()) {
        case 'admin':
        case 'directeur':
          // Admin can message everyone
          const allUsers = await db.select().from(users);
          const allStudents = await db.select().from(students);
          const allTeachers = await db.select().from(teachers);
          const allGuardians = await db.select().from(guardians);
          
          allUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          
          allStudents.forEach(student => receivers.push({
            id: student.id,
            role: 'student',
            name: `${student.firstName} ${student.lastName}`
          }));
          
          allTeachers.forEach(teacher => receivers.push({
            id: teacher.id,
            role: 'docent',
            name: `${teacher.firstName} ${teacher.lastName}`
          }));
          
          allGuardians.forEach(guardian => receivers.push({
            id: guardian.id,
            role: 'voogd',
            name: `${guardian.firstName} ${guardian.lastName}`
          }));
          break;

        case 'secretariaat':
          // Secretariat can message everyone
          const secretUsers = await db.select().from(users);
          const secretStudents = await db.select().from(students);
          const secretTeachers = await db.select().from(teachers);
          const secretGuardians = await db.select().from(guardians);
          
          secretUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          
          secretStudents.forEach(student => receivers.push({
            id: student.id,
            role: 'student',
            name: `${student.firstName} ${student.lastName}`
          }));
          
          secretTeachers.forEach(teacher => receivers.push({
            id: teacher.id,
            role: 'docent',
            name: `${teacher.firstName} ${teacher.lastName}`
          }));
          
          secretGuardians.forEach(guardian => receivers.push({
            id: guardian.id,
            role: 'voogd',
            name: `${guardian.firstName} ${guardian.lastName}`
          }));
          break;

        case 'docent':
          // Teachers can message other teachers, their students, guardians, and secretariat
          const teacherUsers = await db.select().from(users).where(inArray(users.role, ['admin', 'secretariaat']));
          const otherTeachers = await db.select().from(teachers).where(sql`id != ${senderId}`);
          const teacherStudents = await db.select().from(students);
          const teacherGuardians = await db.select().from(guardians);
          
          teacherUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          
          otherTeachers.forEach(teacher => receivers.push({
            id: teacher.id,
            role: 'docent',
            name: `${teacher.firstName} ${teacher.lastName}`
          }));
          
          teacherStudents.forEach(student => receivers.push({
            id: student.id,
            role: 'student',
            name: `${student.firstName} ${student.lastName}`
          }));
          
          teacherGuardians.forEach(guardian => receivers.push({
            id: guardian.id,
            role: 'voogd',
            name: `${guardian.firstName} ${guardian.lastName}`
          }));
          break;

        case 'voogd':
        case 'ouder':
          // Guardians can message their children, children's teachers, admin, and secretariat
          const guardianUsers = await db.select().from(users).where(inArray(users.role, ['admin', 'secretariaat']));
          const guardianTeachers = await db.select().from(teachers);
          
          // Get guardian's children
          const guardianChildren = await db.select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName
          })
          .from(studentGuardians)
          .innerJoin(students, eq(studentGuardians.studentId, students.id))
          .where(eq(studentGuardians.guardianId, senderId));
          
          guardianUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          
          guardianTeachers.forEach(teacher => receivers.push({
            id: teacher.id,
            role: 'docent',
            name: `${teacher.firstName} ${teacher.lastName}`
          }));
          
          guardianChildren.forEach(child => receivers.push({
            id: child.id,
            role: 'student',
            name: `${child.firstName} ${child.lastName}`
          }));
          break;

        case 'student':
          // Students can message their teachers, classmates, admin, secretariat, and can receive from parents
          const studentUsers = await db.select().from(users).where(inArray(users.role, ['admin', 'secretariaat']));
          const studentTeachers = await db.select().from(teachers);
          const classmates = await db.select().from(students).where(sql`id != ${senderId}`);
          
          studentUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          
          studentTeachers.forEach(teacher => receivers.push({
            id: teacher.id,
            role: 'docent',
            name: `${teacher.firstName} ${teacher.lastName}`
          }));
          
          classmates.forEach(student => receivers.push({
            id: student.id,
            role: 'student',
            name: `${student.firstName} ${student.lastName}`
          }));
          break;

        default:
          // Default: can only message admin and secretariat
          const defaultUsers = await db.select().from(users).where(inArray(users.role, ['admin', 'secretariaat']));
          defaultUsers.forEach(user => receivers.push({
            id: user.id,
            role: user.role || 'user',
            name: `${user.firstName} ${user.lastName}`
          }));
          break;
      }
      
      return receivers;
    } catch (error) {
      console.error('Error getting authorized receivers:', error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const [newMessage] = await db.insert(messages).values({
        ...message,
        sentAt: new Date().toISOString(),
        isRead: false
      }).returning();
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, id))
        .returning();
      return updatedMessage || undefined;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return undefined;
    }
  }

  async deleteMessage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(messages).where(eq(messages.id, id));
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Attendance methods
  async createAttendance(attendanceData: any): Promise<any> {
    try {
      const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
      return newAttendance;
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw new Error('Failed to create attendance');
    }
  }



  async getAttendanceByClassAndDate(classId: number, date: Date): Promise<any[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      // Voor student groups moeten we kijken naar studenten die in die klas zitten
      // en hun aanwezigheid voor die datum ophalen
      const enrollments = await db
        .select()
        .from(studentGroupEnrollments)
        .where(eq(studentGroupEnrollments.groupId, classId));
      
      if (enrollments.length === 0) {
        return [];
      }
      
      const studentIds = enrollments.map(e => e.studentId);
      const records = await db
        .select()
        .from(attendance)
        .where(
          and(
            inArray(attendance.studentId, studentIds),
            eq(attendance.date, dateStr)
          )
        );
      return records;
    } catch (error) {
      console.error('Error getting attendance by class and date:', error);
      return [];
    }
  }

  async getAttendanceByStudent(studentId: number): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(attendance)
        .where(eq(attendance.studentId, studentId));
      return records;
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      return [];
    }
  }

  async getAttendanceByCourse(courseId: number): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(attendance)
        .where(eq(attendance.courseId, courseId));
      return records;
    } catch (error) {
      console.error('Error getting attendance by course:', error);
      return [];
    }
  }

  async updateAttendance(id: number, attendanceData: any): Promise<any | undefined> {
    try {
      const [updatedAttendance] = await db
        .update(attendance)
        .set(attendanceData)
        .where(eq(attendance.id, id))
        .returning();
      return updatedAttendance || undefined;
    } catch (error) {
      console.error('Error updating attendance:', error);
      return undefined;
    }
  }

  async deleteAttendance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(attendance).where(eq(attendance.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return false;
    }
  }

  // Teacher attendance methods
  async createTeacherAttendance(attendanceData: any): Promise<any> {
    try {
      const [newAttendance] = await db.insert(teacherAttendance).values(attendanceData).returning();
      return newAttendance;
    } catch (error) {
      console.error('Error creating teacher attendance:', error);
      throw new Error('Failed to create teacher attendance');
    }
  }

  async getTeacherAttendanceRecords(): Promise<any[]> {
    try {
      const records = await db.select().from(teacherAttendance);
      return records;
    } catch (error) {
      console.error('Error getting teacher attendance records:', error);
      return [];
    }
  }



  async getTeacherAttendanceByTeacher(teacherId: number): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(teacherAttendance)
        .where(eq(teacherAttendance.teacherId, teacherId));
      return records;
    } catch (error) {
      console.error('Error getting teacher attendance by teacher:', error);
      return [];
    }
  }

  async getTeacherAttendanceByCourse(courseId: number): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(teacherAttendance)
        .where(eq(teacherAttendance.courseId, courseId));
      return records;
    } catch (error) {
      console.error('Error getting teacher attendance by course:', error);
      return [];
    }
  }

  async getTeacherAttendanceRecord(id: number): Promise<any | undefined> {
    try {
      const [record] = await db
        .select()
        .from(teacherAttendance)
        .where(eq(teacherAttendance.id, id));
      return record || undefined;
    } catch (error) {
      console.error('Error getting teacher attendance record:', error);
      return undefined;
    }
  }

  // Payment operations implementation
  async getPayments(): Promise<Payment[]> {
    try {
      const paymentsList = await db
        .select({
          id: payments.id,
          invoiceId: payments.invoiceId,
          studentId: payments.studentId,
          amount: payments.amount,
          description: payments.description,
          status: payments.status,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          studentName: sql<string>`CONCAT(${students.firstName}, ' ', ${students.lastName})`,
          invoiceNumber: invoices.invoiceNumber
        })
        .from(payments)
        .leftJoin(students, eq(payments.studentId, students.id))
        .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
        .orderBy(desc(payments.createdAt));
      
      return paymentsList;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, id));
      return payment || undefined;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return undefined;
    }
  }

  async getPaymentByMollieId(molliePaymentId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.molliePaymentId, molliePaymentId));
      return payment || undefined;
    } catch (error) {
      console.error('Error fetching payment by Mollie ID:', error);
      return undefined;
    }
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.studentId, studentId));
    } catch (error) {
      console.error('Error fetching payments by student:', error);
      return [];
    }
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
    } catch (error) {
      console.error('Error fetching payments by invoice:', error);
      return [];
    }
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.status, status));
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return [];
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
      const [updatedPayment] = await db
        .update(payments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();
      return updatedPayment || undefined;
    } catch (error) {
      console.error('Error updating payment:', error);
      return undefined;
    }
  }

  async updatePaymentByMollieId(molliePaymentId: string, payment: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const [updatedPayment] = await db
        .update(payments)
        .set({ ...payment, updatedAt: new Date() })
        .where(eq(payments.molliePaymentId, molliePaymentId))
        .returning();
      return updatedPayment || undefined;
    } catch (error) {
      console.error('Error updating payment by Mollie ID:', error);
      return undefined;
    }
  }

  async deletePayment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(payments).where(eq(payments.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  }

  async getPaymentStats(): Promise<{ totalPaid: number; totalPending: number; totalFailed: number; successRate: number; } | undefined> {
    try {
      const stats = await db
        .select({
          totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'paid' THEN CAST(${payments.amount} AS DECIMAL) ELSE 0 END), 0)`,
          totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'pending' THEN CAST(${payments.amount} AS DECIMAL) ELSE 0 END), 0)`,
          totalFailed: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'failed' THEN CAST(${payments.amount} AS DECIMAL) ELSE 0 END), 0)`,
          totalCount: sql<number>`COUNT(*)`,
          paidCount: sql<number>`SUM(CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE 0 END)`
        })
        .from(payments);
      
      const result = stats[0];
      if (!result) return undefined;
      
      const successRate = result.totalCount > 0 ? (result.paidCount / result.totalCount) * 100 : 0;
      
      return {
        totalPaid: Number(result.totalPaid) || 0,
        totalPending: Number(result.totalPending) || 0,
        totalFailed: Number(result.totalFailed) || 0,
        successRate: Number(successRate) || 0
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return { totalPaid: 0, totalPending: 0, totalFailed: 0, successRate: 0 };
    }
  }

  // Tuition Rates operations implementation
  async getTuitionRates(): Promise<TuitionRate[]> {
    try {
      return await db.select().from(tuitionRates).where(eq(tuitionRates.isActive, true));
    } catch (error) {
      console.error('Error fetching tuition rates:', error);
      return [];
    }
  }

  async getTuitionRate(id: number): Promise<TuitionRate | undefined> {
    try {
      const [rate] = await db.select().from(tuitionRates).where(eq(tuitionRates.id, id));
      return rate || undefined;
    } catch (error) {
      console.error('Error fetching tuition rate:', error);
      return undefined;
    }
  }

  async getTuitionRateByTypeAndYear(type: string, academicYear: string): Promise<TuitionRate | undefined> {
    try {
      const [rate] = await db
        .select()
        .from(tuitionRates)
        .where(and(
          eq(tuitionRates.type, type),
          eq(tuitionRates.academicYear, academicYear),
          eq(tuitionRates.isActive, true)
        ));
      return rate || undefined;
    } catch (error) {
      console.error('Error fetching tuition rate by type and year:', error);
      return undefined;
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
      const [updatedRate] = await db
        .update(tuitionRates)
        .set(rate)
        .where(eq(tuitionRates.id, id))
        .returning();
      return updatedRate || undefined;
    } catch (error) {
      console.error('Error updating tuition rate:', error);
      return undefined;
    }
  }

  async deleteTuitionRate(id: number): Promise<boolean> {
    try {
      const result = await db.delete(tuitionRates).where(eq(tuitionRates.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting tuition rate:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();