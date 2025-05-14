import { 
  students, type Student, type InsertStudent,
  programs, type Program, type InsertProgram,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  attendance, type Attendance, type InsertAttendance,
  grades, type Grade, type InsertGrade,
  events, type Event, type InsertEvent,
  users, type User, type InsertUser 
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Program operations
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<Program>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCoursesByProgram(programId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Enrollment operations
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;

  // Attendance operations
  getAttendanceRecords(): Promise<Attendance[]>;
  getAttendanceRecord(id: number): Promise<Attendance | undefined>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByCourse(courseId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Grade operations
  getGrades(): Promise<Grade[]>;
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByCourse(courseId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private students: Map<number, Student>;
  private programs: Map<number, Program>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private attendanceRecords: Map<number, Attendance>;
  private grades: Map<number, Grade>;
  private events: Map<number, Event>;
  private users: Map<number, User>;
  
  private studentIdCounter: number;
  private programIdCounter: number;
  private courseIdCounter: number;
  private enrollmentIdCounter: number;
  private attendanceIdCounter: number;
  private gradeIdCounter: number;
  private eventIdCounter: number;
  private userIdCounter: number;

  constructor() {
    this.students = new Map();
    this.programs = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.attendanceRecords = new Map();
    this.grades = new Map();
    this.events = new Map();
    this.users = new Map();
    
    this.studentIdCounter = 1;
    this.programIdCounter = 1;
    this.courseIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.gradeIdCounter = 1;
    this.eventIdCounter = 1;
    this.userIdCounter = 1;

    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Add a default admin user
    this.createUser({
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@edumanage.com',
      role: 'admin',
      isActive: true
    });

    // Add some programs
    this.createProgram({
      name: 'Informatica',
      code: 'CS',
      description: 'Bachelor of Science in Informatica',
      duration: 4,
      department: 'Techniek',
      isActive: true
    });
    
    this.createProgram({
      name: 'Bedrijfskunde',
      code: 'BUS',
      description: 'Bachelor Bedrijfskunde',
      duration: 4,
      department: 'Economie',
      isActive: true
    });
    
    this.createProgram({
      name: 'Techniek',
      code: 'ENG',
      description: 'Bachelor Techniek',
      duration: 4,
      department: 'Techniek',
      isActive: true
    });

    // Add some courses
    this.createCourse({
      name: 'Inleiding tot Informatica',
      code: 'CS101',
      description: 'Fundamenten van computerprogrammering, algoritmen en probleemoplossende technieken.',
      credits: 3,
      programId: 1, // Informatica
      instructor: 'Dr. Jan Smit',
      maxStudents: 50,
      isActive: true
    });
    
    this.createCourse({
      name: 'Bedrijfsethiek',
      code: 'BUS205',
      description: 'Ethische principes en morele kwesties bij zakelijke besluitvorming en maatschappelijk verantwoord ondernemen.',
      credits: 4,
      programId: 2, // Bedrijfskunde
      instructor: 'Dr. Emma de Vries',
      maxStudents: 35,
      isActive: true
    });
    
    this.createCourse({
      name: 'Constructieleer',
      code: 'ENG302',
      description: 'Analyse en ontwerp van constructies onder verschillende belastingcondities, met focus op gebouwveiligheid.',
      credits: 4,
      programId: 3, // Techniek
      instructor: 'Prof. Michael van Leeuwen',
      maxStudents: 30,
      isActive: true
    });

    // Add some students
    this.createStudent({
      studentId: 'STU000123',
      firstName: 'Emma',
      lastName: 'Willems',
      email: 'emma.w@example.com',
      phone: '123-456-7890',
      dateOfBirth: '1998-05-12',
      address: 'Campuslaan 123, Universiteitsstad',
      programId: 1, // Informatica
      yearLevel: 2,
      status: 'active',
      enrollmentDate: '2021-09-01'
    });
    
    this.createStudent({
      studentId: 'STU000124',
      firstName: 'Jaap',
      lastName: 'Rodenburg',
      email: 'jaap.r@example.com',
      phone: '123-456-7891',
      dateOfBirth: '1997-08-24',
      address: 'Collegelaan 456, Universiteitsstad',
      programId: 2, // Bedrijfskunde
      yearLevel: 3,
      status: 'active',
      enrollmentDate: '2020-09-01'
    });
    
    this.createStudent({
      studentId: 'STU000125',
      firstName: 'Sara',
      lastName: 'Jansen',
      email: 'sara.j@example.com',
      phone: '123-456-7892',
      dateOfBirth: '2000-02-10',
      address: 'Universiteitslaan 789, Universiteitsstad',
      programId: 3, // Techniek
      yearLevel: 1,
      status: 'pending',
      enrollmentDate: '2022-09-01'
    });

    // Add some enrollments
    this.createEnrollment({
      studentId: 1, // Emma Wilson
      courseId: 1, // Introduction to Computer Science
      enrollmentDate: new Date('2022-09-01'),
      status: 'active'
    });
    
    this.createEnrollment({
      studentId: 2, // James Rodriguez
      courseId: 2, // Business Ethics
      enrollmentDate: new Date('2022-09-01'),
      status: 'active'
    });
    
    this.createEnrollment({
      studentId: 3, // Sarah Johnson
      courseId: 3, // Structural Engineering
      enrollmentDate: new Date('2022-09-01'),
      status: 'active'
    });

    // Add some events
    this.createEvent({
      title: 'Mid-term Examinations',
      description: 'Mid-term exams for Fall semester',
      startDate: new Date('2023-10-15T09:00:00'),
      endDate: new Date('2023-10-15T16:00:00'),
      location: 'All departments',
      type: 'exam',
      isAllDay: true
    });
    
    this.createEvent({
      title: 'Science Exhibition',
      description: 'Annual science exhibition showcasing student projects',
      startDate: new Date('2023-10-22T10:00:00'),
      endDate: new Date('2023-10-22T15:00:00'),
      location: 'Science Department',
      type: 'academic',
      isAllDay: false
    });
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.email === email);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const student: Student = { ...studentData, id };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) return undefined;
    
    const updatedStudent = { ...existingStudent, ...studentData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  // Program methods
  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async getProgram(id: number): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    return Array.from(this.programs.values()).find(program => program.code === code);
  }

  async createProgram(programData: InsertProgram): Promise<Program> {
    const id = this.programIdCounter++;
    const program: Program = { ...programData, id };
    this.programs.set(id, program);
    return program;
  }

  async updateProgram(id: number, programData: Partial<Program>): Promise<Program | undefined> {
    const existingProgram = this.programs.get(id);
    if (!existingProgram) return undefined;
    
    const updatedProgram = { ...existingProgram, ...programData };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(course => course.code === code);
  }

  async getCoursesByProgram(programId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.programId === programId);
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const course: Course = { ...courseData, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse = { ...existingCourse, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Enrollment methods
  async getEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.studentId === studentId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.courseId === courseId);
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const enrollment: Enrollment = { ...enrollmentData, id };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const existingEnrollment = this.enrollments.get(id);
    if (!existingEnrollment) return undefined;
    
    const updatedEnrollment = { ...existingEnrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  // Attendance methods
  async getAttendanceRecords(): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values());
  }

  async getAttendanceRecord(id: number): Promise<Attendance | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.studentId === studentId);
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.courseId === courseId);
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return Array.from(this.attendanceRecords.values()).filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === targetDate;
    });
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const attendance: Attendance = { ...attendanceData, id };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const existingAttendance = this.attendanceRecords.get(id);
    if (!existingAttendance) return undefined;
    
    const updatedAttendance = { ...existingAttendance, ...attendanceData };
    this.attendanceRecords.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendanceRecords.delete(id);
  }

  // Grade methods
  async getGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.studentId === studentId);
  }

  async getGradesByCourse(courseId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.courseId === courseId);
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    const id = this.gradeIdCounter++;
    const grade: Grade = { ...gradeData, id };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: number, gradeData: Partial<Grade>): Promise<Grade | undefined> {
    const existingGrade = this.grades.get(id);
    if (!existingGrade) return undefined;
    
    const updatedGrade = { ...existingGrade, ...gradeData };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    return this.grades.delete(id);
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= startDate && eventStart <= endDate;
    });
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...eventData, id };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
}

export const storage = new MemStorage();
