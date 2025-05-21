import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentWithUser } from "@shared/schema";

interface RecentStudentsProps {
  className?: string;
  limit?: number;
}

export default function RecentStudents({ className, limit = 5 }: RecentStudentsProps) {
  const { data: students, isLoading } = useQuery<StudentWithUser[]>({
    queryKey: ["/api/students"],
  });

  const recentStudents = students?.slice(0, limit);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recently Enrolled Students</CardTitle>
          <Link href="/students">
            <a className="text-primary text-sm hover:underline">View All</a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Program
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {isLoading
                ? Array(limit)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="ml-3">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32 mt-1" />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <Skeleton className="h-8 w-16 inline-block" />
                        </td>
                      </tr>
                    ))
                : recentStudents?.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(student.user.firstName, student.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">
                              {student.user.firstName} {student.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {student.studentId}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {student.program.name}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
