import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage/index";
import { db } from "./db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import { createMollieClient } from '@mollie/api-client';
import bcrypt from "bcryptjs";
import multer from "multer";
import { authenticateToken, requireRole, requirePermission, requireAdmin, generateToken, AuthUser } from "./middleware/auth";
import { UserRole, RESOURCES } from "@shared/rbac";
import { 
  students, 
  teachers, 
  guardians, 
  enrollments, 
  programs, 
  payments, 
  userAccounts,
  insertStudentSchema,
  insertTeacherSchema,
  insertGuardianSchema,
  insertProgramSchema,
  insertPaymentSchema,
  insertUserAccountSchema
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize Mollie client only if API key is available
  let mollieClient = null;
  if (process.env.MOLLIE_API_KEY) {
    try {
      mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
    } catch (error) {
      console.warn('Failed to initialize Mollie client:', error);
    }
  }

  // Health check
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email en wachtwoord zijn verplicht" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }

      const token = generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isActive: user.isActive !== false
      });
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Profile route
  app.get("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Students routes
  app.get("/api/students", authenticateToken, async (req, res) => {
    try {
      const studentsData = await storage.getStudents();
      res.json(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Error fetching students" });
    }
  });

  app.post("/api/students", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: "Error creating student" });
    }
  });

  // Teachers routes
  app.get("/api/teachers", authenticateToken, async (req, res) => {
    try {
      const teachersData = await storage.getTeachers();
      res.json(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: "Error fetching teachers" });
    }
  });

  // Programs routes
  app.get("/api/programs", authenticateToken, async (req, res) => {
    try {
      const programsData = await storage.getPrograms();
      res.json(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({ message: "Error fetching programs" });
    }
  });

  // Payments routes
  app.get("/api/payments", authenticateToken, async (req, res) => {
    try {
      const paymentsData = await storage.getPayments();
      res.json(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: "Error fetching payments" });
    }
  });

  // Mollie payment creation
  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      if (!mollieClient) {
        return res.status(503).json({ error: "Payment service not configured" });
      }

      const { amount, description, studentId } = req.body;
      
      const molliePayment = await mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: amount
        },
        description: description || 'School payment',
        redirectUrl: `${req.protocol}://${req.get('host')}/payment-success`,
        webhookUrl: `${req.protocol}://${req.get('host')}/api/payments/webhook`
      });

      // Save payment to database
      const payment = await storage.createPayment({
        studentId: Number(studentId),
        amount: amount,
        description: description || 'School payment',
        status: 'openstaand',
        dueDate: new Date().toISOString(),
        invoiceNumber: `INV-${Date.now()}`,
        molliePaymentId: molliePayment.id
      });

      res.json({
        payment,
        checkoutUrl: molliePayment.getCheckoutUrl()
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Mollie webhook
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      if (!mollieClient) {
        return res.status(503).json({ error: "Payment service not configured" });
      }

      const paymentId = req.body.id;
      if (!paymentId) {
        return res.status(400).json({ error: "Missing payment ID" });
      }

      const molliePayment = await mollieClient.payments.get(paymentId);
      
      // Update payment status
      let newStatus = 'openstaand';
      switch (molliePayment.status) {
        case 'paid':
          newStatus = 'betaald';
          break;
        case 'failed':
        case 'canceled':
        case 'expired':
          newStatus = 'mislukt';
          break;
      }

      await storage.updatePaymentByMollieId(paymentId, { status: newStatus });
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // User accounts routes
  app.get("/api/accounts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const accounts = await storage.getUserAccounts();
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });

  app.post("/api/accounts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserAccountSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash((validatedData as any).password || 'defaultpass', 10);
      
      const account = await storage.createUserAccount({
        ...validatedData,
        password: hashedPassword
      });
      
      res.status(201).json(account);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: "Error creating account" });
    }
  });

  // Notifications route
  app.get("/api/notifications/user/:userId", authenticateToken, async (req, res) => {
    try {
      // Return empty array for now
      res.json([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}