import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Users,
  MessageCircle,
  Award,
  Clock,
  ChevronRight,
  Star,
  Target,
  BookMarked,
  GraduationCap
} from "lucide-react";

export default function ModernStudentDashboard() {
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    staleTime: 60000,
  });

  const { data: academicProgress } = useQuery<any>({
    queryKey: ['/api/student/academic-progress'],
    staleTime: 30000,
  });

  const { data: upcomingAssignments } = useQuery<any[]>({
    queryKey: ['/api/student/assignments/upcoming'],
    staleTime: 30000,
  });

  const { data: recentGrades } = useQuery<any[]>({
    queryKey: ['/api/student/grades/recent'],
    staleTime: 30000,
  });

  const { data: attendanceStats } = useQuery<any>({
    queryKey: ['/api/student/attendance/stats'],
    staleTime: 30000,
  });

  const { data: announcements } = useQuery<any[]>({
    queryKey: ['/api/announcements/student'],
    staleTime: 30000,
  });

  // Mock data for demonstration
  const mockProgress = {
    overallGrade: 8.2,
    attendanceRate: 94,
    completedAssignments: 23,
    totalAssignments: 27,
    currentSemester: "Semester 1",
    academicYear: "2024-2025"
  };

  const mockSubjects = [
    { name: "Arabisch", grade: 8.5, trend: "up", color: "bg-green-500" },
    { name: "Islamkunde", grade: 8.8, trend: "up", color: "bg-blue-500" },
    { name: "Koran", grade: 9.1, trend: "up", color: "bg-purple-500" },
    { name: "Hadith", grade: 7.9, trend: "stable", color: "bg-orange-500" }
  ];

  const mockAssignments = [
    { title: "Arabische grammatica oefening", subject: "Arabisch", dueDate: "2024-01-15", priority: "high" },
    { title: "Koran memorisatie - Surah Al-Mulk", subject: "Koran", dueDate: "2024-01-18", priority: "medium" },
    { title: "Hadith analyse rapport", subject: "Hadith", dueDate: "2024-01-20", priority: "low" }
  ];

  const mockAnnouncements = [
    { title: "Nieuw studiejaar informatie", content: "Belangrijke updates voor het nieuwe semester", time: "2 uur geleden", type: "info" },
    { title: "Examens schema beschikbaar", content: "Het schema voor de komende examens is nu beschikbaar", time: "1 dag geleden", type: "important" }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welkom terug, {profile?.firstName || 'Student'}!
          </h1>
          <p className="text-lg text-slate-600">
            Hier is je overzicht voor vandaag - {new Date().toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200">
            <Calendar className="mr-2 h-5 w-5" />
            Bekijk rooster
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg shadow-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Gemiddeld cijfer</p>
                <p className="text-3xl font-bold text-blue-900">{mockProgress.overallGrade}</p>
                <p className="text-xs text-blue-600 mt-1">Dit semester</p>
              </div>
              <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg shadow-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Aanwezigheid</p>
                <p className="text-3xl font-bold text-green-900">{mockProgress.attendanceRate}%</p>
                <p className="text-xs text-green-600 mt-1">Deze maand</p>
              </div>
              <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg shadow-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Opdrachten</p>
                <p className="text-3xl font-bold text-purple-900">
                  {mockProgress.completedAssignments}/{mockProgress.totalAssignments}
                </p>
                <p className="text-xs text-purple-600 mt-1">Voltooid</p>
              </div>
              <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg shadow-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Actieve vakken</p>
                <p className="text-3xl font-bold text-orange-900">{mockSubjects.length}</p>
                <p className="text-xs text-orange-600 mt-1">Dit semester</p>
              </div>
              <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Academic Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subject Performance */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Vakprestaties</CardTitle>
                  <CardDescription className="text-slate-600">Je voortgang per vak deze periode</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Bekijk details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSubjects.map((subject, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${subject.color}`}></div>
                      <span className="font-medium text-slate-900">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{subject.grade}</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <Progress value={(subject.grade / 10) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Aankomende opdrachten</CardTitle>
                  <CardDescription className="text-slate-600">Deadlines die eraan komen</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Alle opdrachten
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAssignments.map((assignment, index) => (
                <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 mb-1">{assignment.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{assignment.subject}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          Deadline: {new Date(assignment.dueDate).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={assignment.priority === 'high' ? 'destructive' : assignment.priority === 'medium' ? 'default' : 'secondary'}
                      className="ml-3"
                    >
                      {assignment.priority === 'high' ? 'Urgent' : assignment.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Recent Announcements */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Mededelingen</CardTitle>
              <CardDescription className="text-slate-600">Laatste nieuws van school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAnnouncements.map((announcement, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900 text-sm mb-1">{announcement.title}</h4>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{announcement.content}</p>
                  <span className="text-xs text-slate-400">{announcement.time}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700">
                <MessageCircle className="mr-2 h-4 w-4" />
                Alle mededelingen
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Snelle acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <BookMarked className="mr-3 h-4 w-4 text-slate-600" />
                Bekijk cijfers
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Calendar className="mr-3 h-4 w-4 text-slate-600" />
                Rooster bekijken
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <MessageCircle className="mr-3 h-4 w-4 text-slate-600" />
                Berichten
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Users className="mr-3 h-4 w-4 text-slate-600" />
                Mijn klas
              </Button>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Voortgang overzicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Semester voortgang</span>
                  <span className="text-sm font-bold text-slate-900">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Behaalde punten</span>
                  <span className="text-sm font-medium">847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Beschikbare punten</span>
                  <span className="text-sm font-medium">1200</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}