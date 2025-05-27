import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardCheck,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  User
} from "lucide-react";
import { PremiumHeader } from "@/components/layout/premium-header";
import { StandardTable } from "@/components/ui/standard-table";

interface Classmate {
  id: number;
  name: string;
  studentId: string;
  status: string;
}

interface Teacher {
  id: number;
  name: string;
  subject: string;
  email: string;
  phone: string;
}

interface Grade {
  id: number;
  subject: string;
  assessmentName: string;
  grade: number;
  maxGrade: number;
  date: string;
  teacher: string;
}

interface AttendanceRecord {
  id: number;
  subject: string;
  date: string;
  status: string;
  teacher: string;
  notes: string;
}

interface Report {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

export default function StudentDashboard() {
  const [currentStudent] = useState({
    name: "Hassan El-Mahmoud",
    studentId: "STU001",
    class: "Klas 1A",
    email: "hassan@email.com",
    phone: "0478 123 456",
    enrollmentDate: "2024-09-01"
  });

  const [classmates] = useState<Classmate[]>([
    { id: 1, name: "Amina Benali", studentId: "STU002", status: "Actief" },
    { id: 2, name: "Omar Khalil", studentId: "STU003", status: "Actief" },
    { id: 3, name: "Zahra Ahmed", studentId: "STU004", status: "Actief" },
    { id: 4, name: "Ali Hassan", studentId: "STU005", status: "Actief" }
  ]);

  const [myTeachers] = useState<Teacher[]>([
    {
      id: 1,
      name: "Ahmed Al-Mansouri",
      subject: "Arabisch",
      email: "ahmed.mansouri@school.be",
      phone: "0478 123 456"
    },
    {
      id: 2,
      name: "Fatima Hassan",
      subject: "Islamitische Geschiedenis",
      email: "fatima.hassan@school.be",
      phone: "0499 987 654"
    },
    {
      id: 3,
      name: "Youssef Benali",
      subject: "Quran Recitatie",
      email: "youssef.benali@school.be",
      phone: "0456 789 123"
    }
  ]);

  const [myGrades] = useState<Grade[]>([
    {
      id: 1,
      subject: "Arabisch",
      assessmentName: "Hoofdstuk 1 Test",
      grade: 8.5,
      maxGrade: 10,
      date: "2024-05-20",
      teacher: "Ahmed Al-Mansouri"
    },
    {
      id: 2,
      subject: "Islamitische Geschiedenis",
      assessmentName: "Essay Profeet Mohammed",
      grade: 9.2,
      maxGrade: 10,
      date: "2024-05-18",
      teacher: "Fatima Hassan"
    },
    {
      id: 3,
      subject: "Quran Recitatie",
      assessmentName: "Surah Al-Fatiha",
      grade: 7.8,
      maxGrade: 10,
      date: "2024-05-15",
      teacher: "Youssef Benali"
    }
  ]);

  const [myAttendance] = useState<AttendanceRecord[]>([
    {
      id: 1,
      subject: "Arabisch",
      date: "2024-05-27",
      status: "Aanwezig",
      teacher: "Ahmed Al-Mansouri",
      notes: ""
    },
    {
      id: 2,
      subject: "Islamitische Geschiedenis",
      date: "2024-05-26",
      status: "Aanwezig",
      teacher: "Fatima Hassan",
      notes: ""
    },
    {
      id: 3,
      subject: "Quran Recitatie",
      date: "2024-05-25",
      status: "Te laat",
      teacher: "Youssef Benali",
      notes: "5 minuten te laat"
    }
  ]);

  const [myReports] = useState<Report[]>([
    {
      id: 1,
      title: "Eerste Semester Rapport",
      type: "Semester Rapport",
      date: "2024-02-15",
      status: "Definitief"
    },
    {
      id: 2,
      title: "Voortgangsrapport Q3",
      type: "Voortgangsrapport",
      date: "2024-04-30",
      status: "Definitief"
    }
  ]);

  const classmateColumns = [
    {
      key: "name" as keyof Classmate,
      header: "Naam",
      render: (classmate: Classmate) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {classmate.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{classmate.name}</div>
            <div className="text-sm text-gray-500">{classmate.studentId}</div>
          </div>
        </div>
      )
    },
    {
      key: "status" as keyof Classmate,
      header: "Status",
      render: (classmate: Classmate) => (
        <Badge variant={classmate.status === 'Actief' ? 'default' : 'secondary'}>
          {classmate.status}
        </Badge>
      )
    }
  ];

  const teacherColumns = [
    {
      key: "name" as keyof Teacher,
      header: "Docent",
      render: (teacher: Teacher) => (
        <div>
          <div className="font-medium">{teacher.name}</div>
          <div className="text-sm text-gray-500">{teacher.email}</div>
        </div>
      )
    },
    {
      key: "subject" as keyof Teacher,
      header: "Vak",
      render: (teacher: Teacher) => teacher.subject
    }
  ];

  const gradeColumns = [
    {
      key: "subject" as keyof Grade,
      header: "Vak",
      render: (grade: Grade) => (
        <div>
          <div className="font-medium">{grade.subject}</div>
          <div className="text-sm text-gray-500">{grade.assessmentName}</div>
        </div>
      )
    },
    {
      key: "grade" as keyof Grade,
      header: "Cijfer",
      render: (grade: Grade) => (
        <div className={`text-center font-bold text-lg ${
          grade.grade >= 8 ? 'text-green-600' : 
          grade.grade >= 6.5 ? 'text-blue-600' : 
          'text-orange-600'
        }`}>
          {grade.grade}/{grade.maxGrade}
        </div>
      )
    },
    {
      key: "date" as keyof Grade,
      header: "Datum",
      render: (grade: Grade) => new Date(grade.date).toLocaleDateString('nl-NL')
    }
  ];

  const attendanceColumns = [
    {
      key: "subject" as keyof AttendanceRecord,
      header: "Vak",
      render: (record: AttendanceRecord) => (
        <div>
          <div className="font-medium">{record.subject}</div>
          <div className="text-sm text-gray-500">{record.teacher}</div>
        </div>
      )
    },
    {
      key: "date" as keyof AttendanceRecord,
      header: "Datum",
      render: (record: AttendanceRecord) => new Date(record.date).toLocaleDateString('nl-NL')
    },
    {
      key: "status" as keyof AttendanceRecord,
      header: "Status",
      render: (record: AttendanceRecord) => (
        <div className="flex items-center gap-2">
          {record.status === 'Aanwezig' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {record.status === 'Afwezig' && <AlertCircle className="h-4 w-4 text-red-600" />}
          {record.status === 'Te laat' && <Clock className="h-4 w-4 text-orange-600" />}
          <Badge variant={
            record.status === 'Aanwezig' ? 'default' :
            record.status === 'Afwezig' ? 'destructive' :
            'secondary'
          }>
            {record.status}
          </Badge>
        </div>
      )
    }
  ];

  const reportColumns = [
    {
      key: "title" as keyof Report,
      header: "Rapport",
      render: (report: Report) => (
        <div>
          <div className="font-medium">{report.title}</div>
          <div className="text-sm text-gray-500">{report.type}</div>
        </div>
      )
    },
    {
      key: "date" as keyof Report,
      header: "Datum",
      render: (report: Report) => new Date(report.date).toLocaleDateString('nl-NL')
    },
    {
      key: "status" as keyof Report,
      header: "Status",
      render: (report: Report) => (
        <Badge variant={report.status === 'Definitief' ? 'default' : 'secondary'}>
          {report.status}
        </Badge>
      )
    }
  ];

  const getStats = () => {
    const avgGrade = myGrades.reduce((sum, g) => sum + g.grade, 0) / myGrades.length;
    const attendanceRate = (myAttendance.filter(a => a.status === 'Aanwezig').length / myAttendance.length) * 100;
    const totalSubjects = myTeachers.length;
    const totalReports = myReports.length;

    return { avgGrade, attendanceRate, totalSubjects, totalReports };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen">
      <PremiumHeader 
        title={`Welkom, ${currentStudent.name}`}
        description="Student Dashboard - Bekijk uw schoolvoortgang"
        icon={GraduationCap}
        breadcrumbs={{
          items: [
            { label: "Dashboard", href: "/" },
            { label: "Student Dashboard" }
          ]
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Student Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {currentStudent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{currentStudent.name}</h1>
                <p className="text-gray-600">{currentStudent.studentId} • {currentStudent.class}</p>
                <p className="text-sm text-gray-500">
                  Ingeschreven: {new Date(currentStudent.enrollmentDate).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gemiddeld Cijfer</p>
                  <p className="text-3xl font-bold text-green-600">{stats.avgGrade.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Alle vakken</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aanwezigheid</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.attendanceRate.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Deze maand</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mijn Vakken</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalSubjects}</p>
                  <p className="text-sm text-gray-500">Dit semester</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rapporten</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalReports}</p>
                  <p className="text-sm text-gray-500">Beschikbaar</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="schedule">Mijn Rooster</TabsTrigger>
            <TabsTrigger value="classmates">Mijn Klas</TabsTrigger>
            <TabsTrigger value="grades">Mijn Cijfers</TabsTrigger>
            <TabsTrigger value="attendance">Mijn Aanwezigheid</TabsTrigger>
            <TabsTrigger value="teachers">Mijn Docenten</TabsTrigger>
            <TabsTrigger value="reports">Mijn Rapporten</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <Calendar className="h-5 w-5" />
                  Mijn Kalenderrooster
                </CardTitle>
                <CardDescription>
                  Overzicht van al uw lessen en evenementen (alleen lezen)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Kalender component wordt hier getoond</p>
                  <p className="text-sm">U kunt uw rooster bekijken maar niet bewerken</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classmates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <Users className="h-5 w-5" />
                  Mijn Klasgenoten
                </CardTitle>
                <CardDescription>
                  Overzicht van uw klasgenoten in {currentStudent.class}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={classmates}
                  columns={classmateColumns}
                  searchPlaceholder="Zoek klasgenoten..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <FileText className="h-5 w-5" />
                  Mijn Cijfers
                </CardTitle>
                <CardDescription>
                  Al uw behaalde cijfers dit semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={myGrades}
                  columns={gradeColumns}
                  searchPlaceholder="Zoek cijfers..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <ClipboardCheck className="h-5 w-5" />
                  Mijn Aanwezigheid
                </CardTitle>
                <CardDescription>
                  Overzicht van uw aanwezigheidsregistratie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={myAttendance}
                  columns={attendanceColumns}
                  searchPlaceholder="Zoek aanwezigheid..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <User className="h-5 w-5" />
                  Mijn Docenten
                </CardTitle>
                <CardDescription>
                  Docenten bij wie u les volgt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={myTeachers}
                  columns={teacherColumns}
                  searchPlaceholder="Zoek docenten..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <FileText className="h-5 w-5" />
                  Mijn Rapporten
                </CardTitle>
                <CardDescription>
                  Al uw beschikbare rapporten en documenten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={myReports}
                  columns={reportColumns}
                  searchPlaceholder="Zoek rapporten..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}