import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProgramSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extend the schema with validation rules
const programFormSchema = insertProgramSchema.extend({
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 year").max(10, "Duration cannot exceed 10 years"),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

interface ProgramFormProps {
  onCancel: () => void;
  onSubmit: () => void;
  programToEdit?: ProgramFormValues;
}

export default function ProgramForm({ onCancel, onSubmit, programToEdit }: ProgramFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use react-hook-form with zod validation
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: programToEdit || {
      name: "",
      code: "",
      description: "",
      department: "",
      duration: 4,
    },
  });

  // Create mutation for adding programs
  const createProgram = useMutation({
    mutationFn: (data: ProgramFormValues) => 
      apiRequest("POST", "/api/programs", data),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      toast({
        title: "Success",
        description: "Program has been added successfully",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add program: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: ProgramFormValues) => {
    setIsSubmitting(true);
    createProgram.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Program Name*
            </label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter program name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="code">
              Program Code*
            </label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="e.g. CS, BUS, ENG"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="department">
              Department*
            </label>
            <Input
              id="department"
              {...form.register("department")}
              placeholder="Enter department name"
            />
            {form.formState.errors.department && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.department.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter program description"
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="duration">
              Duration (years)*
            </label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="10"
              {...form.register("duration")}
            />
            {form.formState.errors.duration && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.duration.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Program"}
        </Button>
      </div>
    </form>
  );
}
