import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  School,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Report {
  id: number;
  title: string;
  type: string;
  description: string;
  generatedDate: string;
  academicYear: string;
  period: string;
  status: 'draft' | 'finalized' | 'sent';
  downloadUrl?: string;
  subject?: string;
  teacher?: string;
}

interface ReportCard {
  id: number;
  studentId: number;
  academicYear: string;
  semester: string;
  overallGrade: number;
  subjects: {
    name: string;
    grade: number;
    teacher: string;
    credits: number;
  }[];
  attendance: {
    present: number;
    total: number;
    percentage: number;
  };
  behavior: {
    score: number;
    comments: string;
  };
  generalComments: string;
  issuedDate: string;
  status: 'draft' | 'approved' | 'issued';
}

export default function StudentReports() {
  const [selectedReportType, setSelectedReportType] = useState("all");

  // Query for reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/student/reports'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/student/reports');
      } catch (error) {
        console.error('Error fetching reports:', error);
        return { reports: [], reportCards: [] };
      }
    },
  });

  const reports: Report[] = reportsData?.reports || [];
  const reportCards: ReportCard[] = reportsData?.reportCards || [];

  // Filter reports based on type
  const filteredReports = reports.filter(report => 
    selectedReportType === "all" || report.type === selectedReportType
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
      case 'approved':
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'Definitief';
      case 'approved':
        return 'Goedgekeurd';
      case 'issued':
        return 'Uitgegeven';
      case 'draft':
        return 'Concept';
      case 'sent':
        return 'Verzonden';
      default:
        return status;
    }
  };

  const downloadReport = (report: Report) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  };

  const previewReport = (report: Report) => {
    // Implementation for preview functionality
    console.log('Preview report:', report.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#1e40af] text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapporten</h1>
              <p className="text-sm text-gray-600 mt-1">
                Bekijk en download je academische rapporten en beoordelingen
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Rapporten & Documenten</TabsTrigger>
            <TabsTrigger value="report-cards">Rapportcijfers</TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Filter controls */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedReportType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedReportType("all")}
                className="h-8"
              >
                Alle rapporten
              </Button>
              <Button
                variant={selectedReportType === "progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedReportType("progress")}
                className="h-8"
              >
                Voortgangsrapporten
              </Button>
              <Button
                variant={selectedReportType === "attendance" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedReportType("attendance")}
                className="h-8"
              >
                Aanwezigheidsrapporten
              </Button>
              <Button
                variant={selectedReportType === "assessment" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedReportType("assessment")}
                className="h-8"
              >
                Toetsrapporten
              </Button>
            </div>

            {/* Reports List */}
            {reportsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(null).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="flex gap-2 mt-4">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen rapporten beschikbaar</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Er zijn momenteel geen rapporten beschikbaar voor de geselecteerde categorie.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {report.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            {report.description}
                          </CardDescription>
                        </div>
                        <Badge className={`ml-2 ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(report.generatedDate).toLocaleDateString('nl-NL')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <School className="h-4 w-4 mr-2" />
                          {report.academicYear} • {report.period}
                        </div>
                        {report.subject && (
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="h-4 w-4 mr-2" />
                            {report.subject}
                          </div>
                        )}
                        {report.teacher && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            {report.teacher}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewReport(report)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Bekijken
                        </Button>
                        {report.downloadUrl && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="flex-1 bg-[#1e40af] hover:bg-[#1e3a8a]"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Report Cards Tab */}
          <TabsContent value="report-cards" className="space-y-6">
            {reportCards.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen rapportcijfers beschikbaar</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Je rapportcijfers zijn nog niet beschikbaar. Deze worden meestal aan het einde van elke periode gepubliceerd.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportCards.map((reportCard) => (
                  <Card key={reportCard.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Rapportcijfers {reportCard.semester}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            Academisch jaar {reportCard.academicYear}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#1e40af]">
                            {reportCard.overallGrade.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Gemiddelde</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Subjects */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Vakken
                          </h4>
                          <div className="space-y-2">
                            {reportCard.subjects.map((subject, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                  <div className="font-medium text-gray-900">{subject.name}</div>
                                  <div className="text-xs text-gray-500">{subject.teacher}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">{subject.grade.toFixed(1)}</div>
                                  <div className="text-xs text-gray-500">{subject.credits} EC</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Attendance */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Aanwezigheid
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {reportCard.attendance.present} van {reportCard.attendance.total} lessen
                              </span>
                              <Badge className={`${reportCard.attendance.percentage >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {reportCard.attendance.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Behavior */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Gedrag
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Score</span>
                              <Badge className="bg-blue-100 text-blue-800">
                                {reportCard.behavior.score}/10
                              </Badge>
                            </div>
                            {reportCard.behavior.comments && (
                              <p className="text-sm text-gray-700 italic">
                                "{reportCard.behavior.comments}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* General Comments */}
                        {reportCard.generalComments && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Algemene opmerkingen</h4>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                              <p className="text-sm text-gray-700 italic">
                                "{reportCard.generalComments}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Uitgegeven op {new Date(reportCard.issuedDate).toLocaleDateString('nl-NL')}</span>
                            <Badge className={getStatusColor(reportCard.status)}>
                              {getStatusText(reportCard.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}