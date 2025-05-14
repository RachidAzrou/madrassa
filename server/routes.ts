import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProgramSchema, 
  studentFormSchema, 
  courseFormSchema, 
  insertEnrollmentSchema, 
  eventFormSchema, 
  attendanceFormSchema, 
  gradeFormSchema,
  insertUserSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: fromZodError(error).message };
      }
      return { data: null, error: 'Validation failed' };
    }
  };

  // Helper middleware for error handling
  const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
    return async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
      }
    };
  };

  // Program routes
  app.get('/api/programs', asyncHandler(async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  }));

  app.get('/api/programs/:id', asyncHandler(async (req, res) => {
    const programId = parseInt(req.params.id);
    const program = await storage.getProgram(programId);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    res.json(program);
  }));

  app.post('/api/programs', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(insertProgramSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const existingProgram = await storage.getProgramByCode(data.code);
    if (existingProgram) {
      return res.status(400).json({ message: 'Program code already exists' });
    }
    
    const program = await storage.createProgram(data);
    res.status(201).json(program);
  }));

  app.put('/api/programs/:id', asyncHandler(async (req, res) => {
    const programId = parseInt(req.params.id);
    const { data, error } = validateRequest(insertProgramSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    if (data.code) {
      const existingProgram = await storage.getProgramByCode(data.code);
      if (existingProgram && existingProgram.id !== programId) {
        return res.status(400).json({ message: 'Program code already exists' });
      }
    }
    
    const updatedProgram = await storage.updateProgram(programId, data);
    
    if (!updatedProgram) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    res.json(updatedProgram);
  }));

  app.delete('/api/programs/:id', asyncHandler(async (req, res) => {
    const programId = parseInt(req.params.id);
    const success = await storage.deleteProgram(programId);
    
    if (!success) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    res.json({ message: 'Program deleted successfully' });
  }));

  // Student routes
  app.get('/api/students', asyncHandler(async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  }));

  app.get('/api/students/:id', asyncHandler(async (req, res) => {
    const studentId = parseInt(req.params.id);
    const student = await storage.getStudent(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const user = await storage.getUser(student.userId);
    const program = await storage.getProgram(student.programId);
    
    res.json({
      ...student,
      user,
      program
    });
  }));

  app.post('/api/students', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(studentFormSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const existingStudent = await storage.getStudentByStudentId(data.studentId);
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }
    
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Extract user data and student data
    const { firstName, lastName, email, username, password } = data;
    const userData = {
      firstName,
      lastName,
      email,
      username,
      password,
      role: 'student',
      profileImage: ''
    };
    
    const studentData = {
      studentId: data.studentId,
      programId: data.programId,
      enrollmentYear: data.enrollmentYear,
      currentYear: data.currentYear,
      status: data.status || 'active',
      userId: 0, // This will be set in createStudent
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      phone: data.phone
    };
    
    const student = await storage.createStudent(studentData, userData);
    res.status(201).json(student);
  }));

  app.put('/api/students/:id', asyncHandler(async (req, res) => {
    const studentId = parseInt(req.params.id);
    const { data, error } = validateRequest(studentFormSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const student = await storage.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // If updating student ID, check for uniqueness
    if (data.studentId && data.studentId !== student.studentId) {
      const existingStudent = await storage.getStudentByStudentId(data.studentId);
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }
    
    // Update user data if provided
    if (data.firstName || data.lastName || data.email || data.username || data.password) {
      const userData: Partial<typeof insertUserSchema._type> = {};
      
      if (data.firstName) userData.firstName = data.firstName;
      if (data.lastName) userData.lastName = data.lastName;
      if (data.email) userData.email = data.email;
      if (data.username) {
        const existingUser = await storage.getUserByUsername(data.username);
        if (existingUser && existingUser.id !== student.userId) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        userData.username = data.username;
      }
      if (data.password) userData.password = data.password;
      
      await storage.updateUser(student.userId, userData);
    }
    
    // Update student data
    const studentData: any = {};
    if (data.programId) studentData.programId = data.programId;
    if (data.enrollmentYear) studentData.enrollmentYear = data.enrollmentYear;
    if (data.currentYear) studentData.currentYear = data.currentYear;
    if (data.status) studentData.status = data.status;
    if (data.dateOfBirth) studentData.dateOfBirth = data.dateOfBirth;
    if (data.gender) studentData.gender = data.gender;
    if (data.address) studentData.address = data.address;
    if (data.phone) studentData.phone = data.phone;
    if (data.studentId) studentData.studentId = data.studentId;
    
    const updatedStudent = await storage.updateStudent(studentId, studentData);
    
    // Get updated data for response
    const updatedUser = await storage.getUser(student.userId);
    const program = await storage.getProgram(updatedStudent!.programId);
    
    res.json({
      ...updatedStudent,
      user: updatedUser,
      program
    });
  }));

  app.delete('/api/students/:id', asyncHandler(async (req, res) => {
    const studentId = parseInt(req.params.id);
    const success = await storage.deleteStudent(studentId);
    
    if (!success) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  }));

  // Course routes
  app.get('/api/courses', asyncHandler(async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  }));

  app.get('/api/courses/:id', asyncHandler(async (req, res) => {
    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const program = course.programId ? await storage.getProgram(course.programId) : null;
    const instructor = course.instructorId ? await storage.getUser(course.instructorId) : null;
    
    res.json({
      ...course,
      program,
      instructor
    });
  }));

  app.post('/api/courses', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(courseFormSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const existingCourse = await storage.getCourseByCode(data.code);
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    
    const course = await storage.createCourse(data);
    res.status(201).json(course);
  }));

  app.put('/api/courses/:id', asyncHandler(async (req, res) => {
    const courseId = parseInt(req.params.id);
    const { data, error } = validateRequest(courseFormSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    if (data.code) {
      const existingCourse = await storage.getCourseByCode(data.code);
      if (existingCourse && existingCourse.id !== courseId) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }
    
    const updatedCourse = await storage.updateCourse(courseId, data);
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(updatedCourse);
  }));

  app.delete('/api/courses/:id', asyncHandler(async (req, res) => {
    const courseId = parseInt(req.params.id);
    const success = await storage.deleteCourse(courseId);
    
    if (!success) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  }));

  // Enrollment routes
  app.get('/api/enrollments', asyncHandler(async (req, res) => {
    const enrollments = await storage.getEnrollments();
    res.json(enrollments);
  }));

  app.get('/api/enrollments/:id', asyncHandler(async (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json(enrollment);
  }));

  app.get('/api/students/:id/enrollments', asyncHandler(async (req, res) => {
    const studentId = parseInt(req.params.id);
    const student = await storage.getStudent(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const enrollments = await storage.getEnrollmentsByStudent(studentId);
    res.json(enrollments);
  }));

  app.get('/api/courses/:id/enrollments', asyncHandler(async (req, res) => {
    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const enrollments = await storage.getEnrollmentsByCourse(courseId);
    res.json(enrollments);
  }));

  app.post('/api/enrollments', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(insertEnrollmentSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    // Check if student exists
    const student = await storage.getStudent(data.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if course exists
    const course = await storage.getCourse(data.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if enrollment already exists
    const enrollments = await storage.getEnrollmentsByStudent(data.studentId);
    const alreadyEnrolled = enrollments.some(e => e.course.id === data.courseId);
    
    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }
    
    // Check if course has capacity
    if (course.enrolled >= course.capacity) {
      return res.status(400).json({ message: 'Course is at maximum capacity' });
    }
    
    const enrollment = await storage.createEnrollment(data);
    res.status(201).json(enrollment);
  }));

  app.put('/api/enrollments/:id', asyncHandler(async (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    const { data, error } = validateRequest(insertEnrollmentSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const enrollment = await storage.getEnrollment(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    const updatedEnrollment = await storage.updateEnrollment(enrollmentId, data);
    res.json(updatedEnrollment);
  }));

  app.delete('/api/enrollments/:id', asyncHandler(async (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    const success = await storage.deleteEnrollment(enrollmentId);
    
    if (!success) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json({ message: 'Enrollment deleted successfully' });
  }));

  // Event routes
  app.get('/api/events', asyncHandler(async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  }));

  app.get('/api/events/upcoming', asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const events = await storage.getUpcomingEvents(limit);
    res.json(events);
  }));

  app.get('/api/events/:id', asyncHandler(async (req, res) => {
    const eventId = parseInt(req.params.id);
    const event = await storage.getEvent(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  }));

  app.post('/api/events', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(eventFormSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const event = await storage.createEvent(data);
    res.status(201).json(event);
  }));

  app.put('/api/events/:id', asyncHandler(async (req, res) => {
    const eventId = parseInt(req.params.id);
    const { data, error } = validateRequest(eventFormSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const updatedEvent = await storage.updateEvent(eventId, data);
    
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(updatedEvent);
  }));

  app.delete('/api/events/:id', asyncHandler(async (req, res) => {
    const eventId = parseInt(req.params.id);
    const success = await storage.deleteEvent(eventId);
    
    if (!success) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  }));

  // Attendance routes
  app.get('/api/attendance', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    
    if (courseId && date) {
      const attendanceRecords = await storage.getAttendanceByCourse(courseId, date);
      return res.json(attendanceRecords);
    } else if (courseId) {
      const attendanceRecords = await storage.getAttendanceByCourse(courseId);
      return res.json(attendanceRecords);
    } else if (studentId) {
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      return res.json(attendanceRecords);
    } else {
      return res.status(400).json({ message: 'Please provide courseId, studentId, or both parameters' });
    }
  }));

  app.get('/api/attendance/:id', asyncHandler(async (req, res) => {
    const attendanceId = parseInt(req.params.id);
    const attendance = await storage.getAttendance(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  }));

  app.post('/api/attendance', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(attendanceFormSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    // Check if student exists
    const student = await storage.getStudent(data.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if course exists
    const course = await storage.getCourse(data.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if attendance record already exists for the date
    const existingAttendance = await storage.getAttendanceByStudentAndCourse(
      data.studentId,
      data.courseId,
      data.date
    );
    
    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance record already exists for this student, course, and date' 
      });
    }
    
    const attendance = await storage.createAttendance(data);
    res.status(201).json(attendance);
  }));

  app.put('/api/attendance/:id', asyncHandler(async (req, res) => {
    const attendanceId = parseInt(req.params.id);
    const { data, error } = validateRequest(attendanceFormSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const updatedAttendance = await storage.updateAttendance(attendanceId, data);
    
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(updatedAttendance);
  }));

  app.delete('/api/attendance/:id', asyncHandler(async (req, res) => {
    const attendanceId = parseInt(req.params.id);
    const success = await storage.deleteAttendance(attendanceId);
    
    if (!success) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  }));

  // Grade routes
  app.get('/api/grades', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    
    if (courseId) {
      const grades = await storage.getGradesByCourse(courseId);
      return res.json(grades);
    } else if (studentId) {
      const grades = await storage.getGradesByStudent(studentId);
      return res.json(grades);
    } else {
      return res.status(400).json({ message: 'Please provide courseId or studentId parameter' });
    }
  }));

  app.get('/api/grades/:id', asyncHandler(async (req, res) => {
    const gradeId = parseInt(req.params.id);
    const grade = await storage.getGrade(gradeId);
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(grade);
  }));

  app.post('/api/grades', asyncHandler(async (req, res) => {
    const { data, error } = validateRequest(gradeFormSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    // Check if student exists
    const student = await storage.getStudent(data.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if course exists
    const course = await storage.getCourse(data.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const grade = await storage.createGrade(data);
    res.status(201).json(grade);
  }));

  app.put('/api/grades/:id', asyncHandler(async (req, res) => {
    const gradeId = parseInt(req.params.id);
    const { data, error } = validateRequest(gradeFormSchema.partial(), req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    const updatedGrade = await storage.updateGrade(gradeId, data);
    
    if (!updatedGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(updatedGrade);
  }));

  app.delete('/api/grades/:id', asyncHandler(async (req, res) => {
    const gradeId = parseInt(req.params.id);
    const success = await storage.deleteGrade(gradeId);
    
    if (!success) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json({ message: 'Grade deleted successfully' });
  }));

  // Dashboard statistics
  app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
    const students = await storage.getStudents();
    const courses = await storage.getCourses();
    const programs = await storage.getPrograms();
    
    // Calculate attendance rate
    const allAttendance = await Promise.all(
      Array.from(courses.map(course => storage.getAttendanceByCourse(course.id)))
    ).then(results => results.flat());
    
    const totalSessions = allAttendance.length;
    const presentSessions = allAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalSessions > 0 
      ? ((presentSessions / totalSessions) * 100).toFixed(1) 
      : "100.0";
    
    res.json({
      totalStudents: students.length,
      activeCourses: courses.length,
      totalPrograms: programs.length,
      attendanceRate: attendanceRate
    });
  }));

  const httpServer = createServer(app);
  return httpServer;
}
