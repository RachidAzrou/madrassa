import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, subDays } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AttendanceTable, { Student } from "@/components/attendance/AttendanceTable";
import { AlertCircle, ArrowLeft, ArrowRight, Download, FileText } from "lucide-react";

const Attendance = () => {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});

  // Fetch courses data
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch students data for selected course
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  // Fetch attendance records for selected course and date
  const {
    data: attendanceRecords = [],
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: [
      "/api/attendance/course/date",
      { courseId: selectedCourse, date: format(selectedDate, "yyyy-MM-dd") },
    ],
    enabled: !!selectedCourse,
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      // In a real app, we'd fetch attendance records for the selected course and date
      // This is a placeholder implementation
      return [];
    },
  });

  // Create attendance records mutation
  const saveAttendance = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/attendance/course/date"] 
      });
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save attendance: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    // Reset attendance data when course changes
    setAttendanceData({});
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    // Prepare the data for submission
    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      courseId: parseInt(selectedCourse),
      date: format(selectedDate, "yyyy-MM-dd"),
      status,
      remarks: "",
    }));

    if (records.length === 0) {
      toast({
        title: "Warning",
        description: "No attendance data to save",
        variant: "destructive",
      });
      return;
    }

    // For simplicity, we'll save each record separately
    // In a real app, you might want to batch these
    records.forEach(record => {
      saveAttendance.mutate(record);
    });
  };

  // Calculate attendance statistics
  const calculateStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(status => status === "present").length;
    const absent = Object.values(attendanceData).filter(status => status === "absent").length;
    const late = Object.values(attendanceData).filter(status => status === "late").length;
    const excused = Object.values(attendanceData).filter(status => status === "excused").length;
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
      absentPercentage: total > 0 ? (absent / total) * 100 : 0,
      latePercentage: total > 0 ? (late / total) * 100 : 0,
      excusedPercentage: total > 0 ? (excused / total) * 100 : 0,
    };
  };

  const stats = calculateStats();

  // Prepare student data for the attendance table
  const studentsWithAttendance: Student[] = students.map((student: any) => {
    const attendanceRate = Math.floor(Math.random() * 30) + 70; // Random 70-100% for demo
    return {
      ...student,
      attendanceRate,
      lastStatus: attendanceData[student.id] || "present", // Default to present
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Tracking"
        description="Record and monitor student attendance"
        action={{
          label: "Export Report",
          onClick: () => alert("Export functionality would go here"),
          icon: <Download className="h-4 w-4 mr-2" />,
        }}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select
            value={selectedCourse}
            onValueChange={handleCourseChange}
            disabled={loadingCourses}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!selectedCourse ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">Please select a course to view and record attendance.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.present} / {stats.total}</div>
                <Progress 
                  value={stats.presentPercentage} 
                  className="h-2 mt-2"
                  indicatorClassName="bg-green-500"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.absent} / {stats.total}</div>
                <Progress 
                  value={stats.absentPercentage} 
                  className="h-2 mt-2"
                  indicatorClassName="bg-red-500"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.late} / {stats.total}</div>
                <Progress 
                  value={stats.latePercentage} 
                  className="h-2 mt-2"
                  indicatorClassName="bg-yellow-500"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Excused</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.excused} / {stats.total}</div>
                <Progress 
                  value={stats.excusedPercentage} 
                  className="h-2 mt-2"
                  indicatorClassName="bg-blue-500"
                />
              </CardContent>
            </Card>
          </div>
          
          <AttendanceTable
            students={studentsWithAttendance}
            onStatusChange={handleStatusChange}
            onSave={handleSaveAttendance}
            loading={loadingStudents || loadingAttendance || saveAttendance.isPending}
            date={selectedDate}
            courseId={parseInt(selectedCourse)}
          />
          
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Attendance Overview</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Overall Attendance Rate</h4>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-3" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Computer Science</p>
                      <span className="text-sm">92%</span>
                    </div>
                    <Progress value={92} className="h-2" indicatorClassName="bg-green-500" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Business Management</p>
                      <span className="text-sm">78%</span>
                    </div>
                    <Progress value={78} className="h-2" indicatorClassName="bg-yellow-500" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Engineering</p>
                      <span className="text-sm">85%</span>
                    </div>
                    <Progress value={85} className="h-2" indicatorClassName="bg-green-500" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Medicine</p>
                      <span className="text-sm">95%</span>
                    </div>
                    <Progress value={95} className="h-2" indicatorClassName="bg-green-500" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Psychology</p>
                      <span className="text-sm">75%</span>
                    </div>
                    <Progress value={75} className="h-2" indicatorClassName="bg-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
