import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/common/PageHeader";
import SearchFilter from "@/components/common/SearchFilter";
import DataTable from "@/components/common/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import StudentForm from "@/components/students/StudentForm";
import { Eye, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const Students = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    program: "",
    year: "",
    status: "",
  });

  // Fetch students data
  const {
    data: students = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/students"],
  });

  // Fetch programs for filtering
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Create student mutation
  const createStudent = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateStudent = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      setIsFormOpen(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudent = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteStudent = (id: number) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent.mutate(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (selectedStudent) {
      updateStudent.mutate({ id: selectedStudent.id, data });
    } else {
      createStudent.mutate(data);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // Apply filters and search to students data
  const filteredStudents = React.useMemo(() => {
    return students.filter((student: any) => {
      // Search by name or email
      const matchesSearch = searchQuery === "" 
        || `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        || student.email.toLowerCase().includes(searchQuery.toLowerCase())
        || student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply filters
      const matchesProgram = filters.program === "" || student.programId === parseInt(filters.program);
      const matchesYear = filters.year === "" || student.year === parseInt(filters.year);
      const matchesStatus = filters.status === "" || student.status === filters.status;
      
      return matchesSearch && matchesProgram && matchesYear && matchesStatus;
    });
  }, [students, searchQuery, filters]);

  // Get program name by id
  const getProgramName = (programId: number) => {
    const program = programs.find((p: any) => p.id === programId);
    return program ? program.name : "Unknown Program";
  };

  // Define table columns
  const columns = [
    {
      header: "Student",
      accessor: (student: any) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10">
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{`${student.firstName} ${student.lastName}`}</div>
            <div className="text-sm text-muted-foreground">{student.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "ID",
      accessor: "studentId",
    },
    {
      header: "Program",
      accessor: (student: any) => getProgramName(student.programId),
    },
    {
      header: "Year",
      accessor: (student: any) => `Year ${student.year}`,
    },
    {
      header: "Status",
      accessor: (student: any) => {
        const statusStyles = {
          active: "bg-green-100 text-green-800 hover:bg-green-200",
          inactive: "bg-gray-100 text-gray-800 hover:bg-gray-200",
          pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        };
        
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-normal",
              statusStyles[student.status as keyof typeof statusStyles]
            )}
          >
            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
          </Badge>
        );
      },
    },
  ];

  // Define filter options
  const filterOptions = [
    {
      label: "Program",
      value: "program",
      options: [
        { label: "All Programs", value: "" },
        ...programs.map((program: any) => ({
          label: program.name,
          value: program.id.toString(),
        })),
      ],
    },
    {
      label: "Year",
      value: "year",
      options: [
        { label: "All Years", value: "" },
        { label: "Year 1", value: "1" },
        { label: "Year 2", value: "2" },
        { label: "Year 3", value: "3" },
        { label: "Year 4", value: "4" },
        { label: "Year 5", value: "5" },
        { label: "Year 6", value: "6" },
      ],
    },
    {
      label: "Status",
      value: "status",
      options: [
        { label: "All Statuses", value: "" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Error loading students: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        description="View and manage all students"
        action={{
          label: "Add Student",
          onClick: handleAddStudent,
          icon: <UserPlus className="h-4 w-4 mr-2" />,
        }}
      />

      <SearchFilter
        placeholder="Search by name, email or ID..."
        filters={filterOptions}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        exportButton
        onExport={() => alert("Export functionality would go here")}
        refreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/students"] })}
      />

      <DataTable
        columns={columns}
        data={filteredStudents}
        loading={isLoading}
        selectable
        pagination={{
          currentPage: 1,
          pageSize: 10,
          totalItems: filteredStudents.length,
          onPageChange: (page) => console.log(`Page changed to ${page}`),
        }}
        actions={(student) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alert(`View student ${student.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Student Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent
                ? "Update student information in the form below"
                : "Fill in the student details to add a new record"}
            </DialogDescription>
          </DialogHeader>
          <StudentForm
            initialValues={selectedStudent}
            onSubmit={handleFormSubmit}
            isSubmitting={createStudent.isPending || updateStudent.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Campus life images */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Student Life</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Students studying together" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Students collaborating" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Student studying outdoors" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Graduation celebration" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Students;
