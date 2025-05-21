import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  attendanceRate?: number;
  lastStatus?: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

interface AttendanceTableProps {
  students: Student[];
  onStatusChange: (studentId: number, status: string) => void;
  onSave: () => void;
  loading?: boolean;
  date: Date;
  courseId: number;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  onStatusChange,
  onSave,
  loading = false,
  date,
  courseId,
}) => {
  const [markAll, setMarkAll] = useState<string | null>(null);

  const handleMarkAll = (status: string) => {
    setMarkAll(status);
    students.forEach(student => {
      onStatusChange(student.id, status);
    });
  };

  const getProgressColor = (rate?: number) => {
    if (!rate) return "bg-gray-300";
    if (rate >= 90) return "bg-green-500";
    if (rate >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Attendance for: {date.toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleMarkAll("present")}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Mark All Present
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => handleMarkAll("absent")}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Mark All Absent
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attendance Rate</TableHead>
              <TableHead>Last Status</TableHead>
              <TableHead className="text-right">View History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No students found for this course.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 rounded-full">
                        <AvatarFallback className="bg-muted">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{`${student.firstName} ${student.lastName}`}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue="present"
                      onValueChange={(value) => onStatusChange(student.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={student.attendanceRate || 0} 
                        className="h-2 w-16"
                        indicatorClassName={getProgressColor(student.attendanceRate)}
                      />
                      <span className="text-sm">{student.attendanceRate || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {student.lastStatus === "present" && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Present</span>
                        </div>
                      )}
                      {student.lastStatus === "absent" && (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span>Absent</span>
                        </div>
                      )}
                      {student.lastStatus === "late" && (
                        <div className="flex items-center text-amber-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Late</span>
                        </div>
                      )}
                      {student.lastStatus === "excused" && (
                        <div className="flex items-center text-blue-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>Excused</span>
                        </div>
                      )}
                      {!student.lastStatus && (
                        <span className="text-muted-foreground">No record</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-primary-dark"
                    >
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Present: {students.filter(s => s.lastStatus === "present").length}
            </span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
              Absent: {students.filter(s => s.lastStatus === "absent").length}
            </span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Late: {students.filter(s => s.lastStatus === "late").length}
            </span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              Excused: {students.filter(s => s.lastStatus === "excused").length}
            </span>
          </div>
        </div>
        <Button onClick={onSave} disabled={loading}>
          {loading ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
};

export default AttendanceTable;
