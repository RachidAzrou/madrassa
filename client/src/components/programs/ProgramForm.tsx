import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { programFormSchema } from "@shared/schema";

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

interface ProgramFormProps {
  programId?: number;
  onSuccess?: () => void;
}

export default function ProgramForm({ programId, onSuccess }: ProgramFormProps) {
  const { toast } = useToast();
  const isEditMode = !!programId;

  const { data: programData, isLoading: isLoadingProgram } = useQuery({
    queryKey: ["/api/programs", programId],
    enabled: isEditMode,
  });

  const form = useForm({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      duration: 4,
      departmentId: 0, // Not used in demo
    },
  });

  // Set form values when editing
  React.useEffect(() => {
    if (isEditMode && programData) {
      form.reset({
        name: programData.name,
        code: programData.code,
        description: programData.description || "",
        duration: programData.duration || 4,
        departmentId: programData.departmentId || 0,
      });
    }
  }, [isEditMode, programData, form]);

  const createProgram = useMutation({
    mutationFn: async (data: typeof programFormSchema._type) => {
      const response = await apiRequest("POST", "/api/programs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program created successfully",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    },
  });

  const updateProgram = useMutation({
    mutationFn: async (data: typeof programFormSchema._type) => {
      const response = await apiRequest("PUT", `/api/programs/${programId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program updated successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: typeof programFormSchema._type) => {
    if (isEditMode) {
      updateProgram.mutate(data);
    } else {
      createProgram.mutate(data);
    }
  };

  if (isEditMode && isLoadingProgram) {
    return <div>Loading program data...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program Name</FormLabel>
                <FormControl>
                  <Input placeholder="Computer Science" {...field} />
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
                <FormLabel>Program Code</FormLabel>
                <FormControl>
                  <Input placeholder="CS" {...field} />
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
                  placeholder="Enter program description"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (Years)</FormLabel>
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

        <div className="flex justify-end space-x-2">
          {onSuccess && (
            <Button variant="outline" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createProgram.isPending || updateProgram.isPending}
          >
            {createProgram.isPending || updateProgram.isPending ? (
              "Saving..."
            ) : isEditMode ? (
              "Update Program"
            ) : (
              "Create Program"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
