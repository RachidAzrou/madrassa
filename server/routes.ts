import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage/index";
import { z } from "zod";
import { 
  insertStudentSchema, 
  insertProgramSchema, 
  insertCourseSchema, 
  insertEnrollmentSchema,
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
  type Student
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app;

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
      
      // Als er geen studenten zijn, begin met 1
      if (!allStudents || allStudents.length === 0) {
        return "1";
      }
      
      // Filter alle geldige numerieke IDs
      const validIds = allStudents
        .map(student => student.studentId)
        .filter(id => /^\d+$/.test(id))
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b); // Sorteer op numerieke volgorde
      
      // Als er geen geldige numerieke IDs zijn, begin met 1
      if (validIds.length === 0) {
        return "1";
      }

      // Zoek naar "gaten" in de reeks
      // Begin te zoeken vanaf 1
      let expectedId = 1;
      
      // Loop door de gesorteerde IDs om het eerste ontbrekende nummer te vinden
      for (const id of validIds) {
        if (id > expectedId) {
          // We hebben een gat gevonden
          return expectedId.toString();
        }
        // Ga door naar het volgende verwachte nummer
        expectedId = id + 1;
      }
      
      // Als er geen gaten zijn, gebruik dan het volgende nummer na het hoogste ID
      return expectedId.toString();
    } catch (error) {
      console.error("Fout bij genereren studentnummer:", error);
      // Fallback naar gewoon oplopend nummer als er een fout optreedt
      return Math.floor(Math.random() * 1000 + 1).toString();
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

  apiRouter.post("/api/students", async (req, res) => {
    try {
      // Log de binnenkomende data voor debugging
      console.log("Received student data:", req.body);
      
      // Genereer een nieuw studentnummer en voeg dit toe aan de data
      const studentData = { ...req.body };
      
      // Als er geen studentnummer is meegegeven of als we het altijd willen overschrijven
      studentData.studentId = await generateNextStudentId();
      
      console.log("Gegenereerd studentnummer:", studentData.studentId);
      
      // We gebruiken het schema om eerst te valideren
      // Transformaties gebeuren in de schema zelf via .transform()
      const validatedData = insertStudentSchema.parse(studentData);
      
      // Log de gevalideerde data
      console.log("Validated student data:", validatedData);
      
      // Stuur de data door naar storage zonder verdere aanpassingen
      const newStudent = await storage.createStudent(validatedData);
      res.status(201).json(newStudent);
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
      
      const success = await storage.deleteProgram(id);
      if (!success) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting program" });
    }
  });

  // ********************
  // Course API endpoints
  // ********************
  apiRouter.get("/api/courses", async (_req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
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
      const enrollments = await storage.getEnrollments();
      
      // Bereken statistieken
      const totalStudents = students.length;
      const activeCourses = courses.length;
      const activePrograms = programs.length;
      const totalEnrollments = enrollments.length;
      
      // Stuur response
      res.json({
        totalStudents,
        activeCourses,
        activePrograms,
        totalEnrollments
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
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

  // creëer HTTP server
  const server = createServer(app);

  return server;
}
