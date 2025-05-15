import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage/index";
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
  insertStudentGuardianSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app;

  // Students API
  apiRouter.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
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

  apiRouter.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const newStudent = await storage.createStudent(validatedData);
      res.status(201).json(newStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student" });
    }
  });

  apiRouter.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedStudent = await storage.updateStudent(id, req.body);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Error updating student" });
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student" });
    }
  });

  // Programs API
  apiRouter.get("/api/programs", async (req, res) => {
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting program" });
    }
  });

  // Courses API
  apiRouter.get("/api/courses", async (req, res) => {
    try {
      const programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
      
      let courses;
      if (programId && !isNaN(programId)) {
        courses = await storage.getCoursesByProgram(programId);
      } else {
        courses = await storage.getCourses();
      }
      
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting course" });
    }
  });

  // Enrollments API
  apiRouter.get("/api/enrollments", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let enrollments;
      if (studentId && !isNaN(studentId)) {
        enrollments = await storage.getEnrollmentsByStudent(studentId);
      } else if (courseId && !isNaN(courseId)) {
        enrollments = await storage.getEnrollmentsByCourse(courseId);
      } else {
        enrollments = await storage.getEnrollments();
      }
      
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments" });
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting enrollment" });
    }
  });

  // Attendance API
  apiRouter.get("/api/attendance", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      let attendance;
      if (studentId && !isNaN(studentId)) {
        attendance = await storage.getAttendanceByStudent(studentId);
      } else if (courseId && !isNaN(courseId)) {
        attendance = await storage.getAttendanceByCourse(courseId);
      } else if (date && !isNaN(date.getTime())) {
        attendance = await storage.getAttendanceByDate(date);
      } else {
        attendance = await storage.getAttendanceRecords();
      }
      
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance records" });
    }
  });

  apiRouter.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const newAttendance = await storage.createAttendance(validatedData);
      res.status(201).json(newAttendance);
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
      
      const updatedAttendance = await storage.updateAttendance(id, req.body);
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting attendance record" });
    }
  });

  // Grades API
  apiRouter.get("/api/grades", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let grades;
      if (studentId && !isNaN(studentId)) {
        grades = await storage.getGradesByStudent(studentId);
      } else if (courseId && !isNaN(courseId)) {
        grades = await storage.getGradesByCourse(courseId);
      } else {
        grades = await storage.getGrades();
      }
      
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades" });
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting grade" });
    }
  });

  // Events API
  apiRouter.get("/api/events", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let events;
      if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        events = await storage.getEventsByDateRange(startDate, endDate);
      } else {
        events = await storage.getEvents();
      }
      
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
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // Authentication API
  apiRouter.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) { // In real app, use bcrypt for password comparison
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      
      // Return user info without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword
      });
      
    } catch (error) {
      res.status(500).json({ message: "Error during authentication" });
    }
  });

  // Users API (admin only in real app)
  apiRouter.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  apiRouter.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Admissions API
  apiRouter.get("/api/admissions/applicants", async (req, res) => {
    try {
      // Get query parameters for filtering
      const { searchTerm, program, status, academicYear, page } = req.query;
      
      // Mock implementation using students as applicants
      const students = await storage.getStudents();
      
      // Apply filters if provided
      let filteredApplicants = students.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        programId: student.programId,
        status: ['pending', 'approved', 'rejected', 'waitlisted'][Math.floor(Math.random() * 4)],
        academicYear: '2023-2024',
        applicationDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
        lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0],
      }));
      
      if (searchTerm) {
        const term = String(searchTerm).toLowerCase();
        filteredApplicants = filteredApplicants.filter(
          app => app.name.toLowerCase().includes(term) || app.email.toLowerCase().includes(term)
        );
      }
      
      if (program && program !== 'all') {
        filteredApplicants = filteredApplicants.filter(app => String(app.programId) === program);
      }
      
      if (status && status !== 'all') {
        filteredApplicants = filteredApplicants.filter(app => app.status === status);
      }
      
      if (academicYear && academicYear !== 'all') {
        filteredApplicants = filteredApplicants.filter(app => app.academicYear === academicYear);
      }
      
      // Pagination
      const pageSize = 10;
      const currentPage = page ? parseInt(String(page)) : 1;
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedApplicants = filteredApplicants.slice(startIndex, startIndex + pageSize);
      
      res.json({
        applicants: paginatedApplicants,
        totalCount: filteredApplicants.length,
        totalPages: Math.ceil(filteredApplicants.length / pageSize),
        currentPage
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching applicants" });
    }
  });

  apiRouter.get("/api/admissions/stats", async (req, res) => {
    try {
      // Mock admission stats
      res.json({
        totalApplications: 182,
        newApplications: 24,
        approved: 76,
        rejected: 15,
        pending: 68,
        waitlisted: 23,
        conversionRate: 78.5,
        applicationsByProgram: [
          { program: "Informatica", count: 56 },
          { program: "Wiskunde", count: 32 },
          { program: "Economie", count: 48 },
          { program: "Psychologie", count: 46 }
        ],
        applicationTrend: [
          { month: "Jan", count: 12 },
          { month: "Feb", count: 18 },
          { month: "Mar", count: 22 },
          { month: "Apr", count: 15 },
          { month: "Mei", count: 28 },
          { month: "Jun", count: 35 },
          { month: "Jul", count: 42 },
          { month: "Aug", count: 10 }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching admission stats" });
    }
  });

  // Academic Years API
  apiRouter.get("/api/academic-years", async (req, res) => {
    try {
      // Mock academic years data
      res.json([
        { id: 1, name: "2021-2022" },
        { id: 2, name: "2022-2023" },
        { id: 3, name: "2023-2024" },
        { id: 4, name: "2024-2025" }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Error fetching academic years" });
    }
  });

  // Dashboard API
  apiRouter.get("/api/dashboard/stats", async (req, res) => {
    try {
      const students = await storage.getStudents();
      const courses = await storage.getCourses();
      const programs = await storage.getPrograms();
      const attendance = await storage.getAttendanceRecords();
      
      const totalAttendance = attendance.length;
      const presentAttendance = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
      
      res.json({
        totalStudents: students.length,
        activeCourses: courses.length,
        programs: programs.length,
        attendanceRate: Math.round(attendanceRate)
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  apiRouter.get("/api/dashboard/enrollment", async (req, res) => {
    try {
      // Mock enrollment trend data
      res.json({
        enrollmentTrend: [
          { month: "Jan", count: 85 },
          { month: "Feb", count: 90 },
          { month: "Mar", count: 92 },
          { month: "Apr", count: 95 },
          { month: "Mei", count: 100 },
          { month: "Jun", count: 110 },
          { month: "Jul", count: 115 },
          { month: "Aug", count: 120 }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollment data" });
    }
  });

  apiRouter.get("/api/dashboard/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      
      // Get upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= now && eventDate <= nextWeek;
      }).slice(0, 5);
      
      res.json(upcomingEvents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  apiRouter.get("/api/dashboard/recent-students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      
      // Sort by ID (assuming higher ID = more recent) and take 5
      const recentStudents = [...students]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);
      
      res.json(recentStudents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent students" });
    }
  });

  // Fees API for stats
  apiRouter.get("/api/fees/stats", async (req, res) => {
    try {
      // Mock fees statistics
      res.json({
        totalCollected: 256780.50,
        pendingAmount: 45320.75,
        overdueAmount: 12340.25,
        collectionRate: 85.2,
        paymentsByMonth: [
          { month: "Jan", amount: 32450.75 },
          { month: "Feb", amount: 28750.50 },
          { month: "Mar", amount: 36540.25 },
          { month: "Apr", amount: 30120.00 },
          { month: "Mei", amount: 38750.25 },
          { month: "Jun", amount: 42150.75 },
          { month: "Jul", amount: 35230.50 },
          { month: "Aug", amount: 12750.50 }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching fees stats" });
    }
  });

  apiRouter.get("/api/fees", async (req, res) => {
    try {
      const students = await storage.getStudents();
      
      // Create mock fee records for each student
      const feeRecords = students.map(student => {
        const semesterFee = 1250 + Math.floor(Math.random() * 750);
        const materialsFee = 180 + Math.floor(Math.random() * 120);
        const totalAmount = semesterFee + materialsFee;
        const paidAmount = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
        
        return {
          id: student.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          invoiceNumber: `INV-${new Date().getFullYear()}-${student.id.toString().padStart(4, '0')}`,
          feeType: 'Collegegeld',
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          dueDate: new Date(Date.now() + Math.floor(Math.random() * 5000000000)).toISOString().split('T')[0],
          status: paidAmount >= totalAmount ? 'Betaald' : (Math.random() > 0.5 ? 'In afwachting' : 'Te laat'),
          lastPaymentDate: paidAmount > 0 ? new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0] : null
        };
      });
      
      res.json(feeRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fee records" });
    }
  });

  // Calendar API
  apiRouter.get("/api/calendar/events", async (req, res) => {
    try {
      const { year, month, view, filter } = req.query;
      
      // Get events from storage
      const allEvents = await storage.getEvents();
      
      // Filter by date range based on view
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      let endDate;
      
      if (view === 'month') {
        endDate = new Date(Number(year), Number(month), 0); // Last day of the month
      } else if (view === 'week') {
        const tempDate = new Date(startDate);
        tempDate.setDate(tempDate.getDate() + 7);
        endDate = tempDate;
      } else { // day view
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59);
      }
      
      // Filter events in the date range
      const filteredEvents = allEvents.filter(event => {
        const eventStartDate = new Date(event.startDate);
        return eventStartDate >= startDate && eventStartDate <= endDate;
      });
      
      // Format events for calendar display
      const formattedEvents = filteredEvents.map(event => {
        const eventDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        
        return {
          id: String(event.id),
          title: event.title,
          date: new Date(event.startDate).toISOString().split('T')[0],
          startTime: new Date(event.startDate).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}),
          endTime: new Date(event.endDate).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}),
          location: event.location || '',
          type: 'event',
          description: event.description
        };
      });
      
      res.json({ events: formattedEvents });
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendar events" });
    }
  });

  // Courses API with list endpoint
  apiRouter.get("/api/courses/list", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json({ courses });
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses list" });
    }
  });

  // Assessments API
  apiRouter.get("/api/assessments", async (req, res) => {
    try {
      const { courseId } = req.query;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      // Mock assessments for the course
      const assessments = [
        { id: 1, name: "Tentamen", type: "examen", date: "2023-12-15", maxScore: 100, weight: 60 },
        { id: 2, name: "Opdracht", type: "opdracht", date: "2023-11-20", maxScore: 50, weight: 20 },
        { id: 3, name: "Presentatie", type: "presentatie", date: "2023-10-30", maxScore: 25, weight: 10 },
        { id: 4, name: "Deelname", type: "participatie", date: "2023-12-01", maxScore: 10, weight: 10 }
      ];
      
      res.json({ assessments });
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  // Grades API
  apiRouter.get("/api/grades", async (req, res) => {
    try {
      const { courseId, assessmentId } = req.query;
      
      if (!courseId || !assessmentId) {
        return res.status(400).json({ message: "Course ID and Assessment ID are required" });
      }
      
      // Get students for this course using enrollments
      const enrollments = await storage.getEnrollmentsByCourse(Number(courseId));
      const studentIds = enrollments.map(e => e.studentId);
      
      // Get all students
      const allStudents = await storage.getStudents();
      
      // Filter students by enrolled students
      const enrolledStudents = allStudents.filter(s => studentIds.includes(s.id));
      
      // Format student data for response
      const students = enrolledStudents.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        email: student.email
      }));
      
      // Get grades for these students for this assessment
      const allGrades = await storage.getGrades();
      
      // Filter grades by course and assessment
      const filteredGrades = allGrades.filter(
        g => g.courseId === Number(courseId) && g.assessmentType === `assessment-${assessmentId}`
      );
      
      // Format grades as a lookup object by student ID
      const grades: Record<number, {score: number, feedback: string}> = {};
      filteredGrades.forEach(grade => {
        grades[grade.studentId] = {
          score: grade.score,
          feedback: grade.remark || ""
        };
      });
      
      res.json({ students, grades });
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades" });
    }
  });

  // Save grades
  apiRouter.post("/api/grades/save", async (req, res) => {
    try {
      const { courseId, assessmentId, grades } = req.body;
      
      if (!courseId || !assessmentId || !grades) {
        return res.status(400).json({ message: "Missing required data" });
      }
      
      // Process each grade update
      const results = await Promise.all(
        Object.entries(grades).map(async ([studentId, gradeData]) => {
          const { score, feedback } = gradeData as { score: number, feedback: string };
          
          // Check if grade already exists
          const allGrades = await storage.getGrades();
          const existingGrade = allGrades.find(
            g => g.studentId === Number(studentId) && 
                 g.courseId === Number(courseId) && 
                 g.assessmentType === `assessment-${assessmentId}`
          );
          
          if (existingGrade) {
            // Update existing grade
            const updatedGrade = await storage.updateGrade(existingGrade.id, {
              score,
              remark: feedback
            });
            return updatedGrade;
          } else {
            // Create new grade
            const newGrade = await storage.createGrade({
              studentId: Number(studentId),
              courseId: Number(courseId),
              assessmentType: `assessment-${assessmentId}`,
              assessmentName: `Beoordeling ${assessmentId}`,
              score,
              maxScore: 100,
              weight: 50, // Default weight
              date: new Date().toISOString(),
              remark: feedback,
              outOf: 100
            });
            return newGrade;
          }
        })
      );
      
      res.json({ success: true, message: "Cijfers succesvol opgeslagen", updatedCount: results.length });
    } catch (error) {
      res.status(500).json({ message: "Error saving grades" });
    }
  });

  // Fees API
  // Fees statistics API moet vóór de route met parameter staan
  apiRouter.get("/fees/stats", async (req, res) => {
    try {
      const fees = await storage.getFees();
      
      const totalCollected = fees
        .filter(fee => fee.status === 'betaald')
        .reduce((sum, fee) => sum + Number(fee.amount), 0);
        
      const pendingAmount = fees
        .filter(fee => fee.status === 'in behandeling' || fee.status === 'te laat' || fee.status === 'gedeeltelijk')
        .reduce((sum, fee) => sum + Number(fee.amount), 0);
        
      const totalStudents = new Set(fees.map(fee => fee.studentId)).size;
      
      const paidCount = fees.filter(fee => fee.status === 'betaald').length;
      const totalCount = fees.length;
      const completionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
      
      res.json({
        stats: {
          totalCollected,
          pendingAmount,
          totalStudents,
          completionRate
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error bij ophalen betaling statistieken" });
    }
  });
  
  // Het is belangrijk dat we eerst de specifieke routes definieren, en dan pas de routes met parameters
  apiRouter.get("/api/fees/stats", async (req, res) => {
    try {
      const fees = await storage.getFees();
      
      const totalCollected = fees
        .filter(fee => fee.status === 'betaald')
        .reduce((sum, fee) => sum + Number(fee.amount), 0);
        
      const pendingAmount = fees
        .filter(fee => fee.status === 'in behandeling' || fee.status === 'te laat' || fee.status === 'gedeeltelijk')
        .reduce((sum, fee) => sum + Number(fee.amount), 0);
        
      const totalStudents = new Set(fees.map(fee => fee.studentId)).size;
      
      const paidCount = fees.filter(fee => fee.status === 'betaald').length;
      const totalCount = fees.length;
      const completionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
      
      res.json({
        stats: {
          totalCollected,
          pendingAmount,
          totalStudents,
          completionRate
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error bij ophalen betaling statistieken" });
    }
  });
  
  apiRouter.get("/api/fees", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const status = req.query.status as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let fees;
      if (studentId && !isNaN(studentId)) {
        fees = await storage.getFeesByStudent(studentId);
      } else if (status) {
        fees = await storage.getFeesByStatus(status);
      } else if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        fees = await storage.getFeesByDateRange(startDate, endDate);
      } else {
        fees = await storage.getFees();
      }
      
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Error bij ophalen betalingen" });
    }
  });

  apiRouter.get("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig ID formaat" });
      }
      
      const fee = await storage.getFee(id);
      if (!fee) {
        return res.status(404).json({ message: "Betaling niet gevonden" });
      }
      
      res.json(fee);
    } catch (error) {
      res.status(500).json({ message: "Error bij ophalen betaling" });
    }
  });

  apiRouter.post("/api/fees", async (req, res) => {
    try {
      const validatedData = insertFeeSchema.parse(req.body);
      const newFee = await storage.createFee(validatedData);
      res.status(201).json(newFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatie error", errors: error.errors });
      }
      res.status(500).json({ message: "Error bij aanmaken betaling" });
    }
  });

  apiRouter.put("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig ID formaat" });
      }
      
      const updatedFee = await storage.updateFee(id, req.body);
      if (!updatedFee) {
        return res.status(404).json({ message: "Betaling niet gevonden" });
      }
      
      res.json(updatedFee);
    } catch (error) {
      res.status(500).json({ message: "Error bij bijwerken betaling" });
    }
  });

  apiRouter.delete("/api/fees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig ID formaat" });
      }
      
      const success = await storage.deleteFee(id);
      if (!success) {
        return res.status(404).json({ message: "Betaling niet gevonden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error bij verwijderen betaling" });
    }
  });

  // Assessments API
  apiRouter.get("/api/assessments", async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      if (courseId) {
        const assessments = await storage.getAssessmentsByCourse(courseId);
        res.json(assessments);
      } else {
        const assessments = await storage.getAssessments();
        res.json(assessments);
      }
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van beoordelingen" });
    }
  });
  
  apiRouter.get("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getAssessment(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Beoordeling niet gevonden" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van beoordeling" });
    }
  });
  
  apiRouter.post("/api/assessments", async (req, res) => {
    try {
      const parseResult = insertAssessmentSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const assessment = await storage.createAssessment(parseResult.data);
      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Fout bij aanmaken van beoordeling" });
    }
  });
  
  apiRouter.put("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertAssessmentSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const assessment = await storage.updateAssessment(id, parseResult.data);
      
      if (!assessment) {
        return res.status(404).json({ message: "Beoordeling niet gevonden" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Fout bij bijwerken van beoordeling" });
    }
  });
  
  apiRouter.delete("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssessment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Beoordeling niet gevonden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Fout bij verwijderen van beoordeling" });
    }
  });
  
  // Grades API
  apiRouter.get("/api/grades", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string) : undefined;
      
      if (studentId && courseId) {
        const grades = await storage.getGradesByStudentAndCourse(studentId, courseId);
        res.json(grades);
      } else if (studentId) {
        const grades = await storage.getGradesByStudent(studentId);
        res.json(grades);
      } else if (courseId) {
        const grades = await storage.getGradesByCourse(courseId);
        res.json(grades);
      } else if (assessmentId) {
        const grades = await storage.getGradesByAssessment(assessmentId);
        res.json(grades);
      } else {
        const grades = await storage.getGrades();
        res.json(grades);
      }
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van cijfers" });
    }
  });
  
  apiRouter.get("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grade = await storage.getGrade(id);
      
      if (!grade) {
        return res.status(404).json({ message: "Cijfer niet gevonden" });
      }
      
      res.json(grade);
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van cijfer" });
    }
  });
  
  apiRouter.post("/api/grades", async (req, res) => {
    try {
      const parseResult = insertGradeSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const grade = await storage.createGrade(parseResult.data);
      res.status(201).json(grade);
    } catch (error) {
      res.status(500).json({ message: "Fout bij aanmaken van cijfer" });
    }
  });
  
  apiRouter.post("/api/grades/batch", async (req, res) => {
    try {
      const schema = z.array(insertGradeSchema);
      const parseResult = schema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const grades = await storage.batchCreateGrades(parseResult.data);
      res.status(201).json(grades);
    } catch (error) {
      res.status(500).json({ message: "Fout bij aanmaken van cijfers in batch" });
    }
  });
  
  apiRouter.put("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertGradeSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const grade = await storage.updateGrade(id, parseResult.data);
      
      if (!grade) {
        return res.status(404).json({ message: "Cijfer niet gevonden" });
      }
      
      res.json(grade);
    } catch (error) {
      res.status(500).json({ message: "Fout bij bijwerken van cijfer" });
    }
  });
  
  apiRouter.delete("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGrade(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cijfer niet gevonden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Fout bij verwijderen van cijfer" });
    }
  });

  // Student Groups API
  apiRouter.get("/api/student-groups", async (req, res) => {
    try {
      const academicYear = req.query.academicYear as string;
      const programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
      const search = req.query.searchTerm as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (academicYear && academicYear !== 'all') {
        const groups = await storage.getStudentGroupsByAcademicYear(academicYear);
        res.json({ 
          studentGroups: groups,
          totalCount: groups.length,
          page,
          totalPages: Math.ceil(groups.length / limit)
        });
      } else if (programId) {
        const groups = await storage.getStudentGroupsByProgram(programId);
        res.json({ 
          studentGroups: groups,
          totalCount: groups.length,
          page,
          totalPages: Math.ceil(groups.length / limit)
        });
      } else {
        const groups = await storage.getStudentGroups();
        res.json({ 
          studentGroups: groups,
          totalCount: groups.length,
          page,
          totalPages: Math.ceil(groups.length / limit)
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van studentengroepen" });
    }
  });
  
  apiRouter.get("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getStudentGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Studentengroep niet gevonden" });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van studentengroep" });
    }
  });
  
  apiRouter.post("/api/student-groups", async (req, res) => {
    try {
      const parseResult = insertStudentGroupSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const group = await storage.createStudentGroup(parseResult.data);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Fout bij aanmaken van studentengroep" });
    }
  });
  
  apiRouter.put("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertStudentGroupSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const group = await storage.updateStudentGroup(id, parseResult.data);
      
      if (!group) {
        return res.status(404).json({ message: "Studentengroep niet gevonden" });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Fout bij bijwerken van studentengroep" });
    }
  });
  
  apiRouter.delete("/api/student-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudentGroup(id);
      
      if (!success) {
        return res.status(404).json({ message: "Studentengroep niet gevonden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Fout bij verwijderen van studentengroep" });
    }
  });
  
  // Student Group Enrollments API
  apiRouter.get("/api/student-group-enrollments", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
      
      if (studentId) {
        const enrollments = await storage.getStudentGroupEnrollmentsByStudent(studentId);
        res.json(enrollments);
      } else if (groupId) {
        const enrollments = await storage.getStudentGroupEnrollmentsByGroup(groupId);
        res.json(enrollments);
      } else {
        const enrollments = await storage.getStudentGroupEnrollments();
        res.json(enrollments);
      }
    } catch (error) {
      res.status(500).json({ message: "Fout bij ophalen van groepsinschrijvingen" });
    }
  });
  
  apiRouter.post("/api/student-group-enrollments", async (req, res) => {
    try {
      const parseResult = insertStudentGroupEnrollmentSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: parseResult.error.format() });
      }
      
      const enrollment = await storage.createStudentGroupEnrollment(parseResult.data);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Fout bij aanmaken van groepsinschrijving" });
    }
  });
  
  apiRouter.delete("/api/student-group-enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudentGroupEnrollment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Groepsinschrijving niet gevonden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Fout bij verwijderen van groepsinschrijving" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
