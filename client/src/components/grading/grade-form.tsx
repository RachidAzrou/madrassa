import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertGradeSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Extend the schema to add client-side validation
const gradeFormSchema = insertGradeSchema.extend({
  score: z.coerce.number().min(0, "Score must be at least 0"),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1"),
  weight: z.coerce.number().min(1, "Weight must be at least 1").max(100, "Weight cannot exceed 100"),
  date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: GradeFormValues;
  isEdit?: boolean;
  courseId?: number;
  onSuccess?: () => void;
}

export default function GradeForm({ 
  isOpen, 
  onClose, 
  initialData, 
  isEdit = false,
  courseId,
  onSuccess
}: GradeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch courses for the dropdown if courseId is not provided
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: isOpen && !courseId,
  });

  // Fetch students for the dropdown
  const { data: allStudents = [], isLoading: isLoadingAllStudents } = useQuery({
    queryKey: ["/api/students"],
    enabled: isOpen && !initialData,
  });

  // If courseId is provided, fetch only students enrolled in this course
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const res = await fetch(`/api/enrollments?courseId=${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return res.json();
    },
    enabled: isOpen && !!courseId,
  });

  const { data: enrolledStudents = [], isLoading: isLoadingEnrolledStudents } = useQuery({
    queryKey: ["/api/students/enrolled", courseId, enrollments],
    queryFn: async () => {
      if (!courseId || !enrollments.length) return [];
      
      // Get student details for each enrollment
      const studentPromises = enrollments.map((enrollment: any) => 
        fetch(`/api/students/${enrollment.studentId}`).then(res => res.json())
      );
      
      return await Promise.all(studentPromises);
    },
    enabled: isOpen && !!courseId && enrollments.length > 0,
  });

  // Use enrolled students if courseId is provided, otherwise use all students
  const students = courseId ? enrolledStudents : allStudents;
  const isLoadingStudents = courseId ? isLoadingEnrolledStudents || isLoadingEnrollments : isLoadingAllStudents;

  // Setup form with default values
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: initialData || {
      studentId: undefined,
      courseId: courseId,
      assessmentType: "midterm",
      assessmentName: "Midterm Exam",
      score: 0,
      maxScore: 100,
      weight: 20, // Default weight: 20%
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Create or update grade mutation
  const mutation = useMutation({
    mutationFn: async (values: GradeFormValues) => {
      if (isEdit && initialData?.id) {
        return apiRequest("PUT", `/api/grades/${initialData.id}`, values);
      } else {
        return apiRequest("POST", "/api/grades", values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Grade ${isEdit ? "updated" : "recorded"} successfully`,
        variant: "default",
      });
      
      // Close the dialog and reset form
      onClose();
      form.reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEdit ? "update" : "record"} grade`,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: GradeFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  // Assessment type options
  const assessmentTypes = [
    { value: "midterm", label: "Midterm Exam" },
    { value: "final", label: "Final Exam" },
    { value: "assignment", label: "Assignment" },
    { value: "project", label: "Project" },
    { value: "quiz", label: "Quiz" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Grade" : "Record New Grade"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Course Selection - Only show if courseId is not provided */}
            {!courseId && (
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingCourses}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingStudents}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} ({student.studentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Assessment Type */}
            <FormField
              control={form.control}
              name="assessmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assessmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Assessment Name */}
            <FormField
              control={form.control}
              name="assessmentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Midterm Exam, Assignment 1, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-3 gap-4">
              {/* Score */}
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Max Score */}
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Score</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Weight (%) */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update" : "Record"} Grade
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
