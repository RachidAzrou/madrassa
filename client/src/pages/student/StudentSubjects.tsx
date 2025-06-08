import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  User,
  Clock,
  Calendar,
  FileText,
  ChevronRight,
  GraduationCap,
  Target
} from "lucide-react";
import { Link } from "wouter";

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  credits: number;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
  };
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }[];
  currentGrade?: string;
  attendance?: number;
  nextLesson?: {
    date: string;
    time: string;
    room: string;
  };
}

export default function StudentSubjects() {
  const { data: subjects, isLoading } = useQuery<{ subjects: Subject[] }>({
    queryKey: ['/api/student/subjects'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-[#f7f9fc] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mijn Vakken
            </h1>
            <p className="text-gray-600 text-lg">
              Ontdek alle vakken die je dit schooljaar volgt
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-sm">
              <div className="text-sm font-medium">{subjects?.subjects?.length || 0} Vakken</div>
              <div className="text-xs opacity-90">Actief dit jaar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Totaal Vakken</CardTitle>
            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{subjects?.subjects?.length || 0}</div>
            <p className="text-xs text-blue-600 mt-1">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Gem. Cijfer</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <GraduationCap className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">
              {subjects?.subjects?.length ? 
                (subjects.subjects
                  .filter(s => s.currentGrade)
                  .reduce((sum, s) => sum + parseFloat(s.currentGrade!), 0) / 
                 subjects.subjects.filter(s => s.currentGrade).length
                ).toFixed(1) : 'N/A'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Alle vakken
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Aanwezigheid</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Target className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">
              {subjects?.subjects?.length ? 
                Math.round(subjects.subjects
                  .filter(s => s.attendance !== undefined)
                  .reduce((sum, s) => sum + s.attendance!, 0) / 
                 subjects.subjects.filter(s => s.attendance !== undefined).length
                ) : 0
              }%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Gemiddeld
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Credits</CardTitle>
            <div className="p-2 bg-[#fdf2f8] rounded-lg">
              <FileText className="h-4 w-4 text-[#be185d]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#be185d]">
              {subjects?.subjects?.reduce((sum, s) => sum + s.credits, 0) || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Grid - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects?.subjects?.length ? (
          subjects.subjects.map((subject) => (
            <Card key={subject.id} className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-[#e5e7eb] pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-[#1e40af] truncate">
                      {subject.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{subject.code}</p>
                  </div>
                  <Badge className="bg-[#eff6ff] text-[#1e40af] border-[#1e40af] ml-2">
                    {subject.credits} EC
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Teacher Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      {subject.teacher.photoUrl ? (
                        <AvatarImage src={subject.teacher.photoUrl} alt={`${subject.teacher.firstName} ${subject.teacher.lastName}`} />
                      ) : (
                        <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                          {subject.teacher.firstName[0]}{subject.teacher.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {subject.teacher.firstName} {subject.teacher.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {subject.teacher.email}
                      </p>
                    </div>
                  </div>

                  {/* Current Grade */}
                  {subject.currentGrade && (
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Huidige cijfer</span>
                      </div>
                      <Badge className={`${
                        parseFloat(subject.currentGrade) >= 8 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]' :
                        parseFloat(subject.currentGrade) >= 6 ? 'bg-[#fef3c7] text-[#d97706] border-[#d97706]' :
                        'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]'
                      }`}>
                        {subject.currentGrade}
                      </Badge>
                    </div>
                  )}

                  {/* Attendance */}
                  {subject.attendance !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Aanwezigheid</span>
                      </div>
                      <Badge className={`${
                        subject.attendance >= 90 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]' :
                        subject.attendance >= 75 ? 'bg-[#fef3c7] text-[#d97706] border-[#d97706]' :
                        'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]'
                      }`}>
                        {subject.attendance}%
                      </Badge>
                    </div>
                  )}

                  {/* Next Lesson */}
                  {subject.nextLesson && (
                    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Volgende les</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{subject.nextLesson.date} • {subject.nextLesson.time}</p>
                        <p className="text-xs text-gray-500">{subject.nextLesson.room}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/student/subjects/${subject.id}/grades`}>
                      <Button variant="outline" size="sm" className="flex-1 border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                        <GraduationCap className="h-3 w-3 mr-1 text-[#1e40af]" />
                        Cijfers
                      </Button>
                    </Link>
                    <Link href={`/student/subjects/${subject.id}/schedule`}>
                      <Button variant="outline" size="sm" className="flex-1 border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                        <Calendar className="h-3 w-3 mr-1 text-[#1e40af]" />
                        Rooster
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="bg-white border border-[#e5e7eb] shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakken gevonden</h3>
                  <p className="text-gray-500 mb-6">
                    Er zijn nog geen vakken toegewezen voor dit schooljaar.
                  </p>
                  <Button className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white">
                    Contact Administratie
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}