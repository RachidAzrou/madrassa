import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CourseDetail, StudentDetail } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AttendanceFormProps {
  courses: CourseDetail[];
  onSuccess: () => void;
}

export function AttendanceForm({ courses, onSuccess }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Load enrolled students for the selected course
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments/course', selectedCourseId],
    enabled: !!selectedCourseId,
  });

  // Load students data
  const { data: students } = useQuery<StudentDetail[]>({
    queryKey: ['/api/students'],
  });

  // Create a session to mark attendance
  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: {
      courseId: number;
      date: string;
    }) => {
      const response = await apiRequest("POST", "/api/attendance/session", attendanceData);
      return response.json();
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      await createAttendanceMutation.mutateAsync({
        courseId: parseInt(values.courseId),
        date: values.date,
      });
      
      // Show success toast and invalidate queries
      toast({
        title: "Attendance session created",
        description: "You can now mark attendance for the selected course",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      
      // Call onSuccess callback
      onSuccess();
    } catch (error) {
      console.error("Error creating attendance session:", error);
      toast({
        title: "Error",
        description: "There was an error creating the attendance session",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for changes to the courseId field
  const courseId = form.watch("courseId");
  if (courseId !== selectedCourseId) {
    setSelectedCourseId(courseId);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Attendance Session</DialogTitle>
        <DialogDescription>
          Select a course and date to create an attendance session.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
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
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {selectedCourseId && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h3 className="text-sm font-medium mb-2">Enrolled Students</h3>
              
              {isLoadingEnrollments ? (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  Loading enrolled students...
                </div>
              ) : enrollments && enrollments.length > 0 ? (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    This session will be created for {enrollments.length} enrolled students.
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  No students enrolled in this course yet.
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Session
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
