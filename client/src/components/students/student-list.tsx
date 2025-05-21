import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentDetail } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentListProps {
  students: StudentDetail[];
  isLoading: boolean;
}

export function StudentList({ students, isLoading }: StudentListProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [viewStudent, setViewStudent] = useState<StudentDetail | null>(null);
  
  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
  };
  
  const toggleSelectStudent = (id: number) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleSelectStudent(student.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-muted">
                            {getInitials(student.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.user.name}</p>
                          <p className="text-xs text-muted-foreground">{student.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{student.studentId}</TableCell>
                    <TableCell className="text-sm">{student.program?.name || "No Program"}</TableCell>
                    <TableCell className="text-sm">Year {student.year}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {students.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{students.length}</span> of{" "}
              <span className="font-medium">{students.length}</span> results
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Student Detail Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewStudent && (
            <div className="space-y-6">
              <div className="flex items-center">
                <Avatar className="h-20 w-20 mr-4">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {getInitials(viewStudent.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{viewStudent.user.name}</h2>
                  <p className="text-muted-foreground">{viewStudent.studentId}</p>
                  <Badge variant={getStatusBadgeVariant(viewStudent.status)} className="mt-1">
                    {viewStudent.status.charAt(0).toUpperCase() + viewStudent.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{viewStudent.user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{viewStudent.user.phone || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Program</h3>
                  <p>{viewStudent.program?.name || "Not assigned"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Year</h3>
                  <p>Year {viewStudent.year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                  <p>{viewStudent.gender || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Enrollment Date</h3>
                  <p>{new Date(viewStudent.enrollmentDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p>{viewStudent.address || "Not provided"}</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Edit Profile</Button>
                <Button>View Enrollments</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
