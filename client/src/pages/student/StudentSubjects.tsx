import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, Clock, TrendingUp, MapPin, Calendar } from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
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
    queryKey: ["/api/student/subjects"],
    retry: false,
  });

  if (isLoading) {
    return (
      <UnifiedLayout userRole="student">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e40af]"></div>
        </div>
      </UnifiedLayout>
    );
  }

  const nextLesson = subjects?.subjects?.find(s => s.nextLesson);

  return (
    <UnifiedLayout userRole="student">
      <div className="space-y-6">
        {/* Hero Header - Admin Style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#1e40af] p-8 rounded-lg">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-3">
                  <BookOpen className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-3xl font-bold text-white">Mijn Vakken</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Bekijk uw vakken, docenten en roosters
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{subjects?.subjects?.length || 0}</div>
                    <div className="text-sm text-blue-100">Vakken</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {subjects?.subjects?.filter(s => s.nextLesson).length || 0}
                    </div>
                    <div className="text-sm text-blue-100">Volgende lessen</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Quick Stats - Admin Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Subjects */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Aantal Vakken</CardTitle>
                <div className="text-2xl font-bold text-[#1e40af] mt-1">{subjects?.subjects?.length || 0}</div>
              </div>
              <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-[#1e40af]" />
              </div>
            </CardHeader>
          </Card>

          {/* Average Grade */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Gemiddeld Cijfer</CardTitle>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {subjects?.subjects?.filter(s => s.currentGrade).length > 0 
                    ? (subjects.subjects
                        .filter(s => s.currentGrade)
                        .reduce((acc, s) => acc + parseFloat(s.currentGrade!), 0) / 
                       subjects.subjects.filter(s => s.currentGrade).length).toFixed(1)
                    : '-'
                  }
                </div>
              </div>
              <div className="p-2 bg-green-600/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Next Lesson */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Volgende Les</CardTitle>
                <div className="text-lg font-bold text-orange-600 mt-1">
                  {nextLesson?.nextLesson?.time || 'Geen'}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {nextLesson ? nextLesson.name : 'Vandaag'}
                </p>
              </div>
              <div className="p-2 bg-orange-600/10 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Subjects Grid - Admin Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {subjects?.subjects?.map((subject) => (
            <Card key={subject.id} className="shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{subject.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-white/30">
                      {subject.code}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {subject.currentGrade && (
                      <div className="text-2xl font-bold text-white">{subject.currentGrade}</div>
                    )}
                    {subject.attendance && (
                      <div className="text-sm text-blue-100">{subject.attendance}% aanwezigheid</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Teacher Info */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {subject.teacher.firstName} {subject.teacher.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{subject.teacher.email}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {subject.description && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">{subject.description}</p>
                    </div>
                  )}

                  {/* Schedule */}
                  {subject.schedule && subject.schedule.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                        Rooster
                      </h4>
                      <div className="space-y-2">
                        {subject.schedule.map((schedule, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">{schedule.day}</span>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                              <MapPin className="h-3 w-3" />
                              <span>{schedule.room}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Lesson */}
                  {subject.nextLesson && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">Volgende les</p>
                          <p className="text-sm text-green-600">
                            {subject.nextLesson.date} om {subject.nextLesson.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {subject.nextLesson.room}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-2 text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakken gevonden</h3>
              <p className="text-gray-600">Er zijn momenteel geen vakken toegewezen aan uw account.</p>
            </div>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}