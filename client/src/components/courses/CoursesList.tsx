import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CourseWithDetails } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookPlus, Filter, Download, Eye, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import CourseForm from "./CourseForm";

export default function CoursesList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  const { data: courses, isLoading } = useQuery<CourseWithDetails[]>({
    queryKey: ["/api/courses"],
  });

  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Filter courses based on search query and program filter
  const filteredCourses = courses?.filter((course) => {
    const searchMatch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const programMatch = programFilter ? (course.programId?.toString() === programFilter) : true;
    return searchMatch && programMatch;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getEnrollmentPercent = (enrolled: number, capacity: number) => {
    return Math.min(100, Math.round((enrolled / capacity) * 100));
  };

  const getEnrollmentColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <>
      {showAddForm ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Course</h2>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
            <CourseForm onSuccess={() => setShowAddForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Campus image header */}
          <div className="relative rounded-xl overflow-hidden h-48 md:h-64 mb-6">
            <img
              src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500"
              alt="University classroom"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center">
              <div className="px-6 md:px-10">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Course Management</h1>
                <p className="text-white/80 max-w-xl">
                  Manage your institution's course catalog, enrollments, and schedules in one place.
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search courses..."
                  className="pl-10 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </div>
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {programs?.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <BookPlus className="mr-2 h-4 w-4" />
              <span>Add New Course</span>
            </Button>
          </div>

          {/* Course Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <Skeleton className="h-6 w-40 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-full mt-3" />
                      <div className="mt-4 flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredCourses?.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">
                      No courses found. Adjust your search criteria or add a new course.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses?.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{course.name}</h3>
                              <p className="text-muted-foreground text-sm mt-1">
                                {course.code} • {course.credits} Credits
                              </p>
                            </div>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              {course.program?.name || "No Program"}
                            </Badge>
                          </div>
                          <p className="mt-3 text-sm">
                            {course.description?.substring(0, 100)}
                            {course.description && course.description.length > 100 ? "..." : ""}
                          </p>
                          {course.instructor ? (
                            <div className="mt-4 flex items-center">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(course.instructor.firstName + " " + course.instructor.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-2">
                                <p className="text-xs font-medium">
                                  {course.instructor.firstName} {course.instructor.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {course.instructor.role === "instructor" ? "Instructor" : course.instructor.role}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <Badge variant="outline">No Instructor Assigned</Badge>
                            </div>
                          )}
                          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Enrollment: {course.enrolled}/{course.capacity}
                              </p>
                              <Progress 
                                value={getEnrollmentPercent(course.enrolled, course.capacity)}
                                className="h-1.5 w-32"
                                indicatorClassName={getEnrollmentColor(getEnrollmentPercent(course.enrolled, course.capacity))}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
