import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  Target,
  Download,
  Eye
} from "lucide-react";

interface Grade {
  id: number;
  subject: string;
  subjectCode: string;
  type: string; // 'toets', 'tentamen', 'opdracht', etc.
  description: string;
  grade: string;
  weight: number;
  date: string;
  teacher: string;
}

interface SubjectGrade {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  currentGrade: string;
  grades: Grade[];
  credits: number;
  teacher: string;
}

interface GradeStats {
  overallAverage: number;
  totalCredits: number;
  completedCredits: number;
  trend: number; // percentage change from last period
  passedSubjects: number;
  totalSubjects: number;
}

export default function StudentGrades() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: GradeStats }>({
    queryKey: ['/api/student/grades/stats', selectedPeriod],
    retry: false,
  });

  const { data: subjects } = useQuery<{ subjects: SubjectGrade[] }>({
    queryKey: ['/api/student/grades/subjects', selectedPeriod],
    retry: false,
  });

  const { data: recentGrades } = useQuery<{ grades: Grade[] }>({
    queryKey: ['/api/student/grades/recent'],
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

  const gradeStats = stats?.stats || {
    overallAverage: 0,
    totalCredits: 0,
    completedCredits: 0,
    trend: 0,
    passedSubjects: 0,
    totalSubjects: 0
  };

  const getGradeColor = (grade: string) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 8) return 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]';
    if (numGrade >= 7) return 'bg-[#f0f9ff] text-[#0284c7] border-[#0284c7]';
    if (numGrade >= 6) return 'bg-[#fef3c7] text-[#d97706] border-[#d97706]';
    return 'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]';
  };

  const filteredSubjects = selectedSubject === 'all' 
    ? subjects?.subjects || []
    : subjects?.subjects?.filter(s => s.subjectId.toString() === selectedSubject) || [];

  return (
    <div className="space-y-6">
      {/* Professional Page Header */}
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border-b border-gray-200 p-8 mb-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mijn Cijfers</h1>
              <p className="text-gray-600 text-lg font-medium">Bekijk al je cijfers en volg je academische vooruitgang</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white border border-gray-200 text-gray-800 px-6 py-3 rounded-xl shadow-md">
              <div className="text-sm font-bold text-purple-600">{gradeStats?.overallAverage?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-gray-600 font-medium">Gemiddeld cijfer</div>
            </div>
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white px-6 py-3 rounded-xl shadow-md">
              <div className="text-sm font-bold">Prestatie</div>
              <div className="text-xs opacity-90">Goed bezig</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Admin Style */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Huidige Periode</SelectItem>
                <SelectItem value="previous">Vorige Periode</SelectItem>
                <SelectItem value="year">Heel Schooljaar</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Vak</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Vakken</SelectItem>
                {subjects?.subjects?.map((subject) => (
                  <SelectItem key={subject.subjectId} value={subject.subjectId.toString()}>
                    {subject.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Gemiddeld Cijfer</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <GraduationCap className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-[#1e40af]">{gradeStats.overallAverage.toFixed(1)}</div>
              {gradeStats.trend !== 0 && (
                <div className={`flex items-center ${gradeStats.trend > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {gradeStats.trend > 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  <span className="text-xs ml-1">{Math.abs(gradeStats.trend).toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Alle vakken
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Behaalde Credits</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <Target className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">
              {gradeStats.completedCredits}/{gradeStats.totalCredits}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              EC behaald
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Gehaalde Vakken</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <BookOpen className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">
              {gradeStats.passedSubjects}/{gradeStats.totalSubjects}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Vakken geslaagd
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Voortgang</CardTitle>
            <div className="p-2 bg-[#fdf2f8] rounded-lg">
              <Calendar className="h-4 w-4 text-[#be185d]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#be185d]">
              {Math.round((gradeStats.completedCredits / gradeStats.totalCredits) * 100)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Jaar voltooid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects and Grades - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Grades */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-[#e5e7eb] shadow-sm">
            <CardHeader className="border-b border-[#e5e7eb] pb-4">
              <CardTitle className="flex items-center text-[#1e40af] font-semibold">
                <BookOpen className="h-5 w-5 mr-2 text-[#1e40af]" />
                Vakken & Cijfers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredSubjects.length ? (
                <div className="space-y-6">
                  {filteredSubjects.map((subject) => (
                    <div key={subject.subjectId} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{subject.subjectName}</h3>
                          <p className="text-sm text-gray-600">{subject.subjectCode} • {subject.teacher}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getGradeColor(subject.currentGrade)}>
                            {subject.currentGrade}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">{subject.credits} EC</p>
                        </div>
                      </div>

                      {subject.grades.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Behaalde Cijfers</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {subject.grades.map((grade) => (
                              <div key={grade.id} className="flex items-center justify-between p-3 bg-white rounded border border-[#e5e7eb]">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{grade.description}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>{grade.type}</span>
                                    <span>•</span>
                                    <span>{grade.date}</span>
                                    <span>•</span>
                                    <span>Weging: {grade.weight}%</span>
                                  </div>
                                </div>
                                <Badge className={getGradeColor(grade.grade)}>
                                  {grade.grade}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Geen cijfers beschikbaar voor de geselecteerde periode
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Grades */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <GraduationCap className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Cijfers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentGrades?.grades?.length ? (
              <div className="space-y-3">
                {recentGrades.grades.slice(0, 8).map((grade) => (
                  <div key={grade.id} className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{grade.subject}</p>
                      <Badge className={getGradeColor(grade.grade)}>
                        {grade.grade}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{grade.description}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{grade.type}</span>
                      <span>{grade.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen recente cijfers
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}