import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FilePlus, Filter, History, Save, MoreVertical
} from "lucide-react";
import { insertGradeSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function GradingTable() {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("all");
  const [showNewAssessmentDialog, setShowNewAssessmentDialog] = useState(false);
  const [grades, setGrades] = useState<{ [key: string]: { [key: string]: number } }>({});
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);

  // Fetch courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch enrollments (students) for the selected course
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/courses", selectedCourse, "enrollments"],
    enabled: !!selectedCourse,
  });

  // Fetch grades for the selected course
  const { data: courseGrades, isLoading: isLoadingGrades } = useQuery({
    queryKey: ["/api/grades", { courseId: selectedCourse }],
    enabled: !!selectedCourse,
  });

  // Initialize the form for new assessment
  const assessmentForm = useForm({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      assessmentType: "",
      maxScore: 100,
      date: new Date(),
      remarks: "",
      courseId: 0,
      studentId: 0,
      score: 0,
    },
  });

  // Update courseId when selected course changes
  React.useEffect(() => {
    if (selectedCourse) {
      assessmentForm.setValue("courseId", parseInt(selectedCourse));
    }
  }, [selectedCourse, assessmentForm]);

  // Initialize grades state from fetched data
  React.useEffect(() => {
    if (courseGrades && enrollments) {
      const gradeData: { [key: string]: { [key: string]: number } } = {};
      
      // Initialize with zero scores for all students and assessment types
      enrollments.forEach((enrollment: any) => {
        gradeData[enrollment.student.id] = {
          midterm: 0,
          assignment: 0,
          project: 0,
          final: 0
        };
      });
      
      // Fill in actual grades where they exist
      courseGrades.forEach((grade: any) => {
        if (!gradeData[grade.student.id]) {
          gradeData[grade.student.id] = {};
        }
        gradeData[grade.student.id][grade.assessmentType] = grade.score;
      });
      
      setGrades(gradeData);
    }
  }, [courseGrades, enrollments]);

  // Add new assessment mutation
  const addAssessmentMutation = useMutation({
    mutationFn: async (data: typeof insertGradeSchema._type) => {
      const response = await apiRequest("POST", "/api/grades", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades", { courseId: selectedCourse }] });
      toast({
        title: "Success",
        description: "Assessment added successfully",
      });
      setShowNewAssessmentDialog(false);
      assessmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add assessment",
        variant: "destructive",
      });
    },
  });

  // Update grades mutation
  const updateGradesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/grades/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades", { courseId: selectedCourse }] });
      toast({
        title: "Success",
        description: "Grades updated successfully",
      });
      setIsSubmittingGrades(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grades",
        variant: "destructive",
      });
      setIsSubmittingGrades(false);
    },
  });

  const handleGradeChange = (studentId: string, assessmentType: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentType]: numValue
      }
    }));
  };

  const handleSaveGrades = async () => {
    setIsSubmittingGrades(true);
    
    try {
      // Find existing grades to update
      if (courseGrades) {
        for (const grade of courseGrades) {
          const newScore = grades[grade.student.id]?.[grade.assessmentType];
          
          if (newScore !== undefined && newScore !== grade.score) {
            await updateGradesMutation.mutateAsync({
              id: grade.id,
              score: newScore
            });
          }
        }
      }
      
      toast({
        title: "Success",
        description: "All grades have been saved",
      });
      setIsSubmittingGrades(false);
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "Error",
        description: "Failed to save some grades",
        variant: "destructive",
      });
      setIsSubmittingGrades(false);
    }
  };

  const calculateOverallGrade = (studentId: string) => {
    if (!grades[studentId]) return { percent: 0, letter: "N/A" };
    
    const studentGrades = grades[studentId];
    const totalScore = studentGrades.midterm + studentGrades.assignment + studentGrades.project + studentGrades.final;
    const totalPossible = 400; // Assuming all assessments are out of 100
    const percent = totalPossible ? Math.round((totalScore / totalPossible) * 100 * 10) / 10 : 0;
    
    // Determine letter grade
    let letter = "F";
    if (percent >= 90) letter = "A";
    else if (percent >= 80) letter = "B";
    else if (percent >= 70) letter = "C";
    else if (percent >= 60) letter = "D";
    
    // Add +/- modifiers
    if (letter !== "F") {
      const remainder = percent % 10;
      if (remainder >= 7 && letter !== "A") letter += "+";
      else if (remainder < 3 && letter !== "F") letter += "-";
    }
    
    return { percent, letter };
  };

  const onAddAssessmentSubmit = (data: typeof insertGradeSchema._type) => {
    if (!selectedCourse) {
      toast({
        title: "Error", 
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }
    
    addAssessmentMutation.mutate(data);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Grade Management</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button onClick={() => setShowNewAssessmentDialog(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Select Course
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Assessment Type
              </label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  <SelectItem value="midterm">Midterm Exam</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedCourse ? (
            <div className="text-center py-10 text-muted-foreground">
              Please select a course to view grades
            </div>
          ) : isLoadingEnrollments || isLoadingGrades ? (
            <div className="space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No students enrolled in this course
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-center">Midterm</TableHead>
                      <TableHead className="text-center">Assignments</TableHead>
                      <TableHead className="text-center">Projects</TableHead>
                      <TableHead className="text-center">Final</TableHead>
                      <TableHead className="text-center">Overall</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => {
                      const student = enrollment.student;
                      const overall = calculateOverallGrade(student.id.toString());
                      
                      // Skip row if filtering by assessment type and student has no grade
                      if (selectedAssessment !== "all" && 
                          (!grades[student.id] || grades[student.id][selectedAssessment] === undefined)) {
                        return null;
                      }
                      
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
                          <TableCell className="text-center">
                            <Input 
                              type="text" 
                              value={grades[student.id]?.midterm || ""}
                              onChange={(e) => handleGradeChange(student.id.toString(), "midterm", e.target.value)}
                              className="w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input 
                              type="text" 
                              value={grades[student.id]?.assignment || ""}
                              onChange={(e) => handleGradeChange(student.id.toString(), "assignment", e.target.value)}
                              className="w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input 
                              type="text" 
                              value={grades[student.id]?.project || ""}
                              onChange={(e) => handleGradeChange(student.id.toString(), "project", e.target.value)}
                              className="w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input 
                              type="text" 
                              value={grades[student.id]?.final || ""}
                              onChange={(e) => handleGradeChange(student.id.toString(), "final", e.target.value)}
                              className="w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${overall.percent >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                overall.percent >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                                overall.percent >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                                overall.percent >= 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {overall.letter} ({overall.percent}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <History className="mr-2 h-4 w-4" />
                                  <span>View History</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <FilePlus className="mr-2 h-4 w-4" />
                                  <span>Add Assessment</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSaveGrades}
                  disabled={isSubmittingGrades}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmittingGrades ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* New Assessment Dialog */}
      <Dialog open={showNewAssessmentDialog} onOpenChange={setShowNewAssessmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Assessment</DialogTitle>
            <DialogDescription>
              Create a new assessment for the selected course. You'll be able to enter grades for each student later.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(onAddAssessmentSubmit)} className="space-y-6">
              <FormField
                control={assessmentForm.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm Exam</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assessmentForm.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={assessmentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student (Optional)</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All students" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All students</SelectItem>
                          <ScrollArea className="h-[200px]">
                            {enrollments?.map((enrollment: any) => (
                              <SelectItem key={enrollment.student.id} value={enrollment.student.id.toString()}>
                                {enrollment.student.user.firstName} {enrollment.student.user.lastName}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={assessmentForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any notes about this assessment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewAssessmentDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addAssessmentMutation.isPending}
                >
                  {addAssessmentMutation.isPending ? "Creating..." : "Create Assessment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
