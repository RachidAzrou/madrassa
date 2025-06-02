import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage/index";
import { db } from "./db";
import * as schema from "@shared/schema";

// Global storage voor calendar events met een startwaarde
const globalCalendarEventsStore = new Map();

// Voeg een test event toe zodat we kunnen zien dat het werkt
globalCalendarEventsStore.set("test-1", {
  id: "test-1",
  title: "Test Les",
  date: "2025-05-26",
  startTime: "10:00",
  endTime: "11:00",
  location: "Lokaal A1",
  type: "class",
  description: "Test evenement",
  courseId: "1",
  courseName: "Arabisch",
  classId: "1", 
  className: "Klas 1A"
});
import { z } from "zod";
import { createMollieClient } from '@mollie/api-client';
import { 
  insertStudentSchema, 
  insertProgramSchema, 
  insertCourseSchema, 
  insertEnrollmentSchema,
  insertPaymentSchema,
  insertAttendanceSchema,
  insertGradeSchema,
  insertEventSchema,
  insertUserSchema,
  insertFeeSchema,
  insertAssessmentSchema,
  insertStudentGroupSchema,
  insertStudentGroupEnrollmentSchema,
  insertLessonSchema,
  insertExaminationSchema,
  insertGuardianSchema,
  insertStudentGuardianSchema,
  insertStudentProgramSchema,
  insertTeacherSchema,
  insertTeacherAvailabilitySchema,
  insertTeacherLanguageSchema,
  insertTeacherCourseAssignmentSchema,
  insertTeacherAttendanceSchema,
  insertBehaviorAssessmentSchema,
  insertNotificationSchema,
  insertMessageSchema,
  type Student,
  type Teacher,
  type BehaviorAssessment,
  type Message
} from "@shared/schema";
import { 
  getRooms, 
  getLocations, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom 
} from "./handlers/rooms";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app;
  
  // ********************
  // Health check endpoint
  // ********************
  apiRouter.get("/api/health", async (_req, res) => {
    try {
      // Check database connection by executing a simple query
      const result = await storage.checkHealth();
      
      // Return health status
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: result
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // ********************
  // Authentication endpoints
  // ********************
  apiRouter.get("/api/logout", (_req, res) => {
    res.redirect("/login");
  });

  // ********************
  // Student API endpoints
  // ********************
  apiRouter.get("/api/students", async (req, res) => {
    try {
      // Haal de query parameters op voor filtering
      const { program, year, status, searchTerm } = req.query;
      
      // Haal alle studenten op
      let students = await storage.getStudents();
      
      // Filter op programId als het is opgegeven en niet 'all'
      if (program && program !== 'all') {
        const programId = parseInt(program as string);
        if (!isNaN(programId)) {
          students = students.filter(student => student.programId === programId);
        }
      }
      
      // Filter op yearLevel als het is opgegeven en niet 'all'
      if (year && year !== 'all') {
        const yearLevel = parseInt(year as string);
        if (!isNaN(yearLevel)) {
          students = students.filter(student => student.yearLevel === yearLevel);
        }
      }
      
      // Filter op status als het is opgegeven en niet 'all'
      if (status && status !== 'all') {
        const statusLower = (status as string).toLowerCase();
        students = students.filter(student => {
          const studentStatus = student.status?.toLowerCase() || '';
          
          // Controleer zowel Engels als Nederlands (voor backwards compatibiliteit)
          if (statusLower === 'active' || statusLower === 'actief') {
            return studentStatus === 'active' || studentStatus === 'actief';
          } else if (statusLower === 'pending' || statusLower === 'in afwachting') {
            return studentStatus === 'pending' || studentStatus === 'in afwachting';
          } else if (statusLower === 'inactive' || statusLower === 'inactief') {
            return studentStatus === 'inactive' || studentStatus === 'inactief';
          }
          
          return studentStatus === statusLower;
        });
      }
      
      // Filter op zoekterm als die is opgegeven
      if (searchTerm) {
        const term = (searchTerm as string).toLowerCase();
        students = students.filter(student => 
          (student.firstName?.toLowerCase() || '').includes(term) || 
          (student.lastName?.toLowerCase() || '').includes(term) || 
          (student.email?.toLowerCase() || '').includes(term) ||
          (student.studentId?.toLowerCase() || '').includes(term)
        );
      }
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Error fetching students" });
    }
  });

  apiRouter.get("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student" });
    }
  });

  // Functie om het volgende beschikbare studentnummer te genereren
  async function generateNextStudentId(): Promise<string> {
    try {
      // Haal alle bestaande studenten op
      const allStudents = await storage.getStudents();
      
      // Huidige jaar (laatste 2 cijfers)
      const currentYear = new Date().getFullYear() % 100;
      const prefix = `ST${currentYear}`;
      
      // Als er geen studenten zijn, begin met ST + jaar + 001
      if (!allStudents || allStudents.length === 0) {
        return `${prefix}001`;
      }
      
      // Filter IDs die het nieuwe format volgen: ST + jaar + volgnummer
      // EN IDs die het oude format volgen (alleen voor dit jaar)
      const stPattern = new RegExp(`^ST\\d+$`); // Alle ST-nummers
      const yearPattern = new RegExp(`^${prefix}\\d+$`); // Specifiek voor dit jaar
      
      // Eerst alles verzamelen wat in de vorm ST + nummers is
      const allStNums = allStudents
        .map(student => student.studentId)
        .filter(id => stPattern.test(id));
        
      // Dan alleen de nummers voor dit jaar eruit filteren
      const validNums = allStNums
        .filter(id => yearPattern.test(id))
        .map(id => parseInt(id.substring(4), 10)) // Verwijder "ST" + jaar en converteer naar nummer
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b); // Sorteer op numerieke volgorde
      
      // En als fallback ook de oude formaten meenemen 
      const oldFormatNums = allStNums
        .filter(id => !yearPattern.test(id) && id.startsWith('ST'))
        .map(id => parseInt(id.substring(2), 10)) // Verwijder "ST" en converteer naar nummer
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);
      
      // Als er geen geldige numerieke IDs zijn voor dit jaar, begin met 001
      if (validNums.length === 0) {
        return `${prefix}001`;
      }

      // Zoek naar "gaten" in de reeks
      // Begin te zoeken vanaf 1
      let expectedNum = 1;
      
      // Loop door de gesorteerde nummers om het eerste ontbrekende nummer te vinden
      for (const num of validNums) {
        if (num > expectedNum) {
          // We hebben een gat gevonden
          return `${prefix}${expectedNum.toString().padStart(3, '0')}`;
        }
        // Ga door naar het volgende verwachte nummer
        expectedNum = num + 1;
      }
      
      // Als er geen gaten zijn, gebruik dan het volgende nummer na het hoogste ID
      return `${prefix}${expectedNum.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error("Fout bij genereren studentnummer:", error);
      // Fallback naar huidige jaar en random nummer als er een fout optreedt
      const currentYear = new Date().getFullYear() % 100;
      return `ST${currentYear}${Math.floor(Math.random() * 999 + 1).toString().padStart(3, '0')}`;
    }
  }
  
  // Endpoint om het volgende beschikbare studentnummer op te halen
  apiRouter.get("/api/next-student-id", async (req, res) => {
    try {
      const nextStudentId = await generateNextStudentId();
      res.json({ nextStudentId });
    } catch (error) {
      console.error("Fout bij ophalen volgend studentnummer:", error);
      res.status(500).json({ 
        message: "Fout bij ophalen volgend studentnummer", 
        nextStudentId: null 
      });
    }
  });
  
  // Functie om het volgende beschikbare docentnummer te genereren
  async function generateNextTeacherId(): Promise<string> {
    try {
      // Haal alle bestaande docenten op
      const allTeachers = await storage.getTeachers();
      
      // Als er geen docenten zijn, begin met D001
      if (!allTeachers || allTeachers.length === 0) {
        return "D001";
      }
      
      // Filter alle geldige IDs in het formaat D###
      const validIds = allTeachers
        .map(teacher => teacher.teacherId)
        .filter(id => /^D\d{3}$/.test(id))
        .map(id => parseInt(id.substring(1), 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b); // Sorteer op numerieke volgorde
      
      // Als er geen geldige IDs zijn, begin met D001
      if (validIds.length === 0) {
        return "D001";
      }
      
      // Zoek naar "gaten" in de reeks
      // Begin te zoeken vanaf 1
      let expectedId = 1;
      
      // Loop door de gesorteerde IDs om het eerste ontbrekende nummer te vinden
      for (const id of validIds) {
        if (id > expectedId) {
          // We hebben een gat gevonden
          return `D${expectedId.toString().padStart(3, '0')}`;
        }
        // Ga door naar het volgende verwachte nummer
        expectedId = id + 1;
      }
      
      // Als er geen gaten zijn, gebruik dan het volgende nummer na het hoogste ID
      return `D${expectedId.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error("Fout bij genereren docentnummer:", error);
      // Fallback naar willekeurig nummer als er een fout optreedt
      const randomNum = Math.floor(Math.random() * 999 + 1);
      return `D${randomNum.toString().padStart(3, '0')}`;
    }
  }
  
  // Endpoint om het volgende beschikbare docentnummer op te halen
  apiRouter.get("/api/next-teacher-id", async (req, res) => {
    try {
      const nextTeacherId = await generateNextTeacherId();
      res.json({ nextTeacherId });
    } catch (error) {
      console.error("Fout bij ophalen volgend docentnummer:", error);
      res.status(500).json({ 
        message: "Fout bij ophalen volgend docentnummer", 
        nextTeacherId: null 
      });
    }
  });

  apiRouter.post("/api/students", async (req, res) => {
    try {
      // Log de binnenkomende data voor debugging
      console.log("Received student data:", req.body);
      
      // Haal guardianId uit de data (indien opgegeven)
      const { guardianId, ...studentData } = req.body;
      
      // Genereer een nieuw studentnummer en voeg dit toe aan de data
      studentData.studentId = await generateNextStudentId();
      
      console.log("Gegenereerd studentnummer:", studentData.studentId);
      
      // We gebruiken het schema om eerst te valideren
      // Transformaties gebeuren in de schema zelf via .transform()
      const validatedData = insertStudentSchema.parse(studentData);
      
      // Log de gevalideerde data
      console.log("Validated student data:", validatedData);
      
      // Stuur de data door naar storage zonder verdere aanpassingen
      const newStudent = await storage.createStudent(validatedData);
      
      // Als er een guardianId is opgegeven, maak een student-guardian relatie
      if (guardianId) {
        try {
          console.log(`Koppelen van student ${newStudent.id} aan voogd ${guardianId}`);
          const studentGuardianData = {
            studentId: newStudent.id,
            guardianId: parseInt(guardianId),
            relationshipType: 'Voogd',
            isPrimary: true,
            hasEmergencyContact: true,
            notes: ''
          };
          
          // Valideer de data
          const validatedRelation = insertStudentGuardianSchema.parse(studentGuardianData);
          
          // Maak de relatie aan
          await storage.createStudentGuardian(validatedRelation);
          console.log("Student-voogd relatie succesvol aangemaakt");
        } catch (relationError) {
          console.error("Error creating student-guardian relation:", relationError);
          // Relatie maken mislukt, maar student is wel aangemaakt
          // We gaan door met de verwerking
        }
      }
      
      // Maak automatisch een collegegeldrecord aan voor de nieuwe student
      try {
        // Bepaal het huidige academische jaar (bijv. 2024-2025)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        
        // Genereer uniek factuurnummer
        const invoiceNumber = `INV-${currentYear}-${newStudent.id.toString().padStart(4, '0')}`;
        
        // Haal standaard collegegeld uit de instellingen of gebruik vaste waarde
        const defaultTuition = 1250.00; // €1250 als standaard collegegeld
        
        // Maak het collegegeldrecord aan
        const feeRecord = {
          studentId: newStudent.id,
          invoiceNumber: invoiceNumber,
          description: `Collegegeld ${academicYear}`,
          amount: defaultTuition,
          dueDate: new Date(currentYear, 8, 30), // 30 september van het huidige jaar
          status: "niet betaald", // nog niet betaald
          academicYear: academicYear,
          semester: "volledig jaar",
          createdAt: new Date()
        };
        
        // Sla het collegegeldrecord op
        const newFee = await storage.createFee(feeRecord);
        console.log("Collegegeldrecord aangemaakt:", newFee);
        
        // Voeg informatie over het aangemaakte collegegeldrecord toe aan de respons
        res.status(201).json({
          ...newStudent,
          feeCreated: true,
          feeDetails: {
            id: newFee.id,
            invoiceNumber: newFee.invoiceNumber,
            amount: newFee.amount,
            dueDate: newFee.dueDate
          }
        });
      } catch (feeError) {
        console.error("Fout bij aanmaken collegegeldrecord:", feeError);
        // Als er een fout optreedt bij aanmaken collegegeldrecord, sturen we toch de student terug
        res.status(201).json({
          ...newStudent,
          feeCreated: false,
          feeError: "Kon geen collegegeldrecord aanmaken"
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error("Student validation error:", error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          received: req.body  // Dit helpt bij diagnose
        });
      }
      
      // Controleer op specifieke database fouten
      if (error.code === '23505') {
        // Unieke sleutel overtreding
        const fieldName = error.constraint?.includes('student_id') ? 'studentnummer' : 
                         error.constraint?.includes('email') ? 'e-mailadres' : 'veld';
                         
        console.error(`Duplicate key error for ${fieldName}:`, error);
        return res.status(409).json({ 
          message: `Er bestaat al een student met dit ${fieldName}. Kies een andere waarde.`,
          field: error.constraint,
          detail: error.detail
        });
      }
      
      console.error("Error creating student:", error);
      res.status(500).json({ 
        message: "Fout bij het aanmaken van de student", 
        detail: error.message || "Onbekende fout"
      });
    }
  });

  apiRouter.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig ID formaat" });
      }
      
      // Haal de bestaande student op voordat we iets gaan wijzigen
      const existingStudent = await storage.getStudent(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student niet gevonden" });
      }
      
      // Log de binnenkomende data voor debugging
      console.log("Received student update data:", req.body);
      
      // Verwijder studentId als het is meegestuurd om te voorkomen dat het wordt gewijzigd
      const updatedData = { ...req.body };
      if (updatedData.studentId) {
        console.log(`Poging tot wijzigen studentnummer gedetecteerd. Origineel: ${existingStudent.studentId}, Nieuw: ${updatedData.studentId}`);
        delete updatedData.studentId; // We negeren dit veld bij updates
      }
      
      // We gebruiken partial schema omdat niet alle velden verplicht zijn bij een update
      // Transformaties gebeuren in de schema definitie zelf
      const validatedData = insertStudentSchema.partial().parse(updatedData);
      
      // Log de gevalideerde data
      console.log("Validated student update data:", validatedData);
      
      // Update de student zonder verdere aanpassingen (student ID bleef behouden)
      const updatedStudent = await storage.updateStudent(id, validatedData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student niet gevonden" });
      }
      
      res.json(updatedStudent);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error("Student update validation error:", error.errors);
        return res.status(400).json({ 
          message: "Validatiefout", 
          errors: error.errors,
          received: req.body  // Dit helpt bij diagnose
        });
      }
      
      // Controleer op specifieke database fouten
      if (error.code === '23505') {
        // Unieke sleutel overtreding
        const fieldName = error.constraint?.includes('student_id') ? 'studentnummer' : 
                         error.constraint?.includes('email') ? 'e-mailadres' : 'veld';
                         
        console.error(`Duplicate key error for ${fieldName}:`, error);
        return res.status(409).json({ 
          message: `Er bestaat al een student met dit ${fieldName}. Kies een andere waarde.`,
          field: error.constraint,
          detail: error.detail
        });
      }
      
      console.error("Update student error:", error);
      res.status(500).json({ 
        message: "Fout bij het bijwerken van de student", 
        detail: error.message || "Onbekende fout"
      });
    }
  });

  apiRouter.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student" });
    }
  });

  // ********************
  // Program API endpoints
  // ********************
  apiRouter.get("/api/programs", async (_req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching programs" });
    }
  });

  apiRouter.get("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const program = await storage.getProgram(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Error fetching program" });
    }
  });

  // Programs API endpoints
  apiRouter.get("/api/programs", async (req, res) => {
    try {
      // Return sample Islamic education programs for now
      const programs = [
        {
          id: 1,
          name: "Arabisch Taal",
          code: "AR1",
          description: "Basis Arabische taal en grammatica",
          duration: 1,
          department: "Taalonderwijs",
          isActive: true
        },
        {
          id: 2,
          name: "Koran Studies",
          code: "QS1", 
          description: "Koranrecitatie en tafsir",
          duration: 1,
          department: "Islamitische Studies",
          isActive: true
        },
        {
          id: 3,
          name: "Fiqh",
          code: "FQ1",
          description: "Islamitische jurisprudentie",
          duration: 1,
          department: "Islamitische Studies", 
          isActive: true
        }
      ];
      res.json({ programs, totalCount: programs.length });
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Error fetching programs" });
    }
  });

  apiRouter.post("/api/programs", async (req, res) => {
    try {
      const validatedData = insertProgramSchema.parse(req.body);
      const newProgram = await storage.createProgram(validatedData);
      res.status(201).json(newProgram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating program" });
    }
  });

  apiRouter.put("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedProgram = await storage.updateProgram(id, req.body);
      if (!updatedProgram) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.json(updatedProgram);
    } catch (error) {
      res.status(500).json({ message: "Error updating program" });
    }
  });

  apiRouter.delete("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const result = await storage.deleteProgram(id);
      if (!result) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Error deleting program" });
    }
  });

  // ********************
  // Course API endpoints
  // ********************
  apiRouter.get("/api/courses", async (req, res) => {
    try {
      // Ondersteuning voor filteren op isActive
      const isActive = req.query.isActive;
      let courses;
      
      if (isActive !== undefined) {
        const activeFilter = isActive === 'true';
        courses = await storage.getCoursesByFilter({ isActive: activeFilter });
      } else {
        courses = await storage.getCourses();
      }
      
      res.json({ courses, totalCount: courses.length });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Error fetching courses" });
    }
  });
  
  // Endpoint voor dashboard om actieve cursussen op te halen
  apiRouter.get("/api/dashboard/active-courses", async (_req, res) => {
    try {
      const courses = await storage.getCoursesByFilter({ isActive: true });
      res.json(courses);
    } catch (error) {
      console.error("Error fetching active courses:", error);
      res.status(500).json({ message: "Error fetching active courses" });
    }
  });
  
  // Haal alle vaktoewijzingen op voor een specifieke docent
  apiRouter.get("/api/teacher-course-assignments/:teacherId", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID format" });
      }
      
      const assignments = await storage.getTeacherCourseAssignmentsByTeacher(teacherId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching teacher course assignments:", error);
      res.status(500).json({ message: "Error fetching teacher course assignments" });
    }
  });
  
  // Endpoint om alle docent-vak toewijzingen op te halen
  apiRouter.get("/api/teacher-course-assignments", async (_req, res) => {
    try {
      const assignments = await storage.getTeacherCourseAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching all teacher course assignments:", error);
      res.status(500).json({ message: "Error fetching all teacher course assignments" });
    }
  });
  
  // Update vakken voor een docent
  apiRouter.post("/api/teachers/:teacherId/course-assignments", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID format" });
      }
      
      // Controleer of docent bestaat
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const { assignments } = req.body;
      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({ message: "Invalid assignments data format" });
      }
      
      // Verwijder bestaande toewijzingen voor deze docent
      const currentAssignments = await storage.getTeacherCourseAssignmentsByTeacher(teacherId);
      for (const assignment of currentAssignments) {
        await storage.deleteTeacherCourseAssignment(assignment.id);
      }
      
      // Maak nieuwe toewijzingen aan
      const results = [];
      for (const assignment of assignments) {
        const assignmentData = {
          teacherId,
          courseId: assignment.courseId,
          isPrimary: assignment.isPrimary || false,
          notes: assignment.notes || "",
          startDate: new Date(assignment.startDate || new Date()),
          endDate: new Date(assignment.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
        };
        
        const result = await storage.createTeacherCourseAssignment(assignmentData);
        results.push(result);
      }
      
      res.status(200).json({ message: "Teacher course assignments updated", assignments: results });
    } catch (error) {
      console.error("Error updating teacher course assignments:", error);
      res.status(500).json({ message: "Error updating teacher course assignments" });
    }
  });

  apiRouter.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course" });
    }
  });

  apiRouter.get("/api/programs/:programId/courses", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      if (isNaN(programId)) {
        return res.status(400).json({ message: "Invalid program ID format" });
      }
      
      const courses = await storage.getCoursesByProgram(programId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses by program" });
    }
  });

  apiRouter.post("/api/courses", async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const newCourse = await storage.createCourse(validatedData);
      res.status(201).json(newCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating course" });
    }
  });

  apiRouter.put("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedCourse = await storage.updateCourse(id, req.body);
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Error updating course" });
    }
  });

  apiRouter.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteCourse(id);
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting course" });
    }
  });

  // ********************
  // Enrollment API endpoints
  // ********************
  apiRouter.get("/api/enrollments", async (_req, res) => {
    try {
      const enrollments = await storage.getEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments" });
    }
  });

  apiRouter.get("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const enrollment = await storage.getEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollment" });
    }
  });

  apiRouter.get("/api/students/:studentId/enrollments", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments by student" });
    }
  });

  apiRouter.get("/api/courses/:courseId/enrollments", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments by course" });
    }
  });

  apiRouter.post("/api/enrollments", async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.parse(req.body);
      const newEnrollment = await storage.createEnrollment(validatedData);
      res.status(201).json(newEnrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating enrollment" });
    }
  });

  apiRouter.put("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(id, req.body);
      if (!updatedEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Error updating enrollment" });
    }
  });

  apiRouter.delete("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteEnrollment(id);
      if (!success) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting enrollment" });
    }
  });

  // ********************
  // Attendance API endpoints
  // ********************
  apiRouter.get("/api/attendance", async (_req, res) => {
    try {
      const attendanceRecords = await storage.getAttendanceRecords();
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records" });
    }
  });

  apiRouter.get("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const attendanceRecord = await storage.getAttendanceRecord(id);
      if (!attendanceRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(attendanceRecord);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance record" });
    }
  });

  apiRouter.get("/api/students/:studentId/attendance", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records by student" });
    }
  });

  apiRouter.get("/api/courses/:courseId/attendance", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const attendanceRecords = await storage.getAttendanceByCourse(courseId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records by course" });
    }
  });

  apiRouter.get("/api/attendance/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const attendanceRecords = await storage.getAttendanceByDate(date);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records by date" });
    }
  });

  apiRouter.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const newAttendanceRecord = await storage.createAttendance(validatedData);
      res.status(201).json(newAttendanceRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating attendance record" });
    }
  });

  apiRouter.put("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedAttendanceRecord = await storage.updateAttendance(id, req.body);
      if (!updatedAttendanceRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendanceRecord);
    } catch (error) {
      res.status(500).json({ message: "Error updating attendance record" });
    }
  });

  apiRouter.delete("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteAttendance(id);
      if (!success) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting attendance record" });
    }
  });

  // ********************
  // Teacher Attendance API endpoints
  // ********************
  apiRouter.get("/api/teacher-attendance", async (_req, res) => {
    try {
      const attendanceRecords = await storage.getTeacherAttendanceRecords();
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching teacher attendance records:", error);
      res.status(500).json({ message: "Error fetching teacher attendance records" });
    }
  });

  apiRouter.get("/api/teacher-attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const attendanceRecord = await storage.getTeacherAttendanceRecord(id);
      if (!attendanceRecord) {
        return res.status(404).json({ message: "Teacher attendance record not found" });
      }
      
      res.json(attendanceRecord);
    } catch (error) {
      console.error("Error fetching teacher attendance record:", error);
      res.status(500).json({ message: "Error fetching teacher attendance record" });
    }
  });

  apiRouter.get("/api/teachers/:teacherId/attendance", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID format" });
      }
      
      const attendanceRecords = await storage.getTeacherAttendanceByTeacher(teacherId);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching teacher attendance records by teacher:", error);
      res.status(500).json({ message: "Error fetching teacher attendance records by teacher" });
    }
  });

  apiRouter.get("/api/courses/:courseId/teacher-attendance", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const attendanceRecords = await storage.getTeacherAttendanceByCourse(courseId);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching teacher attendance records by course:", error);
      res.status(500).json({ message: "Error fetching teacher attendance records by course" });
    }
  });

  apiRouter.get("/api/teacher-attendance/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const attendanceRecords = await storage.getTeacherAttendanceByDate(date);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching teacher attendance records by date:", error);
      res.status(500).json({ message: "Error fetching teacher attendance records by date" });
    }
  });

  apiRouter.post("/api/teacher-attendance", async (req, res) => {
    try {
      const validatedData = insertTeacherAttendanceSchema.parse(req.body);
      const newAttendanceRecord = await storage.createTeacherAttendance(validatedData);
      res.status(201).json(newAttendanceRecord);
    } catch (error) {
      console.error("Error creating teacher attendance record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher attendance record" });
    }
  });

  apiRouter.put("/api/teacher-attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const existingRecord = await storage.getTeacherAttendanceRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Teacher attendance record not found" });
      }
      
      const validatedData = insertTeacherAttendanceSchema.partial().parse(req.body);
      const updatedAttendanceRecord = await storage.updateTeacherAttendance(id, validatedData);
      
      if (!updatedAttendanceRecord) {
        return res.status(404).json({ message: "Teacher attendance record not found" });
      }
      
      res.json(updatedAttendanceRecord);
    } catch (error) {
      console.error("Error updating teacher attendance record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher attendance record" });
    }
  });

  apiRouter.delete("/api/teacher-attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const existingRecord = await storage.getTeacherAttendanceRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Teacher attendance record not found" });
      }
      
      const success = await storage.deleteTeacherAttendance(id);
      
      if (!success) {
        return res.status(404).json({ message: "Teacher attendance record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting teacher attendance record:", error);
      res.status(500).json({ message: "Error deleting teacher attendance record" });
    }
  });

  // Enhanced Attendance API endpoints for class view (with teacher parameter)
  apiRouter.get("/api/courses/:courseId/attendance/date/:date", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const date = new Date(req.params.date);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const attendanceRecords = await storage.getAttendanceByClassAndDate(courseId, date);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching attendance by class and date:", error);
      res.status(500).json({ message: "Error fetching attendance by class and date" });
    }
  });

  // Batch create attendance records for a class
  apiRouter.post("/api/attendance/batch", async (req, res) => {
    try {
      // Expect an array of attendance records
      const attendanceRecords = req.body;
      if (!Array.isArray(attendanceRecords)) {
        return res.status(400).json({ message: "Expected an array of attendance records" });
      }
      
      // Process each record individually
      const results = [];
      for (const record of attendanceRecords) {
        try {
          const validatedData = insertAttendanceSchema.parse(record);
          const newRecord = await storage.createAttendance(validatedData);
          results.push({ success: true, record: newRecord });
        } catch (error) {
          results.push({ success: false, error: error instanceof z.ZodError ? error.errors : "Validation error", record });
        }
      }
      
      const success = results.every(r => r.success);
      if (success) {
        res.status(201).json({ success: true, results });
      } else {
        res.status(207).json({ success: false, results });
      }
    } catch (error) {
      console.error("Error processing batch attendance records:", error);
      res.status(500).json({ message: "Error processing batch attendance records" });
    }
  });

  // ********************
  // Assessment API endpoints
  // ********************
  apiRouter.get("/api/assessments", async (_req, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  apiRouter.get("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  apiRouter.get("/api/courses/:courseId/assessments", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const assessments = await storage.getAssessmentsByCourse(courseId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments by course" });
    }
  });

  apiRouter.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      const newAssessment = await storage.createAssessment(validatedData);
      res.status(201).json(newAssessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating assessment" });
    }
  });

  apiRouter.put("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedAssessment = await storage.updateAssessment(id, req.body);
      if (!updatedAssessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.json(updatedAssessment);
    } catch (error) {
      res.status(500).json({ message: "Error updating assessment" });
    }
  });

  apiRouter.delete("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteAssessment(id);
      if (!success) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting assessment" });
    }
  });

  // ********************
  // Grade API endpoints
  // ********************
  apiRouter.get("/api/grades", async (_req, res) => {
    try {
      const grades = await storage.getGrades();
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades" });
    }
  });

  apiRouter.get("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const grade = await storage.getGrade(id);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      res.json(grade);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grade" });
    }
  });

  apiRouter.get("/api/students/:studentId/grades", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const grades = await storage.getGradesByStudent(studentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades by student" });
    }
  });

  apiRouter.get("/api/courses/:courseId/grades", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const grades = await storage.getGradesByCourse(courseId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades by course" });
    }
  });

  apiRouter.get("/api/students/:studentId/courses/:courseId/grades", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(studentId) || isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const grades = await storage.getGradesByStudentAndCourse(studentId, courseId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades by student and course" });
    }
  });

  apiRouter.post("/api/grades", async (req, res) => {
    try {
      const validatedData = insertGradeSchema.parse(req.body);
      const newGrade = await storage.createGrade(validatedData);
      res.status(201).json(newGrade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating grade" });
    }
  });

  apiRouter.post("/api/grades/batch", async (req, res) => {
    try {
      // Validate each grade in the batch
      const grades = req.body.grades;
      if (!Array.isArray(grades)) {
        return res.status(400).json({ message: "Grades must be an array" });
      }
      
      const validatedGrades = grades.map(grade => insertGradeSchema.parse(grade));
      const newGrades = await storage.batchCreateGrades(validatedGrades);
      
      res.status(201).json(newGrades);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating grades" });
    }
  });

  apiRouter.put("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedGrade = await storage.updateGrade(id, req.body);
      if (!updatedGrade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      res.json(updatedGrade);
    } catch (error) {
      res.status(500).json({ message: "Error updating grade" });
    }
  });

  apiRouter.delete("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteGrade(id);
      if (!success) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting grade" });
    }
  });

  // ********************
  // Behavior Assessment API endpoints
  // ********************
  apiRouter.get("/api/behavior-assessments", async (req, res) => {
    try {
      const { studentId, classId } = req.query;
      
      // Filter op student ID of klas ID indien opgegeven
      let filter: any = {};
      if (studentId) filter = { ...filter, studentId: parseInt(studentId as string) };
      if (classId) filter = { ...filter, classId: parseInt(classId as string) };
      
      const assessments = await storage.getBehaviorAssessments(filter);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching behavior assessments" });
    }
  });

  apiRouter.get("/api/behavior-assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const assessment = await storage.getBehaviorAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Behavior assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching behavior assessment" });
    }
  });

  apiRouter.post("/api/behavior-assessments", async (req, res) => {
    try {
      const validatedData = insertBehaviorAssessmentSchema.parse(req.body);
      const newAssessment = await storage.createBehaviorAssessment(validatedData);
      res.status(201).json(newAssessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating behavior assessment" });
    }
  });

  apiRouter.post("/api/behavior-assessments/batch", async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Expected an array of behavior assessments" });
      }
      
      const validatedAssessments = req.body.map(assessment => 
        insertBehaviorAssessmentSchema.parse(assessment)
      );
      
      const newAssessments = await storage.createBehaviorAssessments(validatedAssessments);
      res.status(201).json(newAssessments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating behavior assessments" });
    }
  });

  apiRouter.put("/api/behavior-assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedAssessment = await storage.updateBehaviorAssessment(id, req.body);
      if (!updatedAssessment) {
        return res.status(404).json({ message: "Behavior assessment not found" });
      }
      
      res.json(updatedAssessment);
    } catch (error) {
      res.status(500).json({ message: "Error updating behavior assessment" });
    }
  });

  apiRouter.delete("/api/behavior-assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteBehaviorAssessment(id);
      if (!success) {
        return res.status(404).json({ message: "Behavior assessment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting behavior assessment" });
    }
  });

  // ********************
  // Event API endpoints
  // ********************
  apiRouter.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  apiRouter.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  apiRouter.get("/api/events/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const events = await storage.getEventsByDateRange(start, end);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events by date range" });
    }
  });

  apiRouter.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(validatedData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating event" });
    }
  });

  apiRouter.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedEvent = await storage.updateEvent(id, req.body);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Error updating event" });
    }
  });

  apiRouter.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // ********************
  // Fee API endpoints
  // ********************
  
  // Fee statistieken endpoint - Moet VóóR endpoints met parameters
  apiRouter.get("/api/fees/stats", async (_req, res) => {
    try {
      const stats = await storage.getFeeStats();
      if (!stats) {
        return res.status(404).json({ message: "Fee stats not available" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error fetching fee stats:", error);
      res.status(500).json({ message: "Error fetching fee statistics" });
    }
  });

  // ********************
  // Invoice API endpoints (Facturen)
  // ********************
  
  apiRouter.get("/api/invoices", async (_req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  apiRouter.post("/api/invoices", async (req, res) => {
    try {
      const { studentId, type, description, baseAmount, dueDate, academicYear, classId, notes } = req.body;
      
      // Genereer uniek factuurnummer
      const invoiceNumber = await storage.generateInvoiceNumber(type);
      
      // Bereken kortingen
      const { finalAmount, discountAmount, appliedDiscounts } = await storage.calculateInvoiceAmount(
        parseFloat(baseAmount), 
        parseInt(studentId), 
        academicYear
      );
      
      const invoice = await storage.createInvoice({
        invoiceNumber,
        studentId: parseInt(studentId),
        type,
        description,
        baseAmount: baseAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        status: 'open',
        dueDate: new Date(dueDate),
        academicYear,
        classId: classId ? parseInt(classId) : undefined,
        appliedDiscounts,
        notes
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Error creating invoice" });
    }
  });

  // Bulk facturen voor hele klas
  apiRouter.post("/api/invoices/bulk", async (req, res) => {
    try {
      const { classId, type, description, baseAmount, dueDate, academicYear, notes } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required for bulk invoices" });
      }
      
      // Haal alle studenten van de klas op
      const students = await db.select({ id: students.id })
        .from(studentGroupEnrollments)
        .leftJoin(students, eq(studentGroupEnrollments.studentId, students.id))
        .where(and(
          eq(studentGroupEnrollments.groupId, parseInt(classId)),
          eq(studentGroupEnrollments.status, 'active')
        ));
      
      const createdInvoices = [];
      
      // Maak factuur voor elke student
      for (const student of students) {
        const invoiceNumber = await storage.generateInvoiceNumber(type);
        
        const { finalAmount, discountAmount, appliedDiscounts } = await storage.calculateInvoiceAmount(
          parseFloat(baseAmount), 
          student.id, 
          academicYear
        );
        
        const invoice = await storage.createInvoice({
          invoiceNumber,
          studentId: student.id,
          type,
          description,
          baseAmount: baseAmount.toString(),
          discountAmount: discountAmount.toString(),
          finalAmount: finalAmount.toString(),
          status: 'open',
          dueDate: new Date(dueDate),
          academicYear,
          classId: parseInt(classId),
          appliedDiscounts,
          notes
        });
        
        createdInvoices.push(invoice);
      }
      
      res.status(201).json({ 
        message: `${createdInvoices.length} facturen aangemaakt`,
        invoices: createdInvoices 
      });
    } catch (error) {
      console.error("Error creating bulk invoices:", error);
      res.status(500).json({ message: "Error creating bulk invoices" });
    }
  });

  // ********************
  // Tuition Rates API endpoints (Tarieven)
  // ********************
  
  apiRouter.get("/api/tuition-rates", async (_req, res) => {
    try {
      const rates = await storage.getTuitionRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching tuition rates:", error);
      res.status(500).json({ message: "Error fetching tuition rates" });
    }
  });

  apiRouter.post("/api/tuition-rates", async (req, res) => {
    try {
      const { academicYear, type, name, baseAmount, description } = req.body;
      
      const rate = await storage.createTuitionRate({
        academicYear,
        type,
        name,
        baseAmount: baseAmount.toString(),
        description,
        isActive: true
      });
      
      res.status(201).json(rate);
    } catch (error) {
      console.error("Error creating tuition rate:", error);
      res.status(500).json({ message: "Error creating tuition rate" });
    }
  });

  apiRouter.put("/api/tuition-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { academicYear, type, name, baseAmount, description, isActive } = req.body;
      
      const rate = await storage.updateTuitionRate(id, {
        academicYear,
        type,
        name,
        baseAmount: baseAmount?.toString(),
        description,
        isActive
      });
      
      if (!rate) {
        return res.status(404).json({ message: "Tuition rate not found" });
      }
      
      res.json(rate);
    } catch (error) {
      console.error("Error updating tuition rate:", error);
      res.status(500).json({ message: "Error updating tuition rate" });
    }
  });

  apiRouter.delete("/api/tuition-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTuitionRate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tuition rate not found" });
      }
      
      res.json({ message: "Tuition rate deleted successfully" });
    } catch (error) {
      console.error("Error deleting tuition rate:", error);
      res.status(500).json({ message: "Error deleting tuition rate" });
    }
  });
  
  // Openstaande schulden endpoint - Moet VóóR endpoints met parameters
  apiRouter.get("/api/fees/outstanding", async (_req, res) => {
    try {
      const outstandingDebts = await storage.getOutstandingDebts();
      res.json(outstandingDebts);
    } catch (error) {
      console.error("Error fetching outstanding debts:", error);
      res.status(500).json({ message: "Error fetching outstanding debts" });
    }
  });
  
  // Algemene fee endpoints
  apiRouter.get("/api/fees", async (_req, res) => {
    try {
      const fees = await storage.getFees();
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fees" });
    }
  });

  apiRouter.get("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const fee = await storage.getFee(id);
      if (!fee) {
        return res.status(404).json({ message: "Fee not found" });
      }
      
      res.json(fee);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fee" });
    }
  });

  apiRouter.get("/api/students/:studentId/fees", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const fees = await storage.getFeesByStudent(studentId);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fees by student" });
    }
  });

  apiRouter.get("/api/fees/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const fees = await storage.getFeesByStatus(status);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fees by status" });
    }
  });

  apiRouter.get("/api/fees/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const fees = await storage.getFeesByDateRange(start, end);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fees by date range" });
    }
  });

  apiRouter.post("/api/fees", async (req, res) => {
    try {
      const validatedData = insertFeeSchema.parse(req.body);
      const newFee = await storage.createFee(validatedData);
      res.status(201).json(newFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating fee" });
    }
  });

  apiRouter.put("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedFee = await storage.updateFee(id, req.body);
      if (!updatedFee) {
        return res.status(404).json({ message: "Fee not found" });
      }
      
      res.json(updatedFee);
    } catch (error) {
      res.status(500).json({ message: "Error updating fee" });
    }
  });

  apiRouter.delete("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteFee(id);
      if (!success) {
        return res.status(404).json({ message: "Fee not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting fee" });
    }
  });
  
  // ********************
  // Fee Settings API endpoints
  // ********************
  apiRouter.get("/api/fee-settings", async (_req, res) => {
    try {
      const settings = await storage.getFeeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching fee settings:", error);
      res.status(500).json({ message: "Error fetching fee settings" });
    }
  });
  
  apiRouter.get("/api/fee-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const setting = await storage.getFeeSetting(id);
      if (!setting) {
        return res.status(404).json({ message: "Fee setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching fee setting:", error);
      res.status(500).json({ message: "Error fetching fee setting" });
    }
  });
  
  apiRouter.get("/api/fee-settings/academic-year/:year", async (req, res) => {
    try {
      const year = req.params.year;
      const setting = await storage.getFeeSettingByAcademicYear(year);
      if (!setting) {
        return res.status(404).json({ message: "Fee setting not found for academic year" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching fee setting by academic year:", error);
      res.status(500).json({ message: "Error fetching fee setting by academic year" });
    }
  });
  
  apiRouter.post("/api/fee-settings", async (req, res) => {
    try {
      // TODO: Voeg schema validatie toe
      const newSetting = await storage.createFeeSetting(req.body);
      res.status(201).json(newSetting);
    } catch (error) {
      console.error("Error creating fee setting:", error);
      res.status(500).json({ message: "Error creating fee setting" });
    }
  });
  
  apiRouter.put("/api/fee-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedSetting = await storage.updateFeeSetting(id, req.body);
      if (!updatedSetting) {
        return res.status(404).json({ message: "Fee setting not found" });
      }
      
      res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating fee setting:", error);
      res.status(500).json({ message: "Error updating fee setting" });
    }
  });
  
  apiRouter.delete("/api/fee-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteFeeSetting(id);
      if (!success) {
        return res.status(404).json({ message: "Fee setting not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fee setting:", error);
      res.status(500).json({ message: "Error deleting fee setting" });
    }
  });
  
  // ********************
  // Fee Discounts API endpoints
  // ********************
  apiRouter.get("/api/fee-discounts", async (_req, res) => {
    try {
      const discounts = await storage.getFeeDiscounts();
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching fee discounts:", error);
      res.status(500).json({ message: "Error fetching fee discounts" });
    }
  });
  
  apiRouter.get("/api/fee-discounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const discount = await storage.getFeeDiscount(id);
      if (!discount) {
        return res.status(404).json({ message: "Fee discount not found" });
      }
      
      res.json(discount);
    } catch (error) {
      console.error("Error fetching fee discount:", error);
      res.status(500).json({ message: "Error fetching fee discount" });
    }
  });
  
  apiRouter.get("/api/fee-discounts/academic-year/:year", async (req, res) => {
    try {
      const year = req.params.year;
      const discounts = await storage.getFeeDiscountsByAcademicYear(year);
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching fee discounts by academic year:", error);
      res.status(500).json({ message: "Error fetching fee discounts by academic year" });
    }
  });
  
  apiRouter.post("/api/fee-discounts", async (req, res) => {
    try {
      // TODO: Voeg schema validatie toe
      const newDiscount = await storage.createFeeDiscount(req.body);
      res.status(201).json(newDiscount);
    } catch (error) {
      console.error("Error creating fee discount:", error);
      res.status(500).json({ message: "Error creating fee discount" });
    }
  });
  
  apiRouter.put("/api/fee-discounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedDiscount = await storage.updateFeeDiscount(id, req.body);
      if (!updatedDiscount) {
        return res.status(404).json({ message: "Fee discount not found" });
      }
      
      res.json(updatedDiscount);
    } catch (error) {
      console.error("Error updating fee discount:", error);
      res.status(500).json({ message: "Error updating fee discount" });
    }
  });
  
  apiRouter.delete("/api/fee-discounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteFeeDiscount(id);
      if (!success) {
        return res.status(404).json({ message: "Fee discount not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fee discount:", error);
      res.status(500).json({ message: "Error deleting fee discount" });
    }
  });

  // ********************
  // Student Group API endpoints
  // ********************
  apiRouter.get("/api/student-groups", async (_req, res) => {
    try {
      const groups = await storage.getStudentGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student groups" });
    }
  });

  apiRouter.get("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const group = await storage.getStudentGroup(id);
      if (!group) {
        return res.status(404).json({ message: "Student group not found" });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student group" });
    }
  });

  apiRouter.get("/api/programs/:programId/student-groups", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      if (isNaN(programId)) {
        return res.status(400).json({ message: "Invalid program ID format" });
      }
      
      const groups = await storage.getStudentGroupsByProgram(programId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student groups by program" });
    }
  });

  apiRouter.get("/api/courses/:courseId/student-groups", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const groups = await storage.getStudentGroupsByCourse(courseId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student groups by course" });
    }
  });

  apiRouter.get("/api/student-groups/year/:academicYear", async (req, res) => {
    try {
      const academicYear = req.params.academicYear;
      const groups = await storage.getStudentGroupsByAcademicYear(academicYear);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student groups by academic year" });
    }
  });

  apiRouter.post("/api/student-groups", async (req, res) => {
    try {
      const validatedData = insertStudentGroupSchema.parse(req.body);
      const newGroup = await storage.createStudentGroup(validatedData);
      res.status(201).json(newGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student group" });
    }
  });

  apiRouter.put("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedGroup = await storage.updateStudentGroup(id, req.body);
      if (!updatedGroup) {
        return res.status(404).json({ message: "Student group not found" });
      }
      
      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ message: "Error updating student group" });
    }
  });

  apiRouter.delete("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudentGroup(id);
      if (!success) {
        return res.status(404).json({ message: "Student group not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student group" });
    }
  });

  // ********************
  // Student Group Enrollment API endpoints
  // ********************
  apiRouter.get("/api/student-group-enrollments", async (_req, res) => {
    try {
      const enrollments = await storage.getStudentGroupEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student group enrollments" });
    }
  });

  apiRouter.get("/api/student-group-enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const enrollment = await storage.getStudentGroupEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Student group enrollment not found" });
      }
      
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student group enrollment" });
    }
  });

  apiRouter.get("/api/student-groups/:groupId/enrollments", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID format" });
      }
      
      const enrollments = await storage.getStudentGroupEnrollmentsByGroup(groupId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student group enrollments by group" });
    }
  });

  apiRouter.get("/api/students/:studentId/group-enrollments", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const enrollments = await storage.getStudentGroupEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student group enrollments by student" });
    }
  });

  apiRouter.post("/api/student-group-enrollments", async (req, res) => {
    try {
      const validatedData = insertStudentGroupEnrollmentSchema.parse(req.body);
      const newEnrollment = await storage.createStudentGroupEnrollment(validatedData);
      res.status(201).json(newEnrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student group enrollment" });
    }
  });

  apiRouter.put("/api/student-group-enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedEnrollment = await storage.updateStudentGroupEnrollment(id, req.body);
      if (!updatedEnrollment) {
        return res.status(404).json({ message: "Student group enrollment not found" });
      }
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Error updating student group enrollment" });
    }
  });

  apiRouter.delete("/api/student-group-enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudentGroupEnrollment(id);
      if (!success) {
        return res.status(404).json({ message: "Student group enrollment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student group enrollment" });
    }
  });

  // ********************
  // Lesson API endpoints
  // ********************
  apiRouter.get("/api/lessons", async (_req, res) => {
    try {
      const lessons = await storage.getLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons" });
    }
  });

  apiRouter.get("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lesson" });
    }
  });

  apiRouter.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const lessons = await storage.getLessonsByCourse(courseId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons by course" });
    }
  });

  apiRouter.get("/api/student-groups/:groupId/lessons", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID format" });
      }
      
      const lessons = await storage.getLessonsByGroup(groupId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons by group" });
    }
  });

  apiRouter.get("/api/lessons/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const lessons = await storage.getLessonsByDateRange(start, end);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons by date range" });
    }
  });

  apiRouter.post("/api/lessons", async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      const newLesson = await storage.createLesson(validatedData);
      res.status(201).json(newLesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating lesson" });
    }
  });

  apiRouter.put("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedLesson = await storage.updateLesson(id, req.body);
      if (!updatedLesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(updatedLesson);
    } catch (error) {
      res.status(500).json({ message: "Error updating lesson" });
    }
  });

  apiRouter.delete("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteLesson(id);
      if (!success) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting lesson" });
    }
  });

  // ********************
  // Examination API endpoints
  // ********************
  apiRouter.get("/api/examinations", async (_req, res) => {
    try {
      const examinations = await storage.getExaminations();
      res.json(examinations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching examinations" });
    }
  });

  apiRouter.get("/api/examinations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const examination = await storage.getExamination(id);
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      res.json(examination);
    } catch (error) {
      res.status(500).json({ message: "Error fetching examination" });
    }
  });

  apiRouter.get("/api/courses/:courseId/examinations", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      const examinations = await storage.getExaminationsByCourse(courseId);
      res.json(examinations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching examinations by course" });
    }
  });

  apiRouter.get("/api/examinations/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const examinations = await storage.getExaminationsByDateRange(start, end);
      res.json(examinations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching examinations by date range" });
    }
  });

  apiRouter.post("/api/examinations", async (req, res) => {
    try {
      const validatedData = insertExaminationSchema.parse(req.body);
      const newExamination = await storage.createExamination(validatedData);
      res.status(201).json(newExamination);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating examination" });
    }
  });

  apiRouter.put("/api/examinations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedExamination = await storage.updateExamination(id, req.body);
      if (!updatedExamination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      res.json(updatedExamination);
    } catch (error) {
      res.status(500).json({ message: "Error updating examination" });
    }
  });

  apiRouter.delete("/api/examinations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteExamination(id);
      if (!success) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting examination" });
    }
  });

  // ********************
  // Guardian API endpoints
  // ********************
  apiRouter.get("/api/guardians", async (_req, res) => {
    try {
      const guardians = await storage.getGuardians();
      res.json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardians" });
    }
  });
  
  // Zoek voogden op basis van achternaam
  apiRouter.get("/api/guardians/search", async (req, res) => {
    try {
      const { lastName } = req.query;
      if (!lastName) {
        return res.status(400).json({ message: "Last name is required for search" });
      }
      
      // Haal alle voogden op en filter op de server
      const allGuardians = await storage.getGuardians();
      const matchingGuardians = allGuardians.filter(
        guardian => guardian.lastName.toLowerCase() === (lastName as string).toLowerCase()
      );
      
      res.json(matchingGuardians);
    } catch (error) {
      console.error("Error searching guardians by last name:", error);
      res.status(500).json({ message: "Error searching guardians by last name" });
    }
  });

  apiRouter.get("/api/guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const guardian = await storage.getGuardian(id);
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.json(guardian);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardian" });
    }
  });

  apiRouter.get("/api/guardians", async (req, res) => {
    try {
      const guardians = await storage.getGuardians();
      res.json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardians" });
    }
  });

  apiRouter.get("/api/guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const guardian = await storage.getGuardian(id);
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.json(guardian);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardian" });
    }
  });

  apiRouter.post("/api/guardians", async (req, res) => {
    try {
      const validatedData = insertGuardianSchema.parse(req.body);
      const newGuardian = await storage.createGuardian(validatedData);
      res.status(201).json(newGuardian);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating guardian" });
    }
  });

  apiRouter.put("/api/guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedGuardian = await storage.updateGuardian(id, req.body);
      if (!updatedGuardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.json(updatedGuardian);
    } catch (error) {
      res.status(500).json({ message: "Error updating guardian" });
    }
  });

  apiRouter.delete("/api/guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteGuardian(id);
      if (!success) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting guardian" });
    }
  });

  // ********************
  // Student Guardian API endpoints
  // ********************
  apiRouter.get("/api/student-guardians", async (_req, res) => {
    try {
      const relations = await storage.getStudentGuardians();
      res.json(relations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student-guardian relations" });
    }
  });

  apiRouter.get("/api/student-guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const relation = await storage.getStudentGuardian(id);
      if (!relation) {
        return res.status(404).json({ message: "Student-guardian relation not found" });
      }
      
      res.json(relation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student-guardian relation" });
    }
  });

  apiRouter.get("/api/students/:studentId/guardians", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const relations = await storage.getStudentGuardiansByStudent(studentId);
      res.json(relations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student-guardian relations by student" });
    }
  });

  apiRouter.get("/api/guardians/:guardianId/students", async (req, res) => {
    try {
      const guardianId = parseInt(req.params.guardianId);
      if (isNaN(guardianId)) {
        return res.status(400).json({ message: "Invalid guardian ID format" });
      }
      
      const relations = await storage.getStudentGuardiansByGuardian(guardianId);
      res.json(relations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student-guardian relations by guardian" });
    }
  });

  apiRouter.post("/api/student-guardians", async (req, res) => {
    try {
      console.log("Student-Guardian data received:", req.body);
      const validatedData = insertStudentGuardianSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const newRelation = await storage.createStudentGuardian(validatedData);
      res.status(201).json(newRelation);
    } catch (error) {
      console.error("Error creating student-guardian relation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student-guardian relation" });
    }
  });

  apiRouter.put("/api/student-guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedRelation = await storage.updateStudentGuardian(id, req.body);
      if (!updatedRelation) {
        return res.status(404).json({ message: "Student-guardian relation not found" });
      }
      
      res.json(updatedRelation);
    } catch (error) {
      res.status(500).json({ message: "Error updating student-guardian relation" });
    }
  });

  apiRouter.delete("/api/student-guardians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudentGuardian(id);
      if (!success) {
        return res.status(404).json({ message: "Student-guardian relation not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student-guardian relation" });
    }
  });

  // ********************
  // Student Program API endpoints
  // ********************
  apiRouter.get("/api/student-programs", async (_req, res) => {
    try {
      const studentPrograms = await storage.getStudentPrograms();
      res.json(studentPrograms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student programs" });
    }
  });

  apiRouter.get("/api/student-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const studentProgram = await storage.getStudentProgram(id);
      if (!studentProgram) {
        return res.status(404).json({ message: "Student program not found" });
      }
      
      res.json(studentProgram);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student program" });
    }
  });

  apiRouter.get("/api/students/:studentId/programs", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const studentPrograms = await storage.getStudentProgramsByStudent(studentId);
      res.json(studentPrograms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student programs" });
    }
  });

  apiRouter.get("/api/programs/:programId/students", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      if (isNaN(programId)) {
        return res.status(400).json({ message: "Invalid program ID format" });
      }
      
      const studentPrograms = await storage.getStudentProgramsByProgram(programId);
      res.json(studentPrograms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student programs" });
    }
  });

  apiRouter.get("/api/students/:studentId/primary-program", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      const primaryProgram = await storage.getPrimaryProgramByStudent(studentId);
      if (!primaryProgram) {
        return res.status(404).json({ message: "Primary program not found for student" });
      }
      
      res.json(primaryProgram);
    } catch (error) {
      res.status(500).json({ message: "Error fetching primary program" });
    }
  });

  apiRouter.post("/api/student-programs", async (req, res) => {
    try {
      // Valideer input met Zod schema
      const validatedData = insertStudentProgramSchema.parse(req.body);
      
      const studentProgram = await storage.createStudentProgram(validatedData);
      res.status(201).json(studentProgram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating student program" });
    }
  });

  apiRouter.patch("/api/student-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const studentProgram = await storage.updateStudentProgram(id, req.body);
      if (!studentProgram) {
        return res.status(404).json({ message: "Student program not found" });
      }
      
      res.json(studentProgram);
    } catch (error) {
      res.status(500).json({ message: "Error updating student program" });
    }
  });

  apiRouter.delete("/api/student-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteStudentProgram(id);
      if (!success) {
        return res.status(404).json({ message: "Student program not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student program" });
    }
  });

  // ********************
  // User API endpoints
  // ********************
  apiRouter.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  apiRouter.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  apiRouter.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  apiRouter.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  apiRouter.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // ******************* 
  // Dashboard API endpoints
  // *******************
  apiRouter.get("/api/dashboard/stats", async (_req, res) => {
    try {
      // Verzamel alle benodigde data
      const students = await storage.getStudents();
      const courses = await storage.getCourses();
      const programs = await storage.getPrograms();
      const teachers = await storage.getTeachers();
      const studentGroups = await storage.getStudentGroups();
      
      // Bereken statistieken
      const totalStudents = students.length;
      const activeCourses = courses.length;
      const activePrograms = programs.length;
      const totalTeachers = teachers.length;
      const studentGroups_count = studentGroups.length;
      
      // Stuur response
      res.json({
        totalStudents,
        activeCourses,
        activePrograms,
        totalTeachers,
        studentGroups: studentGroups_count
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats", error: String(error) });
    }
  });
  
  apiRouter.get("/api/dashboard/enrollment", async (_req, res) => {
    try {
      // Voor demo-doeleinden genereren we gesimuleerde data
      // In productie zou dit uit de database komen
      const enrollmentTrend = [
        { month: "Jan", count: 12 },
        { month: "Feb", count: 15 },
        { month: "Mar", count: 21 },
        { month: "Apr", count: 18 },
        { month: "Mei", count: 24 },
        { month: "Jun", count: 22 },
        { month: "Jul", count: 16 },
        { month: "Aug", count: 14 },
        { month: "Sep", count: 30 },
        { month: "Okt", count: 26 },
        { month: "Nov", count: 19 },
        { month: "Dec", count: 10 }
      ];
      
      res.json({ enrollmentTrend });
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollment trend" });
    }
  });
  
  apiRouter.get("/api/dashboard/recent-students", async (_req, res) => {
    try {
      // Haal de 5 meest recente studenten op (in productie zou dit op datum sorteren)
      const students = await storage.getStudents();
      const recentStudents = students.slice(0, 5);
      
      res.json(recentStudents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent students" });
    }
  });
  
  apiRouter.get("/api/dashboard/events", async (_req, res) => {
    try {
      // Haal aankomende evenementen op voor de komende maand
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      const events = await storage.getEventsByDateRange(now, oneMonthLater);
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming events" });
    }
  });

  // ********************
  // Teacher API endpoints
  // ********************
  apiRouter.get("/api/teachers", async (req, res) => {
    try {
      const { searchTerm, page = '1', limit = '10' } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const offset = (pageNumber - 1) * limitNumber;
      
      // Haal alle docenten op
      let teachers = await storage.getTeachers();
      console.log("Fetched teachers:", teachers);
      let totalCount = teachers.length;
      
      // Filter op zoekterm als die is opgegeven
      if (searchTerm) {
        const term = (searchTerm as string).toLowerCase();
        teachers = teachers.filter(teacher => 
          teacher.firstName.toLowerCase().includes(term) || 
          teacher.lastName.toLowerCase().includes(term) || 
          teacher.email.toLowerCase().includes(term)
        );
        totalCount = teachers.length;
      }
      
      // Paginering toepassen
      teachers = teachers.slice(offset, offset + limitNumber);
      
      res.json({ teachers, totalCount });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Error fetching teachers" });
    }
  });
  
  apiRouter.get("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const teacher = await storage.getTeacher(id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher" });
    }
  });
  
  apiRouter.post("/api/teachers", async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      
      // Controleer of e-mail al bestaat
      const existingTeacher = await storage.getTeacherByEmail(validatedData.email);
      if (existingTeacher) {
        return res.status(409).json({ message: "Email already in use" });
      }
      
      // Genereer teacherId als deze niet is opgegeven
      if (!validatedData.teacherId) {
        const teachers = await storage.getTeachers();
        const nextId = (teachers.length + 1).toString();
        validatedData.teacherId = `D-${nextId.padStart(3, '0')}`;
      }
      
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teacher data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher" });
    }
  });
  
  apiRouter.put("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Controleer of docent bestaat
      const existingTeacher = await storage.getTeacher(id);
      if (!existingTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Valideer de gegevens
      const validatedData = insertTeacherSchema.partial().parse(req.body);
      
      // Controleer of e-mail al in gebruik is door een andere docent
      if (validatedData.email && validatedData.email !== existingTeacher.email) {
        const teacherWithEmail = await storage.getTeacherByEmail(validatedData.email);
        if (teacherWithEmail && teacherWithEmail.id !== id) {
          return res.status(409).json({ message: "Email already in use by another teacher" });
        }
      }
      
      const updatedTeacher = await storage.updateTeacher(id, validatedData);
      res.json(updatedTeacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teacher data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher" });
    }
  });
  
  apiRouter.delete("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteTeacher(id);
      if (!success) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher" });
    }
  });
  
  // Teacher Availability API endpoints
  apiRouter.get("/api/teacher-availability", async (req, res) => {
    try {
      const { teacherId } = req.query;
      
      if (teacherId) {
        const id = parseInt(teacherId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid teacher ID format" });
        }
        
        const availabilities = await storage.getTeacherAvailabilitiesByTeacher(id);
        res.json(availabilities);
      } else {
        const availabilities = await storage.getTeacherAvailabilities();
        res.json(availabilities);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher availabilities" });
    }
  });
  
  apiRouter.get("/api/teacher-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const availability = await storage.getTeacherAvailability(id);
      if (!availability) {
        return res.status(404).json({ message: "Teacher availability not found" });
      }
      
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher availability" });
    }
  });
  
  apiRouter.post("/api/teacher-availability", async (req, res) => {
    try {
      const validatedData = insertTeacherAvailabilitySchema.parse(req.body);
      
      // Controleer of docent bestaat
      const teacher = await storage.getTeacher(validatedData.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const availability = await storage.createTeacherAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher availability" });
    }
  });
  
  apiRouter.put("/api/teacher-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Controleer of beschikbaarheid bestaat
      const existingAvailability = await storage.getTeacherAvailability(id);
      if (!existingAvailability) {
        return res.status(404).json({ message: "Teacher availability not found" });
      }
      
      // Valideer de gegevens
      const validatedData = insertTeacherAvailabilitySchema.partial().parse(req.body);
      
      const updatedAvailability = await storage.updateTeacherAvailability(id, validatedData);
      res.json(updatedAvailability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher availability" });
    }
  });
  
  apiRouter.delete("/api/teacher-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteTeacherAvailability(id);
      if (!success) {
        return res.status(404).json({ message: "Teacher availability not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher availability" });
    }
  });
  
  // Teacher Language API endpoints
  apiRouter.get("/api/teacher-languages", async (req, res) => {
    try {
      const { teacherId } = req.query;
      
      if (teacherId) {
        const id = parseInt(teacherId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid teacher ID format" });
        }
        
        const languages = await storage.getTeacherLanguagesByTeacher(id);
        res.json(languages);
      } else {
        const languages = await storage.getTeacherLanguages();
        res.json(languages);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher languages" });
    }
  });
  
  apiRouter.get("/api/teacher-languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const language = await storage.getTeacherLanguage(id);
      if (!language) {
        return res.status(404).json({ message: "Teacher language not found" });
      }
      
      res.json(language);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher language" });
    }
  });
  
  apiRouter.post("/api/teacher-languages", async (req, res) => {
    try {
      const validatedData = insertTeacherLanguageSchema.parse(req.body);
      
      // Controleer of docent bestaat
      const teacher = await storage.getTeacher(validatedData.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const language = await storage.createTeacherLanguage(validatedData);
      res.status(201).json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid language data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher language" });
    }
  });
  
  apiRouter.put("/api/teacher-languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Controleer of taal bestaat
      const existingLanguage = await storage.getTeacherLanguage(id);
      if (!existingLanguage) {
        return res.status(404).json({ message: "Teacher language not found" });
      }
      
      // Valideer de gegevens
      const validatedData = insertTeacherLanguageSchema.partial().parse(req.body);
      
      const updatedLanguage = await storage.updateTeacherLanguage(id, validatedData);
      res.json(updatedLanguage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid language data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher language" });
    }
  });
  
  apiRouter.delete("/api/teacher-languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteTeacherLanguage(id);
      if (!success) {
        return res.status(404).json({ message: "Teacher language not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher language" });
    }
  });
  
  // Teacher Course Assignment API endpoints
  apiRouter.get("/api/teacher-course-assignments", async (req, res) => {
    try {
      const { teacherId, courseId } = req.query;
      
      if (teacherId) {
        const id = parseInt(teacherId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid teacher ID format" });
        }
        
        const assignments = await storage.getTeacherCourseAssignmentsByTeacher(id);
        
        // Verrijk de toewijzingen met cursusinformatie
        const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
          const course = await storage.getCourse(assignment.courseId);
          return {
            ...assignment,
            courseName: course ? course.name : undefined
          };
        }));
        
        res.json(enrichedAssignments);
      } else if (courseId) {
        const id = parseInt(courseId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid course ID format" });
        }
        
        const assignments = await storage.getTeacherCourseAssignmentsByCourse(id);
        res.json(assignments);
      } else {
        const assignments = await storage.getTeacherCourseAssignments();
        res.json(assignments);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher course assignments" });
    }
  });
  
  apiRouter.get("/api/teacher-course-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const assignment = await storage.getTeacherCourseAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Teacher course assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teacher course assignment" });
    }
  });
  
  apiRouter.post("/api/teacher-course-assignments", async (req, res) => {
    try {
      const validatedData = insertTeacherCourseAssignmentSchema.parse(req.body);
      
      // Controleer of docent bestaat
      const teacher = await storage.getTeacher(validatedData.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Controleer of cursus bestaat
      const course = await storage.getCourse(validatedData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const assignment = await storage.createTeacherCourseAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher course assignment" });
    }
  });
  
  apiRouter.put("/api/teacher-course-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Controleer of toewijzing bestaat
      const existingAssignment = await storage.getTeacherCourseAssignment(id);
      if (!existingAssignment) {
        return res.status(404).json({ message: "Teacher course assignment not found" });
      }
      
      // Valideer de gegevens
      const validatedData = insertTeacherCourseAssignmentSchema.partial().parse(req.body);
      
      const updatedAssignment = await storage.updateTeacherCourseAssignment(id, validatedData);
      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher course assignment" });
    }
  });
  
  apiRouter.delete("/api/teacher-course-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteTeacherCourseAssignment(id);
      if (!success) {
        return res.status(404).json({ message: "Teacher course assignment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher course assignment" });
    }
  });

  // ********************
  // Notification API endpoints
  // ********************
  apiRouter.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Ongeldig gebruikers-ID" });
      }
      
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Fout bij ophalen notificaties" });
    }
  });
  
  apiRouter.get("/api/notifications/user/:userId/unread", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Ongeldig gebruikers-ID" });
      }
      
      const notifications = await storage.getUnreadNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Fout bij ophalen ongelezen notificaties" });
    }
  });
  
  apiRouter.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Fout bij maken notificatie" });
    }
  });
  
  apiRouter.patch("/api/notifications/:id/mark-read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Ongeldig notificatie-ID" });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notificatie niet gevonden" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Fout bij markeren notificatie als gelezen" });
    }
  });
  
  apiRouter.patch("/api/notifications/:id/mark-unread", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Ongeldig notificatie-ID" });
      }
      
      // Controleer eerst of de notificatie bestaat voordat we proberen hem te updaten
      const existingNotification = await storage.getNotification(notificationId);
      if (!existingNotification) {
        return res.status(404).json({ message: "Notificatie niet gevonden" });
      }
      
      try {
        const notification = await storage.markNotificationAsUnread(notificationId);
        res.json(notification);
      } catch (updateError) {
        console.error("Error updating notification:", updateError);
        res.status(500).json({ message: "Fout bij updaten notificatie", error: updateError.message });
      }
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      res.status(500).json({ message: "Fout bij markeren notificatie als ongelezen", error: error.message });
    }
  });
  
  apiRouter.patch("/api/notifications/user/:userId/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Ongeldig gebruikers-ID" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Fout bij markeren alle notificaties als gelezen" });
    }
  });
  
  apiRouter.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Ongeldig notificatie-ID" });
      }
      
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Fout bij verwijderen notificatie" });
    }
  });
  
  // ****************
  // Lokalen (Rooms)
  // ****************
  
  // Haal alle lokalen op met filtering en paginering
  apiRouter.get("/api/rooms", getRooms);
  
  // Haal unieke locaties op voor filtering
  apiRouter.get("/api/rooms/locations", getLocations);
  
  // Haal een specifiek lokaal op
  apiRouter.get("/api/rooms/:id", getRoomById);
  
  // Maak een nieuw lokaal aan
  apiRouter.post("/api/rooms", ...createRoom);
  
  // Werk een lokaal bij
  apiRouter.patch("/api/rooms/:id", ...updateRoom);
  
  // Verwijder een lokaal
  apiRouter.delete("/api/rooms/:id", deleteRoom);

  // ****************
  // Berichten (Messages)
  // ****************

  // Haal alle berichten op
  apiRouter.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Fout bij ophalen berichten:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van berichten" });
    }
  });

  // Haal een specifiek bericht op
  apiRouter.get("/api/messages/:id", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Ongeldig bericht ID" });
      }

      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: "Bericht niet gevonden" });
      }

      res.json(message);
    } catch (error) {
      console.error("Fout bij ophalen bericht:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van het bericht" });
    }
  });

  // Haal berichten op voor een specifieke afzender
  apiRouter.get("/api/messages/sender/:id/:role", async (req, res) => {
    try {
      const senderId = parseInt(req.params.id);
      const senderRole = req.params.role;
      
      if (isNaN(senderId)) {
        return res.status(400).json({ error: "Ongeldig afzender ID" });
      }

      const messages = await storage.getMessagesBySender(senderId, senderRole);
      res.json(messages);
    } catch (error) {
      console.error("Fout bij ophalen berichten van afzender:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van berichten" });
    }
  });

  // Haal berichten op voor een specifieke ontvanger
  apiRouter.get("/api/messages/receiver/:id/:role", async (req, res) => {
    try {
      const receiverId = parseInt(req.params.id);
      const receiverRole = req.params.role;
      
      if (isNaN(receiverId)) {
        return res.status(400).json({ error: "Ongeldig ontvanger ID" });
      }

      const messages = await storage.getMessagesByReceiver(receiverId, receiverRole);
      res.json(messages);
    } catch (error) {
      console.error("Fout bij ophalen berichten voor ontvanger:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van berichten" });
    }
  });

  // Haal een thread van berichten op
  apiRouter.get("/api/messages/thread/:id", async (req, res) => {
    try {
      const parentMessageId = parseInt(req.params.id);
      
      if (isNaN(parentMessageId)) {
        return res.status(400).json({ error: "Ongeldig parent bericht ID" });
      }

      const messages = await storage.getMessageThread(parentMessageId);
      res.json(messages);
    } catch (error) {
      console.error("Fout bij ophalen berichtenthread:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van berichtenthread" });
    }
  });

  // Haal het aantal ongelezen berichten op
  apiRouter.get("/api/messages/unread/:id/:role", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userRole = req.params.role;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ongeldig gebruiker ID" });
      }

      const count = await storage.getUnreadMessagesCount(userId, userRole);
      res.json({ count });
    } catch (error) {
      console.error("Fout bij ophalen aantal ongelezen berichten:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van het aantal ongelezen berichten" });
    }
  });

  // Haal de geautoriseerde ontvangers op voor een afzender
  apiRouter.get("/api/messages/receivers/:id/:role", async (req, res) => {
    try {
      const senderId = parseInt(req.params.id);
      const senderRole = req.params.role;
      
      if (isNaN(senderId)) {
        return res.status(400).json({ error: "Ongeldig afzender ID" });
      }

      const receivers = await storage.getAuthorizedReceivers(senderId, senderRole);
      res.json(receivers);
    } catch (error) {
      console.error("Fout bij ophalen geautoriseerde ontvangers:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van geautoriseerde ontvangers" });
    }
  });

  // Maak een nieuw bericht aan
  apiRouter.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const newMessage = await storage.createMessage(messageData);
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Fout bij aanmaken bericht:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Ongeldige berichtgegevens", details: error.format() });
      }
      res.status(500).json({ error: "Er is een fout opgetreden bij het aanmaken van het bericht" });
    }
  });

  // Markeer een bericht als gelezen
  apiRouter.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Ongeldig bericht ID" });
      }

      const updatedMessage = await storage.markMessageAsRead(messageId);
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Bericht niet gevonden" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Fout bij markeren bericht als gelezen:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het markeren van het bericht als gelezen" });
    }
  });

  // Verwijder een bericht
  apiRouter.delete("/api/messages/:id", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Ongeldig bericht ID" });
      }

      const success = await storage.deleteMessage(messageId);
      
      if (!success) {
        return res.status(404).json({ error: "Bericht niet gevonden" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Fout bij verwijderen bericht:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het verwijderen van het bericht" });
    }
  });

  // Calendar events routes
  apiRouter.get("/api/calendar/events", async (req, res) => {
    try {
      const events = Array.from(globalCalendarEventsStore.values());
      console.log("Returning events:", events.length);
      res.json({ events });
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  apiRouter.post("/api/calendar/events", async (req, res) => {
    try {
      console.log("Creating calendar event:", req.body);
      const newEvent = {
        id: Date.now().toString(),
        ...req.body
      };
      
      // Sla op in de globale Map
      globalCalendarEventsStore.set(newEvent.id, newEvent);
      console.log("Event stored, total events:", globalCalendarEventsStore.size);
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json({ schedules });
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // Initialize Mollie client
  const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! });

  // Mollie Payment Routes
  
  // Get all payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get payments by student
  app.get("/api/payments/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const payments = await storage.getPaymentsByStudent(studentId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching student payments:", error);
      res.status(500).json({ error: "Failed to fetch student payments" });
    }
  });

  // Create new payment (start Mollie payment process)
  apiRouter.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Create payment in Mollie
      const molliePayment = await mollieClient.payments.create({
        amount: {
          currency: paymentData.currency || 'EUR',
          value: paymentData.amount
        },
        description: paymentData.description,
        redirectUrl: paymentData.redirectUrl || `${req.protocol}://${req.get('host')}/payment-success`,
        webhookUrl: paymentData.webhookUrl || `${req.protocol}://${req.get('host')}/api/payments/webhook`,
        metadata: {
          studentId: paymentData.studentId.toString(),
          feeId: paymentData.feeId?.toString() || null
        }
      });

      // Save payment to database
      const payment = await storage.createPayment({
        ...paymentData,
        molliePaymentId: molliePayment.id,
        checkoutUrl: molliePayment._links.checkout?.href || null,
        status: 'pending',
        mollieStatus: molliePayment.status,
        expiresAt: molliePayment.expiresAt ? new Date(molliePayment.expiresAt) : null
      });

      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Mollie webhook endpoint
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const paymentId = req.body.id;
      
      if (!paymentId) {
        return res.status(400).json({ error: "Missing payment ID" });
      }

      // Get payment details from Mollie
      const molliePayment = await mollieClient.payments.get(paymentId);
      
      // Update payment in database
      const updateData: any = {
        mollieStatus: molliePayment.status,
        status: molliePayment.status === 'paid' ? 'paid' : 
                molliePayment.status === 'failed' ? 'failed' :
                molliePayment.status === 'canceled' ? 'canceled' :
                molliePayment.status === 'expired' ? 'expired' : 'pending'
      };

      if (molliePayment.status === 'paid' && molliePayment.paidAt) {
        updateData.paidAt = new Date(molliePayment.paidAt);
        updateData.paymentMethod = molliePayment.method;
      }

      if (molliePayment.status === 'failed' && molliePayment.details) {
        updateData.failureReason = molliePayment.details.failureReason;
      }

      await storage.updatePaymentByMollieId(paymentId, updateData);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Get payment by ID
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  // Get payment status from Mollie
  app.get("/api/payments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      
      if (!payment || !payment.molliePaymentId) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Get latest status from Mollie
      const molliePayment = await mollieClient.payments.get(payment.molliePaymentId);
      
      // Update local payment status
      const updateData: any = {
        mollieStatus: molliePayment.status,
        status: molliePayment.status === 'paid' ? 'paid' : 
                molliePayment.status === 'failed' ? 'failed' :
                molliePayment.status === 'canceled' ? 'canceled' :
                molliePayment.status === 'expired' ? 'expired' : 'pending'
      };

      if (molliePayment.status === 'paid' && molliePayment.paidAt) {
        updateData.paidAt = new Date(molliePayment.paidAt);
        updateData.paymentMethod = molliePayment.method;
      }

      const updatedPayment = await storage.updatePayment(id, updateData);

      res.json(updatedPayment);
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Get payment statistics
  app.get("/api/payments/stats", async (req, res) => {
    try {
      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment stats" });
    }
  });

  // Student Siblings endpoints
  app.get("/api/students/:studentId/siblings", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const siblings = await storage.getStudentSiblings(studentId);
      res.json(siblings);
    } catch (error) {
      console.error("Error getting student siblings:", error);
      res.status(500).json({ error: "Failed to get student siblings" });
    }
  });

  app.post("/api/students/:studentId/siblings", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const { siblingId, relationship = "sibling" } = req.body;
      
      if (!siblingId) {
        return res.status(400).json({ error: "siblingId is required" });
      }

      await storage.addStudentSibling(studentId, parseInt(siblingId), relationship);
      res.status(201).json({ message: "Sibling relationship created successfully" });
    } catch (error) {
      console.error("Error adding student sibling:", error);
      res.status(500).json({ error: "Failed to add student sibling" });
    }
  });

  app.delete("/api/students/:studentId/siblings/:siblingId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const siblingId = parseInt(req.params.siblingId);
      
      await storage.removeStudentSibling(studentId, siblingId);
      res.json({ message: "Sibling relationship removed successfully" });
    } catch (error) {
      console.error("Error removing student sibling:", error);
      res.status(500).json({ error: "Failed to remove student sibling" });
    }
  });

  // creëer HTTP server
  const server = createServer(app);

  return server;
}
