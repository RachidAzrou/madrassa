import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Course } from "@shared/schema";

// Create a schema for the form
const attendanceSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  date: z.string().min(1, "Date is required"),
});

type AttendanceSessionFormValues = z.infer<typeof attendanceSessionSchema>;

interface AttendanceFormProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export default function AttendanceForm({ onCancel, onSubmit }: AttendanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Use react-hook-form with zod validation
  const form = useForm<AttendanceSessionFormValues>({
    resolver: zodResolver(attendanceSessionSchema),
    defaultValues: {
      courseId: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Create mutation for creating attendance session
  const createAttendanceSession = useMutation({
    mutationFn: (data: AttendanceSessionFormValues) => 
      apiRequest("POST", "/api/attendance/session", {
        courseId: parseInt(data.courseId),
        date: data.date,
      }),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: "Success",
        description: "Attendance session created successfully",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create attendance session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: AttendanceSessionFormValues) => {
    setIsSubmitting(true);
    createAttendanceSession.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="courseId">
            Course*
          </label>
          <Select 
            value={form.watch("courseId")} 
            onValueChange={(value) => form.setValue("courseId", value)}
          >
            <SelectTrigger id="courseId">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.courseId && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.courseId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="date">
            Date*
          </label>
          <input
            id="date"
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...form.register("date")}
          />
          {form.formState.errors.date && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
        <div className="flex items-start">
          <i className="ri-information-line text-lg mr-2 mt-0.5"></i>
          <div>
            <p className="font-medium mb-1">What happens next?</p>
            <p>After creating the attendance session, you'll be able to mark students as present, absent, late, or excused.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Session"}
        </Button>
      </div>
    </form>
  );
}
