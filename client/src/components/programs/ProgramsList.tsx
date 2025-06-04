import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Program } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { ListPlus, Edit, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProgramForm from "./ProgramForm";

export default function ProgramsList() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/programs/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      setProgramToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete program",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (program: Program) => {
    setProgramToDelete(program);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      deleteProgram.mutate(programToDelete.id);
    }
    setShowDeleteDialog(false);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowAddForm(true);
  };

  const filteredPrograms = programs?.filter((program) => {
    return program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           program.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const renderContent = () => {
    if (showAddForm) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingProgram ? "Edit Program" : "Add New Program"}
              </h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProgram(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <ProgramForm 
              programId={editingProgram?.id}
              onSuccess={() => {
                setShowAddForm(false);
                setEditingProgram(null);
              }} 
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Programs Management</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search programs..."
                className="pl-10 w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <ListPlus className="mr-2 h-4 w-4" />
              <span>Add Program</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration (Years)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                  ) : filteredPrograms?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No programs found. Adjust your search or add a new program.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrograms?.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>{program.code}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {program.description || "No description"}
                        </TableCell>
                        <TableCell>{program.duration} years</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(program)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(program)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <>
      {renderContent()}
      
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Programma Verwijderen"
        description="Weet je zeker dat je dit programma wilt verwijderen?"
        item={{
          name: programToDelete?.name || "",
          id: programToDelete?.code || ""
        }}
        warningText="Deze actie kan niet ongedaan worden gemaakt. Het programma wordt permanent verwijderd."
        confirmButtonText="Definitief Verwijderen"
        cancelButtonText="Annuleren"
      />
    </>
  );
}
