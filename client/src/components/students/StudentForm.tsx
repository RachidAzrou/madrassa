import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertStudentSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateToDisplayFormat, formatDateToDatabaseFormat } from "@/lib/utils";

// Extend the schema with validation rules
const studentFormSchema = insertStudentSchema.extend({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onCancel: () => void;
  onSubmit: () => void;
  studentToEdit?: StudentFormValues;
}

export default function StudentForm({ onCancel, onSubmit, studentToEdit }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch programs for the select dropdown
  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Use react-hook-form with zod validation
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: studentToEdit || {
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      phoneNumber: "",
      status: "active",
      enrollmentDate: formatDateToDisplayFormat(new Date().toISOString().split('T')[0]),
    },
  });

  // Create mutation for adding students
  const createStudent = useMutation({
    mutationFn: (data: StudentFormValues) => 
      apiRequest("POST", "/api/students", data),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Student has been added successfully",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: StudentFormValues) => {
    setIsSubmitting(true);
    
    // Verwerk alle datumvelden voor database opslag
    const formattedData = { ...data };
    ['dateOfBirth', 'enrollmentDate'].forEach(field => {
      if (formattedData[field] && typeof formattedData[field] === 'string') {
        formattedData[field] = formatDateToDatabaseFormat(formattedData[field]);
      }
    });
    
    createStudent.mutate(formattedData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="studentId">
              Student ID*
            </label>
            <Input
              id="studentId"
              {...form.register("studentId")}
              placeholder="Enter student ID"
            />
            {form.formState.errors.studentId && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.studentId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstName">
              Voornaam*
            </label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              placeholder="Voer voornaam in"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastName">
              Achternaam*
            </label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              placeholder="Voer achternaam in"
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email*
            </label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Voer e-mailadres in"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dateOfBirth">
              Geboortedatum
            </label>
            <Input
              id="dateOfBirth"
              placeholder="DD/MM/JJJJ"
              {...form.register("dateOfBirth")}
            />
            {form.formState.errors.dateOfBirth && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.dateOfBirth.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="gender">
              Geslacht
            </label>
            <Select 
              value={form.watch("gender")} 
              onValueChange={(value) => form.setValue("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Selecteer geslacht" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Man</SelectItem>
                <SelectItem value="female">Vrouw</SelectItem>
                <SelectItem value="other">Anders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phoneNumber">
              Telefoonnummer
            </label>
            <Input
              id="phoneNumber"
              {...form.register("phoneNumber")}
              placeholder="Voer telefoonnummer in"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="address">
              Adres
            </label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Voer adres in"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="programId">
              Programma
            </label>
            <Select 
              value={form.watch("programId")?.toString()} 
              onValueChange={(value) => form.setValue("programId", parseInt(value))}
            >
              <SelectTrigger id="programId">
                <SelectValue placeholder="Selecteer programma" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="yearLevel">
              Jaarniveau
            </label>
            <Select 
              value={form.watch("yearLevel")?.toString()} 
              onValueChange={(value) => form.setValue("yearLevel", parseInt(value))}
            >
              <SelectTrigger id="yearLevel">
                <SelectValue placeholder="Selecteer jaarniveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Jaar 1</SelectItem>
                <SelectItem value="2">Jaar 2</SelectItem>
                <SelectItem value="3">Jaar 3</SelectItem>
                <SelectItem value="4">Jaar 4</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
                <SelectItem value="pending">In Afwachting</SelectItem>
                <SelectItem value="graduated">Afgestudeerd</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="enrollmentDate">
              Inschrijvingsdatum*
            </label>
            <Input
              id="enrollmentDate"
              placeholder="DD/MM/JJJJ"
              {...form.register("enrollmentDate")}
            />
            {form.formState.errors.enrollmentDate && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.enrollmentDate.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuleren
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Opslaan..." : "Student Opslaan"}
        </Button>
      </div>
    </form>
  );
}
