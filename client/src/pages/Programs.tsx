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
import ProgramForm from "@/components/programs/ProgramForm";
import { Edit, Eye, ListPlus, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Programs = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    status: "",
  });

  // Fetch programs data
  const {
    data: programs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Fetch courses data for program stats
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch students data for program stats
  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  // Create program mutation
  const createProgram = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/programs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create program: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update program mutation
  const updateProgram = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/programs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program updated successfully",
      });
      setIsFormOpen(false);
      setSelectedProgram(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update program: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete program mutation
  const deleteProgram = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete program: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddProgram = () => {
    setSelectedProgram(null);
    setIsFormOpen(true);
  };

  const handleEditProgram = (program: any) => {
    setSelectedProgram(program);
    setIsFormOpen(true);
  };

  const handleDeleteProgram = (id: number) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      deleteProgram.mutate(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (selectedProgram) {
      updateProgram.mutate({ id: selectedProgram.id, data });
    } else {
      createProgram.mutate(data);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // Get course count for a program
  const getCourseCount = (programId: number) => {
    return courses.filter((course: any) => course.programId === programId).length;
  };

  // Get student count for a program
  const getStudentCount = (programId: number) => {
    return students.filter((student: any) => student.programId === programId).length;
  };

  // Apply filters and search to programs data
  const filteredPrograms = React.useMemo(() => {
    return programs.filter((program: any) => {
      // Search by name or code
      const matchesSearch = searchQuery === "" 
        || program.name.toLowerCase().includes(searchQuery.toLowerCase())
        || program.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply filters
      const matchesDepartment = filters.department === "" || program.departments.toLowerCase().includes(filters.department.toLowerCase());
      const matchesStatus = filters.status === "" || program.status === filters.status;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [programs, searchQuery, filters]);

  // Extract unique departments for filtering
  const departments = React.useMemo(() => {
    const allDepartments: string[] = [];
    programs.forEach((program: any) => {
      if (program.departments) {
        program.departments.split(',').forEach((dept: string) => {
          const trimmed = dept.trim();
          if (trimmed && !allDepartments.includes(trimmed)) {
            allDepartments.push(trimmed);
          }
        });
      }
    });
    return allDepartments.map(dept => ({
      label: dept,
      value: dept
    }));
  }, [programs]);

  // Define table columns
  const columns = [
    {
      header: "Program Name",
      accessor: "name",
    },
    {
      header: "Code",
      accessor: "code",
    },
    {
      header: "Duration",
      accessor: (program: any) => `${program.duration} Years`,
    },
    {
      header: "Departments",
      accessor: "departments",
    },
    {
      header: "Courses",
      accessor: (program: any) => getCourseCount(program.id),
    },
    {
      header: "Students",
      accessor: (program: any) => getStudentCount(program.id),
    },
    {
      header: "Status",
      accessor: (program: any) => {
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
              statusStyles[program.status as keyof typeof statusStyles]
            )}
          >
            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
          </Badge>
        );
      },
    },
  ];

  // Define filter options
  const filterOptions = [
    {
      label: "Department",
      value: "department",
      options: [
        { label: "All Departments", value: "" },
        ...departments,
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
        Error loading programs: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Management"
        description="View and manage academic programs"
        action={{
          label: "Add Program",
          onClick: handleAddProgram,
          icon: <ListPlus className="h-4 w-4 mr-2" />,
        }}
      />

      <SearchFilter
        placeholder="Search programs by name or code..."
        filters={filterOptions}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        exportButton
        onExport={() => alert("Export functionality would go here")}
        refreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/programs"] })}
      />

      <DataTable
        columns={columns}
        data={filteredPrograms}
        loading={isLoading}
        pagination={{
          currentPage: 1,
          pageSize: 10,
          totalItems: filteredPrograms.length,
          onPageChange: (page) => console.log(`Page changed to ${page}`),
        }}
        actions={(program) => (
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
              <DropdownMenuItem onClick={() => alert(`View program ${program.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteProgram(program.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Program Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProgram ? "Edit Program" : "Add New Program"}
            </DialogTitle>
            <DialogDescription>
              {selectedProgram
                ? "Update program information in the form below"
                : "Fill in the program details to add a new record"}
            </DialogDescription>
          </DialogHeader>
          <ProgramForm
            initialValues={selectedProgram}
            onSubmit={handleFormSubmit}
            isSubmitting={createProgram.isPending || updateProgram.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Campus Image */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Our Campus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <img 
            src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Campus building" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Modern campus architecture" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Campus park" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Campus library" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Programs;
