import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/common/PageHeader";
import SearchFilter from "@/components/common/SearchFilter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import CourseForm from "@/components/courses/CourseForm";
import { BookPlus, Edit, Eye, MoreHorizontal, Trash2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const Courses = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    program: "",
    department: "",
    status: "",
  });

  // Fetch courses data
  const {
    data: courses = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch programs for filtering
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Fetch enrollments for course stats
  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/enrollments"],
  });

  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourse = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      setIsFormOpen(false);
      setSelectedCourse(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

  const handleDeleteCourse = (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourse.mutate(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (selectedCourse) {
      updateCourse.mutate({ id: selectedCourse.id, data });
    } else {
      createCourse.mutate(data);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // Get course enrollment count
  const getEnrollmentCount = (courseId: number) => {
    return enrollments.filter((enrollment: any) => enrollment.courseId === courseId).length;
  };

  // Apply filters and search to courses data
  const filteredCourses = React.useMemo(() => {
    return courses.filter((course: any) => {
      // Search by name or code
      const matchesSearch = searchQuery === "" 
        || course.name.toLowerCase().includes(searchQuery.toLowerCase())
        || course.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply filters
      const matchesProgram = filters.program === "" || course.programId === parseInt(filters.program);
      const matchesDepartment = filters.department === "" || course.department.toLowerCase().includes(filters.department.toLowerCase());
      const matchesStatus = filters.status === "" || course.status === filters.status;
      
      return matchesSearch && matchesProgram && matchesDepartment && matchesStatus;
    });
  }, [courses, searchQuery, filters, enrollments]);

  // Get program name by id
  const getProgramName = (programId: number) => {
    if (!programId) return "General";
    const program = programs.find((p: any) => p.id === programId);
    return program ? program.name : "Unknown Program";
  };

  // Unique departments for filter
  const departments = React.useMemo(() => {
    const uniqueDepartments = new Set<string>();
    courses.forEach((course: any) => {
      if (course.department) uniqueDepartments.add(course.department);
    });
    return Array.from(uniqueDepartments).map(dept => ({
      label: dept,
      value: dept
    }));
  }, [courses]);

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
        Error loading courses: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Management"
        description="View and manage all courses"
        action={{
          label: "Add Course",
          onClick: handleAddCourse,
          icon: <BookPlus className="h-4 w-4 mr-2" />,
        }}
      />

      <SearchFilter
        placeholder="Search courses by name or code..."
        filters={filterOptions}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        exportButton
        onExport={() => alert("Export functionality would go here")}
        refreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/courses"] })}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-28 bg-gray-100"></CardHeader>
              <CardContent className="py-4">
                <div className="h-4 bg-gray-100 rounded mb-2"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
              </CardContent>
              <CardFooter className="h-12 bg-gray-50"></CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No courses found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const enrollmentCount = getEnrollmentCount(course.id);
            const enrollmentPercentage = course.maxStudents
              ? Math.round((enrollmentCount / course.maxStudents) * 100)
              : 0;

            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex justify-between items-start">
                    <CardTitle>{course.name}</CardTitle>
                    <Badge variant="outline" className="bg-primary-light/10 text-primary">
                      {course.department}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <span className="text-sm">{course.code}</span>
                    <span>•</span>
                    <span className="text-sm">{course.credits} Credits</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description || "No description available for this course."}
                  </p>
                  <div className="flex items-center mt-4">
                    {course.instructor ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary-light/10 text-primary">
                            {course.instructor.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-2">
                          <p className="text-xs font-medium">{course.instructor}</p>
                          <p className="text-xs text-muted-foreground">Instructor</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">No instructor assigned</div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-muted flex justify-between items-center">
                    <div>
                      <span className="text-xs font-medium">Program:</span>
                      <span className="text-xs text-muted-foreground ml-1">{getProgramName(course.programId)}</span>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          course.status === "active" && "bg-green-100 text-green-800",
                          course.status === "inactive" && "bg-gray-100 text-gray-800",
                          course.status === "pending" && "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 flex justify-between items-center">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <User className="h-3.5 w-3.5 mr-1" />
                    <div className="flex flex-col">
                      <span>{enrollmentCount} {course.maxStudents ? `/ ${course.maxStudents}` : ""} students</span>
                      {course.maxStudents && (
                        <Progress
                          value={enrollmentPercentage}
                          className="h-1 w-24 mt-1"
                          indicatorClassName={
                            enrollmentPercentage >= 90 ? "bg-red-500" :
                            enrollmentPercentage >= 70 ? "bg-yellow-500" :
                            "bg-green-500"
                          }
                        />
                      )}
                    </div>
                  </div>
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
                      <DropdownMenuItem onClick={() => alert(`View course ${course.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Course Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              {selectedCourse
                ? "Update course information in the form below"
                : "Fill in the course details to add a new record"}
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            initialValues={selectedCourse}
            onSubmit={handleFormSubmit}
            isSubmitting={createCourse.isPending || updateCourse.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Campus Image */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Classroom Environment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <img 
            src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="University classroom" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Modern lecture hall" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Study group session" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
            alt="Computer lab" 
            className="rounded-lg shadow-sm h-48 w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Courses;
