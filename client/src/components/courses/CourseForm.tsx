import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertCourseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extend the schema with validation rules
const courseFormSchema = insertCourseSchema.extend({
  credits: z.coerce.number().int().min(1, "Credits must be at least 1"),
  maxCapacity: z.coerce.number().int().min(1, "Max capacity must be at least 1").optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  onCancel: () => void;
  onSubmit: () => void;
  courseToEdit?: CourseFormValues;
}

export default function CourseForm({ onCancel, onSubmit, courseToEdit }: CourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch programs for the select dropdown
  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Use react-hook-form with zod validation
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: courseToEdit || {
      name: "",
      code: "",
      description: "",
      credits: 3,
      programId: undefined,
      instructor: "",
      maxCapacity: 30,
      status: "active",
    },
  });

  // Create mutation for adding courses
  const createCourse = useMutation({
    mutationFn: (data: CourseFormValues) => 
      apiRequest("POST", "/api/courses", data),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Success",
        description: "Course has been added successfully",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: CourseFormValues) => {
    setIsSubmitting(true);
    createCourse.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Course Name*
            </label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter course name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="code">
              Course Code*
            </label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="e.g. CS101"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter course description"
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="credits">
              Credits*
            </label>
            <Input
              id="credits"
              type="number"
              min="1"
              {...form.register("credits")}
            />
            {form.formState.errors.credits && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.credits.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="programId">
              Program
            </label>
            <Select 
              value={form.watch("programId")?.toString()} 
              onValueChange={(value) => form.setValue("programId", value ? parseInt(value) : undefined)}
            >
              <SelectTrigger id="programId">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="instructor">
              Instructor
            </label>
            <Input
              id="instructor"
              {...form.register("instructor")}
              placeholder="Enter instructor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="maxCapacity">
              Maximum Capacity
            </label>
            <Input
              id="maxCapacity"
              type="number"
              min="1"
              {...form.register("maxCapacity")}
            />
            {form.formState.errors.maxCapacity && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.maxCapacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status*
            </label>
            <Select 
              value={form.watch("status")} 
              onValueChange={(value) => form.setValue("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Course"}
        </Button>
      </div>
    </form>
  );
}
