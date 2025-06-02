// Tijdelijke in-memory storage voor aanwezigheid
interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  teacherId: number;
  date: string;
  status: string;
  notes?: string;
}

interface TeacherAttendanceRecord {
  id: number;
  teacherId: number;
  courseId: number;
  date: string;
  status: string;
  notes?: string;
}

class TempAttendanceStorage {
  private attendanceRecords: AttendanceRecord[] = [];
  private teacherAttendanceRecords: TeacherAttendanceRecord[] = [];
  private nextId = 1;
  private nextTeacherId = 1;

  // Student attendance methods
  getAttendanceByDate(date: string): AttendanceRecord[] {
    return this.attendanceRecords.filter(record => record.date === date);
  }

  getAttendanceByClassAndDate(classId: number, date: string): AttendanceRecord[] {
    return this.attendanceRecords.filter(record => 
      record.courseId === classId && record.date === date
    );
  }

  createAttendance(data: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const newRecord: AttendanceRecord = {
      ...data,
      id: this.nextId++
    };
    
    // Check if record already exists and update instead
    const existingIndex = this.attendanceRecords.findIndex(record =>
      record.studentId === data.studentId && 
      record.courseId === data.courseId && 
      record.date === data.date
    );

    if (existingIndex >= 0) {
      this.attendanceRecords[existingIndex] = { ...this.attendanceRecords[existingIndex], ...newRecord };
      return this.attendanceRecords[existingIndex];
    } else {
      this.attendanceRecords.push(newRecord);
      return newRecord;
    }
  }

  updateAttendance(id: number, data: Partial<AttendanceRecord>): AttendanceRecord | null {
    const index = this.attendanceRecords.findIndex(record => record.id === id);
    if (index >= 0) {
      this.attendanceRecords[index] = { ...this.attendanceRecords[index], ...data };
      return this.attendanceRecords[index];
    }
    return null;
  }

  // Teacher attendance methods
  getTeacherAttendanceByDate(date: string): TeacherAttendanceRecord[] {
    return this.teacherAttendanceRecords.filter(record => record.date === date);
  }

  createTeacherAttendance(data: Omit<TeacherAttendanceRecord, 'id'>): TeacherAttendanceRecord {
    const newRecord: TeacherAttendanceRecord = {
      ...data,
      id: this.nextTeacherId++
    };

    // Check if record already exists and update instead
    const existingIndex = this.teacherAttendanceRecords.findIndex(record =>
      record.teacherId === data.teacherId && 
      record.courseId === data.courseId && 
      record.date === data.date
    );

    if (existingIndex >= 0) {
      this.teacherAttendanceRecords[existingIndex] = { ...this.teacherAttendanceRecords[existingIndex], ...newRecord };
      return this.teacherAttendanceRecords[existingIndex];
    } else {
      this.teacherAttendanceRecords.push(newRecord);
      return newRecord;
    }
  }

  updateTeacherAttendance(id: number, data: Partial<TeacherAttendanceRecord>): TeacherAttendanceRecord | null {
    const index = this.teacherAttendanceRecords.findIndex(record => record.id === id);
    if (index >= 0) {
      this.teacherAttendanceRecords[index] = { ...this.teacherAttendanceRecords[index], ...data };
      return this.teacherAttendanceRecords[index];
    }
    return null;
  }

  // Batch operations
  createBatchAttendance(records: Omit<AttendanceRecord, 'id'>[]): AttendanceRecord[] {
    return records.map(record => this.createAttendance(record));
  }

  createBatchTeacherAttendance(records: Omit<TeacherAttendanceRecord, 'id'>[]): TeacherAttendanceRecord[] {
    return records.map(record => this.createTeacherAttendance(record));
  }
}

export const tempAttendanceStorage = new TempAttendanceStorage();