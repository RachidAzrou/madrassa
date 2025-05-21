import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Download, FileDown, BarChart } from "lucide-react";

export default function ReportsList() {
  const [reportType, setReportType] = useState<string>("student-performance");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("semester");

  // Fetch programs for filter
  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Fetch courses for filter
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch students for student reports
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    if (grade >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderStudentPerformanceReport = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Academic Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Overall Standing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((student: any) => {
                    // Mock data for demo purposes
                    const gpa = (Math.random() * 1.5 + 2.5).toFixed(2); // Random GPA between 2.5 and 4.0
                    const attendance = Math.floor(Math.random() * 25) + 75; // Random attendance between 75% and 99%
                    
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
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{student.studentId}</TableCell>
                        <TableCell>{student.program.name}</TableCell>
                        <TableCell className={getGradeColor(parseFloat(gpa) * 25)}>{gpa}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={attendance} className="h-2 w-16" />
                            <span className="text-sm">{attendance}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(student.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCourseStatisticsReport = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Statistics Report</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <div className="space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-60" />
                  <div className="flex space-x-8">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Avg. Grade</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses?.map((course: any) => {
                    // Mock data for demo purposes
                    const avgGrade = Math.floor(Math.random() * 25) + 70; // Random grade between 70 and 94
                    const passRate = Math.floor(Math.random() * 15) + 85; // Random pass rate between 85% and 99%
                    
                    return (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>
                          {course.enrolled}/{course.capacity}
                          <Progress 
                            value={(course.enrolled / course.capacity) * 100} 
                            className="h-1 w-16 mt-1" 
                          />
                        </TableCell>
                        <TableCell className={getGradeColor(avgGrade)}>{avgGrade}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={passRate} className="h-2 w-16" />
                            <span className="text-sm">{passRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <BarChart className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAttendanceReport = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPrograms ? (
            <div className="space-y-6">
              {Array(4).fill(null).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <div className="space-y-3">
                    {Array(3).fill(null).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <div>
                          <Skeleton className="h-2 w-40" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Overall Attendance by Program</h3>
                {programs?.map((program: any) => {
                  // Mock data for demo purposes
                  const attendanceRate = Math.floor(Math.random() * 25) + 75; // Random between 75% and 99%
                  
                  return (
                    <div key={program.id} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <div className="font-medium">{program.name}</div>
                        <div className={attendanceRate > 90 ? "text-green-600" : attendanceRate > 80 ? "text-yellow-600" : "text-red-600"}>
                          {attendanceRate}%
                        </div>
                      </div>
                      <Progress value={attendanceRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Present: {Math.floor(attendanceRate)}%</span>
                        <span>Late: {Math.floor((100 - attendanceRate) / 2)}%</span>
                        <span>Absent: {Math.floor((100 - attendanceRate) / 2)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Low Attendance Warnings</h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Mock data for demo */}
                      <TableRow>
                        <TableCell>James Kim</TableCell>
                        <TableCell>Business Ethics</TableCell>
                        <TableCell className="text-red-600">58%</TableCell>
                        <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Aisha Thompson</TableCell>
                        <TableCell>Cognitive Psychology</TableCell>
                        <TableCell className="text-yellow-600">70%</TableCell>
                        <TableCell><Badge variant="warning">Warning</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Daniel Lee</TableCell>
                        <TableCell>Introduction to Computer Science</TableCell>
                        <TableCell className="text-yellow-600">75%</TableCell>
                        <TableCell><Badge variant="warning">Warning</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student-performance">Student Performance</SelectItem>
                  <SelectItem value="course-statistics">Course Statistics</SelectItem>
                  <SelectItem value="attendance-summary">Attendance Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Program
              </label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.map((program: any) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Course
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semester">Current Semester</SelectItem>
                  <SelectItem value="year">Academic Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            {reportType === "student-performance" && renderStudentPerformanceReport()}
            {reportType === "course-statistics" && renderCourseStatisticsReport()}
            {reportType === "attendance-summary" && renderAttendanceReport()}
          </TabsContent>
          <TabsContent value="chart">
            <Card>
              <CardContent className="py-10">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Chart View</h3>
                    <p className="text-muted-foreground max-w-md">
                      Charts and visualizations for the selected report will be displayed here.
                      Select a report type and filters above to generate a visual report.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between border-t pt-6">
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
        <Button>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>
    </div>
  );
}
