import { 
  users, type User, type InsertUser,
  programs, type Program, type InsertProgram,
  students, type Student, type InsertStudent,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  events, type Event, type InsertEvent,
  attendance, type Attendance, type InsertAttendance,
  grades, type Grade, type InsertGrade,
  type StudentWithUser, type CourseWithDetails, type EnrollmentWithDetails,
  type AttendanceWithDetails, type GradeWithDetails
} from "@shared/schema";

// Storage interface definition
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Program operations
  getProgram(id: number): Promise<Program | undefined>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  getPrograms(): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getStudents(): Promise<StudentWithUser[]>;
  createStudent(student: InsertStudent, user: InsertUser): Promise<StudentWithUser>;
  updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCourses(): Promise<CourseWithDetails[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollments(): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsByStudent(studentId: number): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsByCourse(courseId: number): Promise<EnrollmentWithDetails[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByStudentAndCourse(studentId: number, courseId: number, date: Date): Promise<Attendance | undefined>;
  getAttendanceByCourse(courseId: number, date?: Date): Promise<AttendanceWithDetails[]>;
  getAttendanceByStudent(studentId: number): Promise<AttendanceWithDetails[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;
  
  // Grade operations
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByStudent(studentId: number): Promise<GradeWithDetails[]>;
  getGradesByCourse(courseId: number): Promise<GradeWithDetails[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, data: Partial<InsertGrade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private programs: Map<number, Program>;
  private students: Map<number, Student>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private events: Map<number, Event>;
  private attendance: Map<number, Attendance>;
  private grades: Map<number, Grade>;
  private userCounter: number;
  private programCounter: number;
  private studentCounter: number;
  private courseCounter: number;
  private enrollmentCounter: number;
  private eventCounter: number;
  private attendanceCounter: number;
  private gradeCounter: number;

  constructor() {
    this.users = new Map();
    this.programs = new Map();
    this.students = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.events = new Map();
    this.attendance = new Map();
    this.grades = new Map();
    
    // Initialize counters for IDs
    this.userCounter = 1;
    this.programCounter = 1;
    this.studentCounter = 1;
    this.courseCounter = 1;
    this.enrollmentCounter = 1;
    this.eventCounter = 1;
    this.attendanceCounter = 1;
    this.gradeCounter = 1;
    
    // Seed initial data for demo
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Program operations
  async getProgram(id: number): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    return Array.from(this.programs.values()).find(program => program.code === code);
  }

  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const id = this.programCounter++;
    const newProgram: Program = { ...program, id };
    this.programs.set(id, newProgram);
    return newProgram;
  }

  async updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined> {
    const program = await this.getProgram(id);
    if (!program) return undefined;
    
    const updatedProgram: Program = { ...program, ...data };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.studentId === studentId);
  }

  async getStudents(): Promise<StudentWithUser[]> {
    return Promise.all(
      Array.from(this.students.values()).map(async (student) => {
        const user = await this.getUser(student.userId);
        const program = await this.getProgram(student.programId);
        return {
          ...student,
          user: user!,
          program: program!
        };
      })
    );
  }

  async createStudent(student: InsertStudent, user: InsertUser): Promise<StudentWithUser> {
    // Create user first
    const newUser = await this.createUser(user);
    
    // Create student with user ID
    const id = this.studentCounter++;
    const newStudent: Student = { ...student, id, userId: newUser.id };
    this.students.set(id, newStudent);
    
    // Get program for the response
    const program = await this.getProgram(student.programId);
    
    return {
      ...newStudent,
      user: newUser,
      program: program!
    };
  }

  async updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;
    
    const updatedStudent: Student = { ...student, ...data };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const student = await this.getStudent(id);
    if (!student) return false;
    
    // Delete the user as well
    this.users.delete(student.userId);
    return this.students.delete(id);
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(course => course.code === code);
  }

  async getCourses(): Promise<CourseWithDetails[]> {
    return Promise.all(
      Array.from(this.courses.values()).map(async (course) => {
        const program = course.programId ? await this.getProgram(course.programId) : undefined;
        const instructor = course.instructorId ? await this.getUser(course.instructorId) : undefined;
        return {
          ...course,
          program: program!,
          instructor: instructor!
        };
      })
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseCounter++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    
    const updatedCourse: Course = { ...course, ...data };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollments(): Promise<EnrollmentWithDetails[]> {
    return Promise.all(
      Array.from(this.enrollments.values()).map(async (enrollment) => {
        const student = await this.getStudent(enrollment.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(enrollment.courseId);
        const instructor = course?.instructorId ? await this.getUser(course.instructorId) : undefined;
        
        return {
          ...enrollment,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: {
            ...course!,
            program: program!,
            instructor: instructor!
          }
        };
      })
    );
  }

  async getEnrollmentsByStudent(studentId: number): Promise<EnrollmentWithDetails[]> {
    const enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.studentId === studentId);
    
    return Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await this.getStudent(enrollment.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(enrollment.courseId);
        const instructor = course?.instructorId ? await this.getUser(course.instructorId) : undefined;
        
        return {
          ...enrollment,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: {
            ...course!,
            program: program!,
            instructor: instructor!
          }
        };
      })
    );
  }

  async getEnrollmentsByCourse(courseId: number): Promise<EnrollmentWithDetails[]> {
    const enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.courseId === courseId);
    
    return Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await this.getStudent(enrollment.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(enrollment.courseId);
        const instructor = course?.instructorId ? await this.getUser(course.instructorId) : undefined;
        
        return {
          ...enrollment,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: {
            ...course!,
            program: program!,
            instructor: instructor!
          }
        };
      })
    );
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentCounter++;
    const now = new Date();
    const newEnrollment: Enrollment = { 
      ...enrollment, 
      id, 
      enrollmentDate: now
    };
    this.enrollments.set(id, newEnrollment);
    
    // Update course enrollment count
    const course = await this.getCourse(enrollment.courseId);
    if (course) {
      await this.updateCourse(course.id, { enrolled: course.enrolled + 1 });
    }
    
    return newEnrollment;
  }

  async updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment: Enrollment = { ...enrollment, ...data };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const enrollment = await this.getEnrollment(id);
    if (!enrollment) return false;
    
    // Update course enrollment count
    const course = await this.getCourse(enrollment.courseId);
    if (course && course.enrolled > 0) {
      await this.updateCourse(course.id, { enrolled: course.enrolled - 1 });
    }
    
    return this.enrollments.delete(id);
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    const today = new Date();
    
    return Array.from(this.events.values())
      .filter(event => new Date(event.startDate) >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventCounter++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { ...event, ...data };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number, date: Date): Promise<Attendance | undefined> {
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    return Array.from(this.attendance.values()).find(attendance => 
      attendance.studentId === studentId && 
      attendance.courseId === courseId &&
      attendance.date.toString() === dateStr
    );
  }

  async getAttendanceByCourse(courseId: number, date?: Date): Promise<AttendanceWithDetails[]> {
    let attendanceRecords = Array.from(this.attendance.values())
      .filter(attendance => attendance.courseId === courseId);
    
    if (date) {
      const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      attendanceRecords = attendanceRecords.filter(attendance => 
        attendance.date.toString() === dateStr
      );
    }
    
    return Promise.all(
      attendanceRecords.map(async (attendance) => {
        const student = await this.getStudent(attendance.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(attendance.courseId);
        
        return {
          ...attendance,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: course!
        };
      })
    );
  }

  async getAttendanceByStudent(studentId: number): Promise<AttendanceWithDetails[]> {
    const attendanceRecords = Array.from(this.attendance.values())
      .filter(attendance => attendance.studentId === studentId);
    
    return Promise.all(
      attendanceRecords.map(async (attendance) => {
        const student = await this.getStudent(attendance.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(attendance.courseId);
        
        return {
          ...attendance,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: course!
        };
      })
    );
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceCounter++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = await this.getAttendance(id);
    if (!attendance) return undefined;
    
    const updatedAttendance: Attendance = { ...attendance, ...data };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendance.delete(id);
  }

  // Grade operations
  async getGrade(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async getGradesByStudent(studentId: number): Promise<GradeWithDetails[]> {
    const studentGrades = Array.from(this.grades.values())
      .filter(grade => grade.studentId === studentId);
    
    return Promise.all(
      studentGrades.map(async (grade) => {
        const student = await this.getStudent(grade.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(grade.courseId);
        
        return {
          ...grade,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: course!
        };
      })
    );
  }

  async getGradesByCourse(courseId: number): Promise<GradeWithDetails[]> {
    const courseGrades = Array.from(this.grades.values())
      .filter(grade => grade.courseId === courseId);
    
    return Promise.all(
      courseGrades.map(async (grade) => {
        const student = await this.getStudent(grade.studentId);
        const user = student ? await this.getUser(student.userId) : undefined;
        const program = student?.programId ? await this.getProgram(student.programId) : undefined;
        const course = await this.getCourse(grade.courseId);
        
        return {
          ...grade,
          student: {
            ...student!,
            user: user!,
            program: program!
          },
          course: course!
        };
      })
    );
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const id = this.gradeCounter++;
    const newGrade: Grade = { ...grade, id };
    this.grades.set(id, newGrade);
    return newGrade;
  }

  async updateGrade(id: number, data: Partial<InsertGrade>): Promise<Grade | undefined> {
    const grade = await this.getGrade(id);
    if (!grade) return undefined;
    
    const updatedGrade: Grade = { ...grade, ...data };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    return this.grades.delete(id);
  }

  // Helper method to seed initial data
  private async seedData() {
    // Create admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      firstName: "Admin",
      lastName: "User",
      email: "admin@edumanage.com",
      role: "admin",
      profileImage: ""
    });

    // Create some instructors
    const instructor1 = await this.createUser({
      username: "jsmith",
      password: "password123",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@edumanage.com",
      role: "instructor",
      profileImage: ""
    });

    const instructor2 = await this.createUser({
      username: "edavis",
      password: "password123",
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@edumanage.com",
      role: "instructor",
      profileImage: ""
    });

    // Create programs
    const computerScience = await this.createProgram({
      name: "Computer Science",
      code: "CS",
      description: "Study of computers and computational systems",
      duration: 4,
      departmentId: 1
    });

    const business = await this.createProgram({
      name: "Business Administration",
      code: "BUS",
      description: "Study of business management principles and practices",
      duration: 4,
      departmentId: 2
    });

    const engineering = await this.createProgram({
      name: "Engineering",
      code: "ENG",
      description: "Application of scientific knowledge to design and build systems",
      duration: 4,
      departmentId: 3
    });

    // Create courses
    const course1 = await this.createCourse({
      name: "Introduction to Computer Science",
      code: "CS101",
      description: "Fundamentals of computer programming, algorithms, and problem-solving techniques.",
      credits: 3,
      programId: computerScience.id,
      instructorId: instructor1.id,
      capacity: 50,
      enrolled: 0
    });

    const course2 = await this.createCourse({
      name: "Business Ethics",
      code: "BUS205",
      description: "Ethical principles and moral issues in business decision-making and corporate social responsibility.",
      credits: 4,
      programId: business.id,
      instructorId: instructor2.id,
      capacity: 40,
      enrolled: 0
    });

    const course3 = await this.createCourse({
      name: "Data Structures & Algorithms",
      code: "CS201",
      description: "Advanced data organization and algorithmic approaches to complex problem-solving.",
      credits: 4,
      programId: computerScience.id,
      instructorId: instructor1.id,
      capacity: 35,
      enrolled: 0
    });

    const course4 = await this.createCourse({
      name: "Structural Engineering",
      code: "ENG302",
      description: "Analysis and design of structures under various load conditions, with focus on building safety.",
      credits: 4,
      programId: engineering.id,
      instructorId: instructor2.id,
      capacity: 30,
      enrolled: 0
    });

    // Create students with users
    const student1 = await this.createStudent(
      {
        studentId: "STU000123",
        programId: computerScience.id,
        enrollmentYear: 2022,
        currentYear: 2,
        status: "active",
        userId: 0, // Will be set in the method
        dateOfBirth: new Date("2000-05-15"),
        gender: "female",
        address: "123 Campus Avenue",
        phone: "123-456-7890"
      },
      {
        username: "emwilson",
        password: "password123",
        firstName: "Emma",
        lastName: "Wilson",
        email: "emma.w@example.com",
        role: "student",
        profileImage: ""
      }
    );

    const student2 = await this.createStudent(
      {
        studentId: "STU000124",
        programId: business.id,
        enrollmentYear: 2021,
        currentYear: 3,
        status: "active",
        userId: 0, // Will be set in the method
        dateOfBirth: new Date("1999-08-23"),
        gender: "male",
        address: "456 University Drive",
        phone: "234-567-8901"
      },
      {
        username: "jrodriguez",
        password: "password123",
        firstName: "James",
        lastName: "Rodriguez",
        email: "james.r@example.com",
        role: "student",
        profileImage: ""
      }
    );

    const student3 = await this.createStudent(
      {
        studentId: "STU000125",
        programId: engineering.id,
        enrollmentYear: 2023,
        currentYear: 1,
        status: "active",
        userId: 0, // Will be set in the method
        dateOfBirth: new Date("2001-02-10"),
        gender: "female",
        address: "789 College Street",
        phone: "345-678-9012"
      },
      {
        username: "sjohnson",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@example.com",
        role: "student",
        profileImage: ""
      }
    );

    const student4 = await this.createStudent(
      {
        studentId: "STU000126",
        programId: computerScience.id,
        enrollmentYear: 2022,
        currentYear: 2,
        status: "active",
        userId: 0, // Will be set in the method
        dateOfBirth: new Date("2000-11-05"),
        gender: "male",
        address: "101 Academic Road",
        phone: "456-789-0123"
      },
      {
        username: "mbrown",
        password: "password123",
        firstName: "Michael",
        lastName: "Brown",
        email: "michael.b@example.com",
        role: "student",
        profileImage: ""
      }
    );

    // Create enrollments
    await this.createEnrollment({
      studentId: student1.id,
      courseId: course1.id,
      status: "active",
    });

    await this.createEnrollment({
      studentId: student1.id,
      courseId: course3.id,
      status: "active",
    });

    await this.createEnrollment({
      studentId: student2.id,
      courseId: course2.id,
      status: "active",
    });

    await this.createEnrollment({
      studentId: student3.id,
      courseId: course4.id,
      status: "active",
    });

    await this.createEnrollment({
      studentId: student4.id,
      courseId: course1.id,
      status: "active",
    });

    await this.createEnrollment({
      studentId: student4.id,
      courseId: course3.id,
      status: "active",
    });

    // Create events
    await this.createEvent({
      title: "Mid-term Examinations",
      description: "Mid-term examinations for all departments",
      startDate: new Date("2023-10-15"),
      endDate: new Date("2023-10-20"),
      startTime: { hours: 9, minutes: 0 },
      endTime: { hours: 16, minutes: 0 },
      location: "All campus buildings",
      eventType: "academic",
    });

    await this.createEvent({
      title: "Science Exhibition",
      description: "Annual science and innovation exhibition",
      startDate: new Date("2023-10-22"),
      endDate: new Date("2023-10-22"),
      startTime: { hours: 10, minutes: 0 },
      endTime: { hours: 15, minutes: 0 },
      location: "Science Building",
      eventType: "exhibition",
    });

    await this.createEvent({
      title: "Faculty Meeting",
      description: "All faculty members must attend",
      startDate: new Date("2023-10-30"),
      endDate: new Date("2023-10-30"),
      startTime: { hours: 14, minutes: 0 },
      endTime: { hours: 16, minutes: 0 },
      location: "Conference Room B",
      eventType: "meeting",
    });

    await this.createEvent({
      title: "Alumni Meet",
      description: "Annual alumni gathering and networking event",
      startDate: new Date("2023-11-05"),
      endDate: new Date("2023-11-05"),
      startTime: { hours: 11, minutes: 0 },
      endTime: { hours: 14, minutes: 0 },
      location: "Main Auditorium",
      eventType: "social",
    });

    // Create attendance records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Attendance for course1 today
    await this.createAttendance({
      studentId: student1.id,
      courseId: course1.id,
      date: today,
      status: "present",
      remarks: "",
    });

    await this.createAttendance({
      studentId: student4.id,
      courseId: course1.id,
      date: today,
      status: "present",
      remarks: "",
    });

    // Attendance for course1 yesterday
    await this.createAttendance({
      studentId: student1.id,
      courseId: course1.id,
      date: yesterday,
      status: "present",
      remarks: "",
    });

    await this.createAttendance({
      studentId: student4.id,
      courseId: course1.id,
      date: yesterday,
      status: "absent",
      remarks: "No excuse provided",
    });

    // Create grades
    await this.createGrade({
      studentId: student1.id,
      courseId: course1.id,
      assessmentType: "midterm",
      score: 85,
      maxScore: 100,
      date: new Date("2023-10-05"),
      remarks: "Good understanding of fundamentals",
    });

    await this.createGrade({
      studentId: student1.id,
      courseId: course3.id,
      assessmentType: "assignment",
      score: 92,
      maxScore: 100,
      date: new Date("2023-09-28"),
      remarks: "Excellent work on algorithm implementation",
    });

    await this.createGrade({
      studentId: student2.id,
      courseId: course2.id,
      assessmentType: "midterm",
      score: 78,
      maxScore: 100,
      date: new Date("2023-10-06"),
      remarks: "Needs to improve on case analysis",
    });

    await this.createGrade({
      studentId: student4.id,
      courseId: course1.id,
      assessmentType: "midterm",
      score: 90,
      maxScore: 100,
      date: new Date("2023-10-05"),
      remarks: "Excellent work",
    });
  }
}

export const storage = new MemStorage();
