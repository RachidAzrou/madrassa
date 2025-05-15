import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useState } from "react";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  programId: number;
  yearLevel: number;
  status: string;
  enrollmentDate: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

export default function RecentStudents() {
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["/api/programs"],
  });

  // Get program name by ID
  const getProgramName = (programId: number): string => {
    const program = programs.find((p: Program) => p.id === programId);
    return program ? program.name : "Onbekend Programma";
  };

  // Sort students by enrollment date (newest first) and take first 4
  const recentStudents = [...students]
    .sort((a: Student, b: Student) => {
      return new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime();
    })
    .slice(0, 4);

  // Calculate days since enrollment
  const getDaysSinceEnrollment = (enrollmentDate: string): string => {
    const today = new Date();
    const enrollmentDay = new Date(enrollmentDate);
    const diffTime = Math.abs(today.getTime() - enrollmentDay.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Vandaag";
    } else if (diffDays === 1) {
      return "1 dag geleden";
    } else if (diffDays < 7) {
      return `${diffDays} dagen geleden`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weken'} geleden`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'maand' : 'maanden'} geleden`;
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Ingeschreven Studenten</CardTitle>
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link href="/students">Bekijk alle studenten</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingStudents || isLoadingPrograms ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen studenten gevonden. Voeg studenten toe om ze hier te zien.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentStudents.map((student: Student) => (
              <li key={student.id} className="py-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {student.firstName[0]}{student.lastName[0]}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {getProgramName(student.programId)} - Jaar {student.yearLevel}
                  </p>
                </div>
                <div className="ml-auto text-xs text-gray-500">
                  Ingeschreven {getDaysSinceEnrollment(student.enrollmentDate)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
