import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Save, Plus, Edit3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Grade {
  id: number;
  studentId: number;
  courseId: number;
  score: number;
  assessmentType: string;
  assessmentName: string;
  date: string;
}

export default function CijfersNieuw() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [grades, setGrades] = useState<{ [key: string]: number }>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: () => apiRequest('/api/student-groups'),
  });

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students/class', selectedClass],
    queryFn: () => apiRequest(`/api/students/class/${selectedClass}`),
    enabled: !!selectedClass,
  });

  // Fetch programs
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: () => apiRequest('/api/programs'),
  });

  // Fetch grades
  const { data: gradesData } = useQuery({
    queryKey: ['/api/grades/class', selectedClass],
    queryFn: () => apiRequest(`/api/grades/class/${selectedClass}`),
    enabled: !!selectedClass,
  });

  const classes = classesData || [];
  const students = studentsData || [];
  const programs = programsData?.programs || [];

  // Process grades into a simple key-value format
  useEffect(() => {
    if (gradesData && Array.isArray(gradesData)) {
      const processedGrades: { [key: string]: number } = {};
      
      gradesData.forEach((grade: Grade) => {
        const program = programs.find(p => p.id === grade.courseId);
        if (program) {
          const key = `${grade.studentId}-${program.name}`;
          processedGrades[key] = grade.score;
        }
      });
      
      setGrades(processedGrades);
    }
  }, [gradesData, programs]);

  const handleSaveGrade = async (studentId: number, programName: string, score: string) => {
    if (!score || isNaN(Number(score))) {
      setEditingCell(null);
      setTempValue('');
      return;
    }

    const scoreNum = Number(score);
    if (scoreNum < 0 || scoreNum > 100) {
      toast({
        title: "Ongeldig cijfer",
        description: "Cijfer moet tussen 0 en 100 zijn",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the program ID
      const program = programs.find(p => p.name === programName);
      if (!program) {
        throw new Error('Program niet gevonden');
      }

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          courseId: program.id,
          assessmentType: 'regular',
          assessmentName: 'Cijfer',
          score: scoreNum,
          maxScore: 100,
          weight: 100,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij opslaan van cijfer');
      }

      // Update local state immediately
      const key = `${studentId}-${programName}`;
      setGrades(prev => ({
        ...prev,
        [key]: scoreNum
      }));

      setEditingCell(null);
      setTempValue('');

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/grades/class', selectedClass] });

      toast({
        title: "Cijfer opgeslagen",
        description: `Cijfer ${scoreNum}% opgeslagen voor ${programName}`,
      });

    } catch (error) {
      console.error('Error saving grade:', error);
      toast({
        title: "Fout",
        description: "Kon cijfer niet opslaan",
        variant: "destructive",
      });
    }
  };

  const getGradeInfo = (score: number) => {
    if (score >= 90) return { label: 'Uitstekend', color: 'bg-green-500' };
    if (score >= 80) return { label: 'Zeer Goed', color: 'bg-blue-500' };
    if (score >= 70) return { label: 'Goed', color: 'bg-indigo-500' };
    if (score >= 60) return { label: 'Voldoende', color: 'bg-yellow-500' };
    if (score >= 50) return { label: 'Matig', color: 'bg-orange-500' };
    return { label: 'Onvoldoende', color: 'bg-red-500' };
  };

  const renderGradeCell = (studentId: number, programName: string) => {
    const key = `${studentId}-${programName}`;
    const grade = grades[key];
    const isEditing = editingCell === key;

    if (isEditing) {
      return (
        <Input
          type="number"
          min="0"
          max="100"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveGrade(studentId, programName, tempValue);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
              setTempValue('');
            }
          }}
          onBlur={() => {
            if (tempValue) {
              handleSaveGrade(studentId, programName, tempValue);
            } else {
              setEditingCell(null);
              setTempValue('');
            }
          }}
          className="h-12 text-center text-lg font-bold"
          placeholder="0-100"
          autoFocus
        />
      );
    }

    if (grade !== undefined) {
      const gradeInfo = getGradeInfo(grade);
      return (
        <div
          className={`${gradeInfo.color} text-white p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity text-center`}
          onClick={() => {
            setEditingCell(key);
            setTempValue(grade.toString());
          }}
        >
          <div className="font-bold text-lg">{grade}%</div>
          <div className="text-xs opacity-90">{gradeInfo.label}</div>
        </div>
      );
    }

    return (
      <div
        className="border-2 border-dashed border-gray-300 p-3 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
        onClick={() => {
          setEditingCell(key);
          setTempValue('');
        }}
      >
        <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
        <div className="text-xs text-gray-500">Cijfer toevoegen</div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cijfers - Nieuwe Interface</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klas selecteren</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer een klas" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name} - {cls.academicYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && programs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cijfers invoeren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid gap-4">
                {/* Header */}
                <div className="grid grid-cols-[250px_repeat(auto-fit,minmax(120px,1fr))] gap-4 pb-4 border-b">
                  <div className="font-semibold">Student</div>
                  {programs.map((program) => (
                    <div key={program.id} className="font-semibold text-center">
                      {program.name}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {students.map((student: Student) => (
                  <div key={student.id} className="grid grid-cols-[250px_repeat(auto-fit,minmax(120px,1fr))] gap-4 items-center py-2">
                    <div className="font-medium">
                      {student.firstName} {student.lastName}
                      <div className="text-sm text-gray-500">{student.studentId}</div>
                    </div>
                    {programs.map((program) => (
                      <div key={program.id}>
                        {renderGradeCell(student.id, program.name)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && students.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Geen studenten gevonden in deze klas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}