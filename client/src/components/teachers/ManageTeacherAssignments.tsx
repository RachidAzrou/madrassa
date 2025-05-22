import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ManageTeacherAssignmentsProps {
  teacherId: number;
  onClose?: () => void;
  open: boolean;
}

export default function ManageTeacherAssignments({
  teacherId,
  onClose,
  open,
}: ManageTeacherAssignmentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [primaryCourses, setPrimaryCourses] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Haal bestaande docent-vak-koppelingen op
  const { data: teacherAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/teacher-course-assignments", teacherId],
    enabled: !!teacherId,
  });

  // Haal alle beschikbare vakken op
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Haal docent informatie op
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ["/api/teachers", teacherId],
    enabled: !!teacherId,
  });

  useEffect(() => {
    if (teacherAssignments && courses) {
      // Zet de initiële selectie gebaseerd op bestaande toewijzingen
      const initialSelectedCourses = teacherAssignments.map(
        (assignment: any) => assignment.courseId
      );
      setSelectedCourses(initialSelectedCourses);

      // Zet de initiële primaire vakken
      const initialPrimaryCourses = teacherAssignments
        .filter((assignment: any) => assignment.isPrimary)
        .map((assignment: any) => assignment.courseId);
      setPrimaryCourses(initialPrimaryCourses);

      // Zet de initiële notities
      const initialNotes: Record<number, string> = {};
      teacherAssignments.forEach((assignment: any) => {
        if (assignment.notes) {
          initialNotes[assignment.courseId] = assignment.notes;
        }
      });
      setNotes(initialNotes);
    }
  }, [teacherAssignments, courses]);

  const updateAssignmentsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/teachers/${teacherId}/course-assignments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-course-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Vakken bijgewerkt",
        description: "De vakinformatie voor deze docent is bijgewerkt.",
      });
      if (onClose) onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij opslaan",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleToggleCourse = (courseId: number) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId));
      // Als een vak wordt verwijderd, verwijder ook de primaire status
      setPrimaryCourses(primaryCourses.filter((id) => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleTogglePrimary = (courseId: number) => {
    if (primaryCourses.includes(courseId)) {
      setPrimaryCourses(primaryCourses.filter((id) => id !== courseId));
    } else {
      setPrimaryCourses([...primaryCourses, courseId]);
    }
  };

  const handleNotesChange = (courseId: number, value: string) => {
    setNotes({
      ...notes,
      [courseId]: value,
    });
  };

  const handleSave = () => {
    const assignments = selectedCourses.map((courseId) => ({
      courseId,
      isPrimary: primaryCourses.includes(courseId),
      notes: notes[courseId] || "",
      startDate: new Date().toISOString().split("T")[0], // Vandaag als startdatum
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0], // Een jaar vanaf nu als einddatum
    }));

    updateAssignmentsMutation.mutate({ assignments });
  };

  if (assignmentsLoading || coursesLoading || teacherLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vakken toewijzen aan docent</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vakken toewijzen aan docent</DialogTitle>
          <DialogDescription>
            {teacher && (
              <span>
                Selecteer de vakken voor {teacher.firstName} {teacher.lastName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Selecteer</TableHead>
                <TableHead>Vaknaam</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead className="w-[120px]">Hoofddocent</TableHead>
                <TableHead>Notities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses &&
                courses.map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => handleToggleCourse(course.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.description}</TableCell>
                    <TableCell>
                      <Checkbox
                        disabled={!selectedCourses.includes(course.id)}
                        checked={primaryCourses.includes(course.id)}
                        onCheckedChange={() => handleTogglePrimary(course.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        disabled={!selectedCourses.includes(course.id)}
                        value={notes[course.id] || ""}
                        onChange={(e) =>
                          handleNotesChange(course.id, e.target.value)
                        }
                        placeholder="Notities over deze toewijzing"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateAssignmentsMutation.isPending}
          >
            {updateAssignmentsMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Opslaan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}