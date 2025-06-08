import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  MessageCircle,
  Clock,
  MapPin
} from "lucide-react";

interface Teacher {
  id: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  specialty?: string;
  subjects: string[];
  nextLesson?: {
    subject: string;
    date: string;
    time: string;
    room: string;
  };
  totalLessons: number;
  isClassTeacher: boolean;
}

export default function StudentTeachers() {
  const { data: teachers, isLoading } = useQuery<{ teachers: Teacher[] }>({
    queryKey: ['/api/student/teachers'],
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

  const classTeacher = teachers?.teachers?.find(t => t.isClassTeacher);
  const subjectTeachers = teachers?.teachers?.filter(t => !t.isClassTeacher) || [];

  return (
    <div className="space-y-6">
      {/* Header - Admin Style */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mijn Docenten
            </h1>
            <p className="text-gray-600">
              Overzicht van alle docenten die je les geven
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <MessageCircle className="h-4 w-4 mr-2 text-[#1e40af]" />
              Contact Docenten
            </Button>
          </div>
        </div>
      </div>

      {/* Class Teacher - Admin Style */}
      {classTeacher && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#1e40af] mb-4">Klassenleraar</h2>
          <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  {classTeacher.photoUrl ? (
                    <AvatarImage src={classTeacher.photoUrl} alt={`${classTeacher.firstName} ${classTeacher.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-[#1e40af] text-white text-lg">
                      {classTeacher.firstName[0]}{classTeacher.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {classTeacher.firstName} {classTeacher.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{classTeacher.teacherId}</p>
                      {classTeacher.specialty && (
                        <p className="text-sm text-[#1e40af] font-medium">{classTeacher.specialty}</p>
                      )}
                    </div>
                    <Badge className="bg-[#eff6ff] text-[#1e40af] border-[#1e40af]">
                      Klassenleraar
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {classTeacher.email}
                    </div>
                    {classTeacher.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {classTeacher.phone}
                      </div>
                    )}
                  </div>

                  {classTeacher.subjects.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vakken:</p>
                      <div className="flex flex-wrap gap-2">
                        {classTeacher.subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="border-[#e5e7eb]">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {classTeacher.nextLesson && (
                    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 text-[#1e40af] mr-2" />
                        <span className="text-sm font-medium text-gray-700">Volgende les</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{classTeacher.nextLesson.subject}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span>{classTeacher.nextLesson.date}</span>
                          <span>{classTeacher.nextLesson.time}</span>
                          <span>{classTeacher.nextLesson.room}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 mt-4">
                    <Button variant="outline" size="sm" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                      <MessageCircle className="h-3 w-3 mr-1 text-[#1e40af]" />
                      Bericht sturen
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                      <Calendar className="h-3 w-3 mr-1 text-[#1e40af]" />
                      Rooster bekijken
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Teachers - Admin Style */}
      <div>
        <h2 className="text-lg font-semibold text-[#1e40af] mb-4">Vakdocenten</h2>
        {subjectTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectTeachers.map((teacher) => (
              <Card key={teacher.id} className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-[#e5e7eb] pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      {teacher.photoUrl ? (
                        <AvatarImage src={teacher.photoUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
                      ) : (
                        <AvatarFallback className="bg-[#1e40af] text-white">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {teacher.firstName} {teacher.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{teacher.teacherId}</p>
                      {teacher.specialty && (
                        <p className="text-xs text-[#1e40af] font-medium">{teacher.specialty}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>

                    {/* Subjects */}
                    {teacher.subjects.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Vakken:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.slice(0, 3).map((subject, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-[#e5e7eb]">
                              {subject}
                            </Badge>
                          ))}
                          {teacher.subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs border-[#e5e7eb]">
                              +{teacher.subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Totaal lessen:</span>
                        <span className="font-medium text-gray-900">{teacher.totalLessons}</span>
                      </div>
                    </div>

                    {/* Next Lesson */}
                    {teacher.nextLesson && (
                      <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                        <div className="flex items-center mb-2">
                          <Clock className="h-3 w-3 text-[#1e40af] mr-2" />
                          <span className="text-xs font-medium text-gray-700">Volgende les</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="font-medium">{teacher.nextLesson.subject}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span>{teacher.nextLesson.date}</span>
                            <span>•</span>
                            <span>{teacher.nextLesson.time}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{teacher.nextLesson.room}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                        <MessageCircle className="h-3 w-3 mr-1 text-[#1e40af]" />
                        Contact
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                        <BookOpen className="h-3 w-3 mr-1 text-[#1e40af]" />
                        Vakken
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-[#e5e7eb] shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakdocenten gevonden</h3>
                <p className="text-gray-500 mb-6">
                  Er zijn nog geen vakdocenten toegewezen voor dit schooljaar.
                </p>
                <Button className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white">
                  Contact Administratie
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}