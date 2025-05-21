import { useState } from "react";
import { CourseDetail } from "@/lib/types";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";

interface CourseListProps {
  courses: CourseDetail[];
  isLoading: boolean;
}

export function CourseList({ courses, isLoading }: CourseListProps) {
  const [viewCourse, setViewCourse] = useState<CourseDetail | null>(null);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-4 w-5/6 mb-3" />
              <div className="flex items-center mt-4">
                <Skeleton className="h-8 w-8 rounded-full mr-2" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-4 w-24" />
              <div className="flex ml-auto space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <>
      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-6">There are no courses matching your criteria.</p>
          <Button>Add Course</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.code} • {course.credits} Credits</CardDescription>
                  </div>
                  <Badge className="bg-primary-light/10 text-primary text-xs">
                    {course.department?.name || "No Department"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                  {course.description || "No description available."}
                </p>
                
                <div className="mt-4 flex items-center">
                  {course.instructor ? (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(course.instructor.name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-xs font-medium text-foreground">{course.instructor.name}</p>
                        <p className="text-xs text-muted-foreground">Instructor</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No instructor assigned</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div className="flex items-center text-muted-foreground text-xs">
                  <Users className="mr-1 h-3.5 w-3.5" />
                  <span>Enrollment: 0/{course.capacity}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setViewCourse(course)}>View</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Course Detail Dialog */}
      <Dialog open={!!viewCourse} onOpenChange={(open) => !open && setViewCourse(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewCourse && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{viewCourse.name}</h2>
                <div className="flex items-center mt-1">
                  <Badge className="mr-2">{viewCourse.code}</Badge>
                  <span className="text-sm text-muted-foreground">{viewCourse.credits} Credits</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{viewCourse.description || "No description available."}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                  <p>{viewCourse.department?.name || "Not assigned"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                  <p>{viewCourse.capacity} students</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Instructor</h3>
                  <p>{viewCourse.instructor?.name || "Not assigned"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Current Enrollment</h3>
                  <p>0 students</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Enrolled Students</h3>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">No students enrolled yet</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Edit Course</Button>
                <Button>Manage Enrollments</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
