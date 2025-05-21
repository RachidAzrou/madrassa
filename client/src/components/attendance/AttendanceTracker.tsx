import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { CalendarIcon, FileDown, Filter, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AttendanceWithDetails, insertAttendanceSchema } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function AttendanceTracker() {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({});

  // Fetch courses for dropdown
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch students for selected course
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/courses", selectedCourseId, "enrollments"],
    enabled: !!selectedCourseId,
  });

  // Fetch existing attendance data for selected course and date
  const { data: existingAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["/api/attendance", { courseId: selectedCourseId, date: format(selectedDate, 'yyyy-MM-dd') }],
    enabled: !!selectedCourseId,
  });

  // Set initial attendance status from existing data
  React.useEffect(() => {
    if (existingAttendance) {
      const initialStatus: {[key: string]: string} = {};
      existingAttendance.forEach((attendance: AttendanceWithDetails) => {
        initialStatus[attendance.student.id.toString()] = attendance.status;
      });
      setAttendanceData(initialStatus);
    } else if (enrollments) {
      const initialStatus: {[key: string]: string} = {};
      enrollments.forEach((enrollment: any) => {
        initialStatus[enrollment.student.id.toString()] = "present";
      });
      setAttendanceData(initialStatus);
    }
  }, [existingAttendance, enrollments]);

  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = existingAttendance ? "PUT" : "POST";
      const url = existingAttendance 
        ? `/api/attendance/${existingAttendance.id}` 
        : "/api/attendance";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/attendance", { courseId: selectedCourseId, date: format(selectedDate, 'yyyy-MM-dd') }] 
      });
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    
    // If no attendance to save
    if (!selectedCourseId || !enrollments || enrollments.length === 0) {
      toast({
        title: "Error", 
        description: "Please select a course with enrolled students",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create array of attendance records to save
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        courseId: parseInt(selectedCourseId),
        date: selectedDate,
        status,
        remarks: ""
      }));

      // Validate and save each record
      for (const record of attendanceRecords) {
        const result = insertAttendanceSchema.safeParse(record);
        if (!result.success) {
          throw new Error("Invalid attendance data");
        }
        await saveAttendanceMutation.mutateAsync(record);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance records",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const markAllAs = (status: string) => {
    if (!enrollments) return;
    
    const newAttendance: {[key: string]: string} = {};
    enrollments.forEach((enrollment: any) => {
      newAttendance[enrollment.student.id.toString()] = status;
    });
    setAttendanceData(newAttendance);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    if (!attendanceData) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: Object.keys(attendanceData).length
    };
    
    Object.values(attendanceData).forEach(status => {
      if (status === "present") stats.present++;
      else if (status === "absent") stats.absent++;
      else if (status === "late") stats.late++;
      else if (status === "excused") stats.excused++;
    });
    
    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Attendance Tracking</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Select Course
              </label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCourses ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                  ) : courses?.length === 0 ? (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  ) : (
                    courses?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Select Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedCourseId ? (
            <>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-medium">Attendance Sheet</h3>
                  <p className="text-sm text-muted-foreground">
                    Recording for {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                    onClick={() => markAllAs("present")}
                  >
                    <CheckCheck className="mr-1 h-4 w-4" /> Mark All Present
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-700 bg-red-50 border-red-200 hover:bg-red-100"
                    onClick={() => markAllAs("absent")}
                  >
                    <X className="mr-1 h-4 w-4" /> Mark All Absent
                  </Button>
                </div>
              </div>

              {isLoadingEnrollments ? (
                <div className="space-y-2">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-32" />
                    </div>
                  ))}
                </div>
              ) : enrollments?.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No students enrolled in this course.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                        <TableHead>Last Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments?.map((enrollment: any) => {
                        const student = enrollment.student;
                        // Mock attendance rate for demo
                        const attendanceRate = Math.floor(Math.random() * 30) + 70; // 70-99%
                        const lastStatus = ["present", "absent", "late", "excused"][Math.floor(Math.random() * 4)];
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(student.user.firstName, student.user.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3">
                                  <p className="font-medium">
                                    {student.user.firstName} {student.user.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {student.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>
                              <Select
                                value={attendanceData[student.id] || "present"}
                                onValueChange={(value) => handleAttendanceChange(student.id.toString(), value)}
                              >
                                <SelectTrigger className={cn(
                                  "w-32",
                                  attendanceData[student.id] === "present" && "cell-present",
                                  attendanceData[student.id] === "absent" && "cell-absent",
                                  attendanceData[student.id] === "late" && "cell-late",
                                  attendanceData[student.id] === "excused" && "cell-excused"
                                )}>
                                  <SelectValue />
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
                                <Progress value={attendanceRate} className="h-2 w-16" />
                                <span className="text-sm">{attendanceRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  lastStatus === "present" ? "success" :
                                  lastStatus === "absent" ? "destructive" :
                                  lastStatus === "late" ? "warning" : "info"
                                }
                              >
                                {lastStatus.charAt(0).toUpperCase() + lastStatus.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {enrollments && enrollments.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Session Summary</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success">Present: {stats.present}</Badge>
                      <Badge variant="destructive">Absent: {stats.absent}</Badge>
                      <Badge variant="warning">Late: {stats.late}</Badge>
                      <Badge variant="info">Excused: {stats.excused}</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveAttendance} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Attendance"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Please select a course to record attendance.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Attendance Rate</h3>
              <div className="flex items-center">
                <Progress value={85} className="h-3 flex-1 mr-4" />
                <span className="font-medium">85%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Computer Science</p>
                  <p className="text-sm font-medium">92%</p>
                </div>
                <Progress value={92} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Business Management</p>
                  <p className="text-sm font-medium">78%</p>
                </div>
                <Progress value={78} className="h-2" indicatorClassName="bg-yellow-500" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Engineering</p>
                  <p className="text-sm font-medium">85%</p>
                </div>
                <Progress value={85} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Medicine</p>
                  <p className="text-sm font-medium">95%</p>
                </div>
                <Progress value={95} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Psychology</p>
                  <p className="text-sm font-medium">75%</p>
                </div>
                <Progress value={75} className="h-2" indicatorClassName="bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Low Attendance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              <div className="py-3 flex">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                    <X className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">James Kim</p>
                    <p className="text-sm text-muted-foreground">Business Management</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-muted-foreground">Missed 5 out of last 10 classes</p>
                    <p className="text-sm font-medium text-red-600">58% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="py-3 flex">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Aisha Thompson</p>
                    <p className="text-sm text-muted-foreground">Psychology</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-muted-foreground">Missed 3 out of last 10 classes</p>
                    <p className="text-sm font-medium text-yellow-600">70% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="py-3 flex">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Daniel Lee</p>
                    <p className="text-sm text-muted-foreground">Computer Science</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-muted-foreground">Missed 2 out of last 10 classes</p>
                    <p className="text-sm font-medium text-yellow-600">75% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="link" className="p-0">
                View all attendance issues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";
