import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { courseFormSchema } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseFormProps {
  courseId?: number;
  onSuccess?: () => void;
}

export default function CourseForm({ courseId, onSuccess }: CourseFormProps) {
  const { toast } = useToast();
  const isEditMode = !!courseId;

  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    // In a real app, we would have a route to get all instructors
    // For now, we'll mock this as the backend route isn't implemented
    enabled: false,
  });

  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: isEditMode,
  });

  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      credits: 3,
      programId: 0,
      instructorId: 0,
      capacity: 30,
      enrolled: 0,
    },
  });

  // Set form values when editing
  React.useEffect(() => {
    if (isEditMode && courseData) {
      form.reset({
        name: courseData.name,
        code: courseData.code,
        description: courseData.description || "",
        credits: courseData.credits,
        programId: courseData.programId || 0,
        instructorId: courseData.instructorId || 0,
        capacity: courseData.capacity,
        enrolled: courseData.enrolled,
      });
    }
  }, [isEditMode, courseData, form]);

  const createCourse = useMutation({
    mutationFn: async (data: typeof courseFormSchema._type) => {
      const response = await apiRequest("POST", "/api/courses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async (data: typeof courseFormSchema._type) => {
      const response = await apiRequest("PUT", `/api/courses/${courseId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: typeof courseFormSchema._type) => {
    if (isEditMode) {
      updateCourse.mutate(data);
    } else {
      createCourse.mutate(data);
    }
  };

  if (isEditMode && isLoadingCourse) {
    return <div>Loading course data...</div>;
  }

  // For the instructors demo data
  const instructors = [
    { id: 1, firstName: "John", lastName: "Smith", role: "instructor" },
    { id: 2, firstName: "Emma", lastName: "Davis", role: "instructor" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input placeholder="Introduction to Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="CS101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter course description"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="credits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credits</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditMode && (
            <FormField
              control={form.control}
              name="enrolled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enrolled Students</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={form.getValues("capacity")}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="programId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(value) => field.onChange(parseInt(value) || 0)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
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
            name="instructorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructor</FormLabel>
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(value) => field.onChange(parseInt(value) || 0)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.firstName} {instructor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onSuccess && (
            <Button variant="outline" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createCourse.isPending || updateCourse.isPending}
          >
            {createCourse.isPending || updateCourse.isPending ? (
              "Saving..."
            ) : isEditMode ? (
              "Update Course"
            ) : (
              "Create Course"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
