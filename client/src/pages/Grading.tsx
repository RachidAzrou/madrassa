import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Download, PlusCircle, History, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Grading() {
  const { toast } = useToast();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isGradesModified, setIsGradesModified] = useState(false);

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses/list'],
    staleTime: 300000,
  });

  const courses = coursesData?.courses || [];

  // Fetch assessments for selected course
  const { data: assessmentsData } = useQuery({
    queryKey: ['/api/assessments', { courseId: selectedCourse }],
    staleTime: 60000,
    enabled: !!selectedCourse,
  });

  const assessments = assessmentsData?.assessments || [];

  // Fetch students and grades for selected course and assessment
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/grades', { courseId: selectedCourse, assessmentId: selectedAssessment }],
    staleTime: 60000,
    enabled: !!selectedCourse && !!selectedAssessment,
  });

  const students = data?.students || [];
  const existingGrades = data?.grades || {};

  // Mutation for saving grades
  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/grades/save', {
        courseId: selectedCourse,
        assessmentId: selectedAssessment,
        grades,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Grades saved',
        description: 'Student grades have been successfully updated.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      setIsGradesModified(false);
    },
    onError: (error) => {
      toast({
        title: 'Error saving grades',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedAssessment('');
    setGrades({});
    setIsGradesModified(false);
  };

  const handleAssessmentChange = (value: string) => {
    setSelectedAssessment(value);
    setGrades({});
    setIsGradesModified(false);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      setGrades(prev => ({
        ...prev,
        [studentId]: numericValue
      }));
      setIsGradesModified(true);
    }
  };

  const handleSaveGrades = () => {
    saveMutation.mutate();
  };

  // Initialize grades from fetched data
  useState(() => {
    if (Object.keys(existingGrades).length > 0 && Object.keys(grades).length === 0) {
      setGrades(existingGrades);
    }
  });

  // Calculate letter grade and color based on score
  const getGradeInfo = (score: number) => {
    if (score >= 90) return { letter: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { letter: 'B', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { letter: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { letter: 'D', color: 'bg-yellow-100 text-yellow-800' };
    return { letter: 'F', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Beoordelingsbeheer</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Cijfers Exporteren
          </Button>
          <Button className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nieuwe Beoordeling
          </Button>
        </div>
      </div>

      {/* Course and assessment selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecteer een cursus" />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="loading" disabled>Cursussen laden...</SelectItem>
                ) : (
                  courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.courseCode})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedAssessment} 
              onValueChange={handleAssessmentChange}
              disabled={!selectedCourse}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    {!selectedCourse ? "Select a course first" : "No assessments found"}
                  </SelectItem>
                ) : (
                  assessments.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Zoek studenten..." 
                className="w-full md:w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Filteren
            </Button>
          </div>
        </div>
      </div>

      {/* Grading table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!selectedCourse || !selectedAssessment ? (
          <div className="p-8 text-center">
            <h3 className="text-gray-500 text-lg font-medium">
              {!selectedCourse 
                ? "Selecteer een cursus" 
                : "Selecteer een beoordeling"}
            </h3>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">
            Fout bij het laden van cijfergegevens. Probeer het opnieuw.
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Geen studenten ingeschreven voor deze cursus.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tussentoets
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opdrachten
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projecten
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eindtoets
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eindcijfer
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any) => {
                    const overallScore = student.overallScore || 0;
                    const { letter, color } = getGradeInfo(overallScore);
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar 
                              initials={`${student.firstName.charAt(0)}${student.lastName.charAt(0)}`} 
                              size="md" 
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input 
                            type="text" 
                            value={student.grades?.midterm || ""}
                            className="rounded-md border-gray-300 py-1 text-sm text-center w-16"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input 
                            type="text" 
                            value={student.grades?.assignments || ""}
                            className="rounded-md border-gray-300 py-1 text-sm text-center w-16"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input 
                            type="text" 
                            value={student.grades?.projects || ""}
                            className="rounded-md border-gray-300 py-1 text-sm text-center w-16"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input 
                            type="text" 
                            value={grades[student.id] !== undefined ? grades[student.id] : (student.grades?.final || "")}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="rounded-md border-gray-300 py-1 text-sm text-center w-16"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-sm rounded-full ${color} font-medium`}>
                            {letter} ({overallScore}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary-dark"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button 
                onClick={handleSaveGrades} 
                disabled={saveMutation.isPending || !isGradesModified}
                className="flex items-center"
              >
                {saveMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Cijfers Opslaan
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Class Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">A (90-100%)</span>
                <span className="text-sm text-gray-600">24%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">B (80-89%)</span>
                <span className="text-sm text-gray-600">38%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">C (70-79%)</span>
                <span className="text-sm text-gray-600">22%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">D (60-69%)</span>
                <span className="text-sm text-gray-600">12%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">F (Below 60%)</span>
                <span className="text-sm text-gray-600">4%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '4%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Class Average: <span className="font-semibold">82.7%</span></p>
              <p className="text-sm text-gray-600">Median: <span className="font-semibold">84%</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Midterm Exam</span>
                <span className="text-sm text-gray-600">Average: 78%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Assignments</span>
                <span className="text-sm text-gray-600">Average: 85%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Projects</span>
                <span className="text-sm text-gray-600">Average: 88%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Final Exam</span>
                <span className="text-sm text-gray-600">Average: 80%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Highest Performing Area:</span> Projects
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Lowest Performing Area:</span> Midterm Exam
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
