import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  GraduationCap,
  BookOpen,
  ClipboardList,
  CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

export default function Reports() {
  const [academicYear, setAcademicYear] = useState('2023-2024');
  const [department, setDepartment] = useState('all');
  const [reportType, setReportType] = useState('overview');

  // Fetch report data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/reports', { academicYear, department, reportType }],
    staleTime: 60000,
  });

  const reportData = data || {};

  // Helper function for formatting large numbers
  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  // Generate a PDF report
  const handleGenerateReport = () => {
    console.log('Generate report clicked');
  };

  // Get trend icon and color based on value
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return { icon: <span className="text-green-500">↑</span>, color: 'text-green-500' };
    } else if (value < 0) {
      return { icon: <span className="text-red-500">↓</span>, color: 'text-red-500' };
    }
    return { icon: <span className="text-gray-500">-</span>, color: 'text-gray-500' };
  };

  // Calculate bar width for visualization
  const getBarWidth = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Rapporten & Analyses</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Exporteer Gegevens
          </Button>
          <Button onClick={handleGenerateReport} className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Genereer Rapport
          </Button>
        </div>
      </div>

      {/* Report filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academisch Jaar</label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Academisch Jaar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2022-2023">2022-2023</SelectItem>
                <SelectItem value="2021-2022">2021-2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Afdeling</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Alle Afdelingen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Afdelingen</SelectItem>
                <SelectItem value="computer-science">Informatica</SelectItem>
                <SelectItem value="business">Bedrijfskunde</SelectItem>
                <SelectItem value="engineering">Techniek</SelectItem>
                <SelectItem value="medicine">Geneeskunde</SelectItem>
                <SelectItem value="arts">Kunst</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rapport Type</label>
            <Tabs defaultValue="overview" className="w-full" value={reportType} onValueChange={setReportType}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-4">
                <TabsTrigger value="overview">Overzicht</TabsTrigger>
                <TabsTrigger value="academic">Academisch</TabsTrigger>
                <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                <TabsTrigger value="enrollment">Inschrijving</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Report content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500">
          Error loading report data. Please try again.
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  {formatNumber(1257)}
                  <span className="ml-2 text-sm text-green-500">
                    +12%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm text-gray-500">Active enrollment</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Graduation Rate</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  92.5%
                  <span className="ml-2 text-sm text-green-500">
                    +2.1%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm text-gray-500">Last academic year</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average GPA</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  3.42
                  <span className="ml-2 text-sm text-green-500">
                    +0.08
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm text-gray-500">Across all programs</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Attendance</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  87.3%
                  <span className="ml-2 text-sm text-red-500">
                    -1.2%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm text-gray-500">All courses</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Academic performance by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Computer Science</span>
                      <span className="text-sm text-gray-500">3.65 GPA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '91%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Business Administration</span>
                      <span className="text-sm text-gray-500">3.48 GPA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Engineering</span>
                      <span className="text-sm text-gray-500">3.56 GPA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '89%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Medicine</span>
                      <span className="text-sm text-gray-500">3.72 GPA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '93%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Arts</span>
                      <span className="text-sm text-gray-500">3.51 GPA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Year over year comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-center">
                    <div className="w-20 text-sm text-gray-500">First Year</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex text-sm">
                        <div className="font-medium">2023-2024</div>
                        <div className="ml-auto">485 students</div>
                      </div>
                      <div className="h-2 bg-primary rounded-full" style={{ width: '100%' }}></div>
                      <div className="flex text-sm">
                        <div className="text-gray-500">2022-2023</div>
                        <div className="ml-auto text-gray-500">425 students</div>
                      </div>
                      <div className="h-2 bg-gray-300 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-20 text-sm text-gray-500">Second Year</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex text-sm">
                        <div className="font-medium">2023-2024</div>
                        <div className="ml-auto">412 students</div>
                      </div>
                      <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                      <div className="flex text-sm">
                        <div className="text-gray-500">2022-2023</div>
                        <div className="ml-auto text-gray-500">402 students</div>
                      </div>
                      <div className="h-2 bg-gray-300 rounded-full" style={{ width: '83%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-20 text-sm text-gray-500">Third Year</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex text-sm">
                        <div className="font-medium">2023-2024</div>
                        <div className="ml-auto">360 students</div>
                      </div>
                      <div className="h-2 bg-primary rounded-full" style={{ width: '74%' }}></div>
                      <div className="flex text-sm">
                        <div className="text-gray-500">2022-2023</div>
                        <div className="ml-auto text-gray-500">358 students</div>
                      </div>
                      <div className="h-2 bg-gray-300 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Insights</CardTitle>
                <CardDescription>By day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Monday</span>
                      <span className="text-sm text-gray-500">92%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Tuesday</span>
                      <span className="text-sm text-gray-500">90%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Wednesday</span>
                      <span className="text-sm text-gray-500">88%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Thursday</span>
                      <span className="text-sm text-gray-500">86%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '86%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Friday</span>
                      <span className="text-sm text-gray-500">80%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Course Completion</CardTitle>
                <CardDescription>Pass rate by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Computer Science</span>
                      </div>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2 mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Business</span>
                      </div>
                      <span className="text-sm font-medium">91%</span>
                    </div>
                    <Progress value={91} className="h-2 mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Engineering</span>
                      </div>
                      <span className="text-sm font-medium">89%</span>
                    </div>
                    <Progress value={89} className="h-2 mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm">Medicine</span>
                      </div>
                      <span className="text-sm font-medium">86%</span>
                    </div>
                    <Progress value={86} className="h-2 mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm">Arts</span>
                      </div>
                      <span className="text-sm font-medium">88%</span>
                    </div>
                    <Progress value={88} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-start">
                      <CircleCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Retention Rate</p>
                        <p className="text-xs text-gray-500">Current academic year</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">92.3%</p>
                      <p className="text-xs text-green-500">+2.1%</p>
                    </div>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-start">
                      <CircleCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Graduation Rate</p>
                        <p className="text-xs text-gray-500">4-year completion</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">87.5%</p>
                      <p className="text-xs text-green-500">+1.5%</p>
                    </div>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-start">
                      <CircleCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Course Success Rate</p>
                        <p className="text-xs text-gray-500">Grade C or better</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">85.2%</p>
                      <p className="text-xs text-green-500">+0.8%</p>
                    </div>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-start">
                      <CircleCheck className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">First-Year Persistence</p>
                        <p className="text-xs text-gray-500">Freshman to sophomore</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">78.9%</p>
                      <p className="text-xs text-red-500">-1.2%</p>
                    </div>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-start">
                      <CircleCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Academic Standing</p>
                        <p className="text-xs text-gray-500">Good standing</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">93.1%</p>
                      <p className="text-xs text-green-500">+0.5%</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
