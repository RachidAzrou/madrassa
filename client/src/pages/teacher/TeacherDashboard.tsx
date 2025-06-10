import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumHeader } from "@/components/layout/premium-header";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import {
  Users,
  BookText,
  Calendar,
  ClipboardCheck,
  Clock,
  Bell,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  BookMarked,
  School,
  BarChart3,
  Award,
  Target,
  Activity,
  Percent
} from "lucide-react";
import { Link } from "wouter";

interface TeacherStats {
  myClasses: number;
  totalStudents: number;
  todayLessons: number;
  pendingGrades: number;
  weeklyHours: number;
  attendance: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Data fetching
  const { data: teacherStats } = useQuery<TeacherStats>({
    queryKey: ['/api/teacher/stats'],
    staleTime: 300000,
  });

  const { data: upcomingLessons } = useQuery<any>({
    queryKey: ['/api/teacher/upcoming-lessons'],
    staleTime: 60000,
  });

  const { data: myClasses } = useQuery<any>({
    queryKey: ['/api/teacher/my-classes'],
    staleTime: 300000,
  });

  const { data: recentActivity } = useQuery<any>({
    queryKey: ['/api/teacher/recent-activity'],
    staleTime: 60000,
  });

  const defaultStats: TeacherStats = {
    myClasses: 3,
    totalStudents: 75,
    todayLessons: 4,
    pendingGrades: 12,
    weeklyHours: 24,
    attendance: 92
  };

  const stats = teacherStats || defaultStats;
  const todayLessons = upcomingLessons?.lessons || [];
  const activities = recentActivity?.activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <Percent className="h-4 w-4 text-blue-600" />;
      case 'attendance':
        return <ClipboardCheck className="h-4 w-4 text-green-600" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'grade':
        return 'bg-blue-50 border-blue-200';
      case 'attendance':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <UnifiedLayout userRole="teacher">
      <div className="space-y-6">
        <PremiumHeader 
          title="Docent Dashboard" 
          icon={School}
          description={`Welkom terug, ${user?.firstName || 'Docent'}! Hier is uw overzicht voor vandaag.`}
          breadcrumbs={{
            parent: "Docent",
            current: "Dashboard"
          }}
        />
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="premium-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Mijn Klassen</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.myClasses}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <School className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Totaal Studenten</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalStudents}</p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Lessen Vandaag</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.todayLessons}</p>
                </div>
                <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BookText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Te Beoordelen</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.pendingGrades}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-600 text-sm font-medium">Uren/Week</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.weeklyHours}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-sm font-medium">Aanwezigheid</p>
                  <p className="text-2xl font-bold text-teal-900">{stats.attendance}%</p>
                </div>
                <div className="h-12 w-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-[#1e40af]" />
                Vandaag's Rooster
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayLessons && todayLessons.length > 0 ? (
                <div className="space-y-3">
                  {todayLessons.map((lesson: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-[#1e40af] rounded-lg flex items-center justify-center">
                          <BookText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{lesson.subject || 'Arabisch'}</h4>
                          <p className="text-sm text-gray-500">{lesson.class || 'Klas 3A'} • {lesson.time || '09:00 - 10:30'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {lesson.status || 'Gepland'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Geen lessen gepland</h3>
                  <p className="text-gray-500">Er zijn vandaag geen lessen ingepland.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Activity className="h-5 w-5 mr-2 text-[#1e40af]" />
                Snelle Acties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/teacher/students">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Bekijk Studenten
                  </Button>
                </Link>
                <Link href="/teacher/classes">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <School className="h-4 w-4 mr-2" />
                    Mijn Klassen
                  </Button>
                </Link>
                <Link href="/teacher/reports">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Rapporten
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Cijfers Invoeren
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Berichten
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
}