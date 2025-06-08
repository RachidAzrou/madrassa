import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  date: string;
  subject: string;
  teacher: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  time: string;
  room: string;
}

interface AttendanceStats {
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  weeklyTrend: number;
}

interface MonthlyAttendance {
  month: string;
  attendanceRate: number;
  totalLessons: number;
}

export default function StudentAttendance() {
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: AttendanceStats }>({
    queryKey: ['/api/student/attendance/stats'],
    retry: false,
  });

  const { data: records } = useQuery<{ records: AttendanceRecord[] }>({
    queryKey: ['/api/student/attendance/records'],
    retry: false,
  });

  const { data: monthly } = useQuery<{ monthly: MonthlyAttendance[] }>({
    queryKey: ['/api/student/attendance/monthly'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="p-6 bg-[#f7f9fc] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const attendanceStats = stats?.stats || {
    totalLessons: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0,
    weeklyTrend: 0
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-[#16a34a]" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-[#dc2626]" />;
      case 'late':
        return <Clock className="h-4 w-4 text-[#d97706]" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-[#7c3aed]" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]">Aanwezig</Badge>;
      case 'absent':
        return <Badge className="bg-[#fef2f2] text-[#dc2626] border-[#dc2626]">Afwezig</Badge>;
      case 'late':
        return <Badge className="bg-[#fef3c7] text-[#d97706] border-[#d97706]">Te laat</Badge>;
      case 'excused':
        return <Badge className="bg-[#f3e8ff] text-[#7c3aed] border-[#7c3aed]">Verontschuldigd</Badge>;
      default:
        return <Badge variant="secondary">Onbekend</Badge>;
    }
  };

  return (
    <div className="p-6 bg-[#f7f9fc] min-h-screen">
      {/* Header - Admin Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e40af] mb-2">
              Aanwezigheid
            </h1>
            <p className="text-gray-600">
              Overzicht van je aanwezigheid dit schooljaar
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <Calendar className="h-4 w-4 mr-2 text-[#1e40af]" />
              Mijn Rooster
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Percentage</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <Target className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-[#1e40af]">{attendanceStats.attendanceRate}%</div>
              {attendanceStats.weeklyTrend !== 0 && (
                <div className={`flex items-center ${attendanceStats.weeklyTrend > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {attendanceStats.weeklyTrend > 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  <span className="text-xs ml-1">{Math.abs(attendanceStats.weeklyTrend)}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Aanwezig</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <CheckCircle className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">{attendanceStats.presentCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              van {attendanceStats.totalLessons} lessen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Afwezig</CardTitle>
            <div className="p-2 bg-[#fef2f2] rounded-lg">
              <XCircle className="h-4 w-4 text-[#dc2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#dc2626]">{attendanceStats.absentCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              lessen gemist
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Te Laat</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Clock className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">{attendanceStats.lateCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              keer te laat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2 bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <TrendingUp className="h-5 w-5 mr-2 text-[#1e40af]" />
              Maandelijks Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {monthly?.monthly?.length ? (
              <div className="space-y-4">
                {monthly.monthly.map((month, index) => (
                  <div key={index} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{month.month}</h3>
                      <Badge className={`${
                        month.attendanceRate >= 90 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]' :
                        month.attendanceRate >= 75 ? 'bg-[#fef3c7] text-[#d97706] border-[#d97706]' :
                        'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]'
                      }`}>
                        {month.attendanceRate}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          month.attendanceRate >= 90 ? 'bg-[#16a34a]' :
                          month.attendanceRate >= 75 ? 'bg-[#d97706]' :
                          'bg-[#dc2626]'
                        }`}
                        style={{ width: `${month.attendanceRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {month.totalLessons} lessen
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen maandelijkse gegevens beschikbaar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Target className="h-5 w-5 mr-2 text-[#1e40af]" />
              Samenvatting
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Doelstelling</span>
                  <span className="text-sm text-[#1e40af] font-semibold">95%</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#1e40af]"
                      style={{ width: `${Math.min(attendanceStats.attendanceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Huidige: {attendanceStats.attendanceRate}%
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#16a34a] mr-2" />
                    <span className="text-sm text-gray-700">Aanwezig</span>
                  </div>
                  <span className="text-sm font-semibold">{attendanceStats.presentCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-[#dc2626] mr-2" />
                    <span className="text-sm text-gray-700">Afwezig</span>
                  </div>
                  <span className="text-sm font-semibold">{attendanceStats.absentCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-[#d97706] mr-2" />
                    <span className="text-sm text-gray-700">Te laat</span>
                  </div>
                  <span className="text-sm font-semibold">{attendanceStats.lateCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-[#7c3aed] mr-2" />
                    <span className="text-sm text-gray-700">Verontschuldigd</span>
                  </div>
                  <span className="text-sm font-semibold">{attendanceStats.excusedCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records - Admin Style */}
      <div className="mt-6">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <BookOpen className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Aanwezigheid
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {records?.records?.length ? (
              <div className="space-y-3">
                {records.records.slice(0, 10).map((record) => (
                  <div key={record.id} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(record.status)}
                          <div>
                            <p className="font-medium text-gray-900">{record.subject}</p>
                            <p className="text-sm text-gray-600">{record.teacher}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{record.date}</span>
                          <span>{record.time}</span>
                          <span>{record.room}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen aanwezigheidsgegevens beschikbaar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}