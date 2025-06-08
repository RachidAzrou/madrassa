import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";

interface ClassInfo {
  id: number;
  name: string;
  academicYear: string;
  totalStudents: number;
  classTeacher: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface Classmate {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
}

export default function StudentClass() {
  const { user } = useAuth();

  const { data: classInfo, isLoading: classLoading } = useQuery<{ class: ClassInfo }>({
    queryKey: ['/api/student/class-info'],
    retry: false,
  });

  const { data: classmates } = useQuery<{ classmates: Classmate[] }>({
    queryKey: ['/api/student/classmates'],
    retry: false,
  });

  if (classLoading) {
    return (
      <div className="p-6 bg-[#f7f9fc] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const myClass = classInfo?.class;

  return (
    <div className="p-6 bg-[#f7f9fc] min-h-screen">
      {/* Header - Admin Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e40af] mb-2">
              Mijn Klas
            </h1>
            <p className="text-gray-600">
              Informatie over je klas en klasgenoten
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <MessageCircle className="h-4 w-4 mr-2 text-[#1e40af]" />
              Contact Klasgenoten
            </Button>
          </div>
        </div>
      </div>

      {/* Class Information - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Class Details */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Users className="h-5 w-5 mr-2 text-[#1e40af]" />
              Klasinformatie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {myClass ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{myClass.name}</h3>
                    <Badge className="bg-[#eff6ff] text-[#1e40af] border-[#1e40af]">
                      {myClass.academicYear}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {myClass.totalStudents} studenten
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {myClass.academicYear}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Klassenleraar</h4>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#1e40af] text-white">
                          {myClass.classTeacher.firstName[0]}{myClass.classTeacher.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {myClass.classTeacher.firstName} {myClass.classTeacher.lastName}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {myClass.classTeacher.email}
                          </div>
                          {myClass.classTeacher.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {myClass.classTeacher.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen klasinformatie beschikbaar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <BookOpen className="h-5 w-5 mr-2 text-[#1e40af]" />
              Snelle Acties
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Link href="/student/subjects">
                <Button variant="outline" className="w-full justify-start border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                  <BookOpen className="h-4 w-4 mr-2 text-[#1e40af]" />
                  Mijn Vakken
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/student/attendance">
                <Button variant="outline" className="w-full justify-start border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                  <Calendar className="h-4 w-4 mr-2 text-[#1e40af]" />
                  Aanwezigheid
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/student/teachers">
                <Button variant="outline" className="w-full justify-start border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
                  <User className="h-4 w-4 mr-2 text-[#1e40af]" />
                  Mijn Docenten
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classmates - Admin Style */}
      <Card className="bg-white border border-[#e5e7eb] shadow-sm">
        <CardHeader className="border-b border-[#e5e7eb] pb-4">
          <CardTitle className="flex items-center text-[#1e40af] font-semibold">
            <Users className="h-5 w-5 mr-2 text-[#1e40af]" />
            Klasgenoten
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {classmates?.classmates?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classmates.classmates.map((classmate) => (
                <div key={classmate.id} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb] hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      {classmate.photoUrl ? (
                        <AvatarImage src={classmate.photoUrl} alt={`${classmate.firstName} ${classmate.lastName}`} />
                      ) : (
                        <AvatarFallback className="bg-[#1e40af] text-white">
                          {classmate.firstName[0]}{classmate.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {classmate.firstName} {classmate.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {classmate.studentId}
                      </p>
                      {classmate.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {classmate.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Geen klasgenoten gevonden
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}