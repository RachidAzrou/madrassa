import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: string;
  notes: string;
}

interface AttendanceTableProps {
  courseId?: number;
  date: Date;
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AttendanceTable({ 
  courseId, 
  date, 
  attendanceRecords, 
  isLoading,
  onRefresh
}: AttendanceTableProps) {
  const { toast } = useToast();
  const [localData, setLocalData] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch students to display in the table
  const { data: students = [] } = useMutation({
    mutationKey: ["students-enrollment", courseId],
    mutationFn: async () => {
      if (!courseId) return [];
      
      try {
        // Get all enrollments for this course
        const enrollmentsRes = await fetch(`/api/enrollments?courseId=${courseId}`);
        const enrollments = await enrollmentsRes.json();
        
        // Get student details for each enrollment
        const studentPromises = enrollments.map((enrollment: any) => 
          fetch(`/api/students/${enrollment.studentId}`).then(res => res.json())
        );
        
        return await Promise.all(studentPromises);
      } catch (error) {
        console.error("Error fetching students:", error);
        return [];
      }
    }
  });

  // Update attendance status
  const updateAttendance = async (studentId: number, status: string) => {
    if (!courseId) return;
    
    try {
      setSaving(true);

      // Get the date in YYYY-MM-DD format
      const formattedDate = date.toISOString().split('T')[0];
      
      // Check if there's an existing attendance record
      const existingRecord = attendanceRecords.find(record => 
        record.studentId === studentId && 
        record.courseId === courseId &&
        new Date(record.date).toISOString().split('T')[0] === formattedDate
      );
      
      if (existingRecord) {
        // Update existing record
        await apiRequest("PUT", `/api/attendance/${existingRecord.id}`, {
          ...existingRecord,
          status
        });
      } else {
        // Create new record
        await apiRequest("POST", "/api/attendance", {
          studentId,
          courseId,
          date: formattedDate,
          status,
          notes: ""
        });
      }
      
      // Update local state
      setLocalData(prev => new Map(prev).set(studentId, status));
      
      // Refresh attendance data
      onRefresh();
      
    } catch (error) {
      toast({
        title: "Failed to update attendance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get attendance status for a student
  const getAttendanceStatus = (studentId: number): string => {
    // First check localData for any updated values
    if (localData.has(studentId)) {
      return localData.get(studentId) as string;
    }
    
    // Then check the attendance records
    const formattedDate = date.toISOString().split('T')[0];
    
    const record = attendanceRecords.find(record => 
      record.studentId === studentId && 
      record.courseId === courseId &&
      new Date(record.date).toISOString().split('T')[0] === formattedDate
    );
    
    return record ? record.status : "";
  };

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!attendanceRecords.length) return { present: 0, absent: 0, late: 0, excused: 0 };
    
    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    
    // Combine records with local data for accurate stats
    students.forEach((student: Student) => {
      const status = getAttendanceStatus(student.id);
      if (status && stats[status as keyof typeof stats] !== undefined) {
        stats[status as keyof typeof stats]++;
      }
    });
    
    return stats;
  };

  const stats = calculateStats();

  // Save all attendance records
  const saveAllAttendance = async () => {
    try {
      setSaving(true);
      
      // Create an array of promises for all the updates
      const updatePromises = Array.from(localData.entries()).map(([studentId, status]) => 
        updateAttendance(studentId, status)
      );
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast({
        title: "Attendance saved successfully",
      });
      
      // Clear local changes
      setLocalData(new Map());
      
      // Refresh data
      onRefresh();
      
    } catch (error) {
      toast({
        title: "Failed to save attendance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!courseId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Please select a course to view attendance</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Student</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attendance Rate</TableHead>
              <TableHead>Last Class</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  <p className="mt-2 text-sm text-gray-500">Loading attendance data...</p>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No students enrolled in this course</p>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: Student) => {
                const attendanceStatus = getAttendanceStatus(student.id);
                
                // Mock attendance rate for demo purposes
                // In a real app, you would calculate this from actual attendance records
                const attendanceRate = Math.floor(Math.random() * 20) + 80; // Random between 80-99%
                
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                          <span>{student.firstName[0]}{student.lastName[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Select 
                        value={attendanceStatus} 
                        onValueChange={(value) => updateAttendance(student.id, value)}
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
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`bg-green-500 h-2.5 rounded-full`} 
                            style={{ width: `${attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{attendanceRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {/* In a real app, show actual last attendance status */}
                      {attendanceStatus === "present" ? "Present" : 
                       attendanceStatus === "absent" ? "Absent" : 
                       attendanceStatus === "late" ? "Late" : 
                       attendanceStatus === "excused" ? "Excused" : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-primary">
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Session Summary */}
      {students.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center md:justify-between space-y-4 md:space-y-0 p-4 border-t border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Session Summary</h4>
            <div className="flex space-x-4">
              <div className="text-center">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Present: {stats.present}
                </span>
              </div>
              <div className="text-center">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Absent: {stats.absent}
                </span>
              </div>
              <div className="text-center">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Late: {stats.late}
                </span>
              </div>
              <div className="text-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Excused: {stats.excused}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={saveAllAttendance}
            disabled={saving || localData.size === 0}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
