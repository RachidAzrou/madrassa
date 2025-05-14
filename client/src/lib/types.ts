export interface StudentDetail {
  id: number;
  userId: number;
  studentId: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  enrollmentDate: string;
  status: string;
  programId: number | null;
  year: number;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    avatar: string | null;
  };
  program?: {
    id: number;
    name: string;
    code: string;
    description: string | null;
    duration: number;
    departmentId: number | null;
  };
}

export interface CourseDetail {
  id: number;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  departmentId: number | null;
  instructorId: number | null;
  capacity: number;
  instructor?: {
    id: number;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    avatar: string | null;
  };
  department?: {
    id: number;
    name: string;
    code: string;
    description: string | null;
  };
}

export interface Program {
  id: number;
  name: string;
  code: string;
  description: string | null;
  duration: number;
  departmentId: number | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  enrollmentDate: string;
  status: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: string;
  remark: string | null;
}

export interface GradeRecord {
  id: number;
  studentId: number;
  courseId: number;
  assessmentType: string;
  score: number;
  outOf: number;
  date: string;
  remark: string | null;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  departmentId: number | null;
  createdBy: number;
}

export interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  programs: number;
  attendanceRate: number;
}

export interface FormattedEvent {
  id: number;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  location: string | null;
  departmentId: number | null;
  createdBy: number;
}
