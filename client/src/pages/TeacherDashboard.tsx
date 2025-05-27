import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { PremiumHeader } from "@/components/layout/premium-header";
import { StandardTable } from "@/components/ui/standard-table";

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  email: string;
  phone: string;
  lastGrade: number;
  attendance: number;
  status: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  class: string;
  students: number;
  schedule: string;
  description: string;
}

interface AttendanceRecord {
  id: number;
  studentName: string;
  subject: string;
  date: string;
  status: string;
  notes: string;
}

export default function TeacherDashboard() {
  const [currentUser] = useState({
    name: "Ahmed Al-Mansouri",
    teacherId: "DOC001",
    email: "ahmed.mansouri@school.be",
    subjects: ["Arabisch", "Islamitische Studies"],
    classes: ["Klas 1A", "Klas 2B"]
  });

  const [myStudents] = useState<Student[]>([
    {
      id: 1,
      name: "Hassan El-Mahmoud",
      studentId: "STU001",
      class: "Klas 1A",
      email: "hassan@email.com",
      phone: "0478 123 456",
      lastGrade: 8.5,
      attendance: 95,
      status: "Actief"
    },
    {
      id: 2,
      name: "Amina Benali",
      studentId: "STU002",
      class: "Klas 1A",
      email: "amina@email.com",
      phone: "0499 987 654",
      lastGrade: 9.2,
      attendance: 98,
      status: "Actief"
    },
    {
      id: 3,
      name: "Omar Khalil",
      studentId: "STU003",
      class: "Klas 2B",
      email: "omar@email.com",
      phone: "0456 789 123",
      lastGrade: 7.8,
      attendance: 88,
      status: "Actief"
    }
  ]);

  const [mySubjects] = useState<Subject[]>([
    {
      id: 1,
      name: "Arabisch",
      code: "ARA101",
      class: "Klas 1A",
      students: 15,
      schedule: "Ma, Wo, Vr 09:00-10:00",
      description: "Basis Arabische taal en grammatica"
    },
    {
      id: 2,
      name: "Islamitische Studies",
      code: "ISL201",
      class: "Klas 2B",
      students: 12,
      schedule: "Di, Do 10:00-11:00",
      description: "Islamitische geschiedenis en cultuur"
    }
  ]);

  const [recentAttendance] = useState<AttendanceRecord[]>([
    {
      id: 1,
      studentName: "Hassan El-Mahmoud",
      subject: "Arabisch",
      date: "2024-05-27",
      status: "Aanwezig",
      notes: ""
    },
    {
      id: 2,
      studentName: "Amina Benali",
      subject: "Arabisch",
      date: "2024-05-27",
      status: "Aanwezig",
      notes: ""
    },
    {
      id: 3,
      studentName: "Omar Khalil",
      subject: "Islamitische Studies",
      date: "2024-05-26",
      status: "Te laat",
      notes: "5 minuten te laat"
    }
  ]);

  const studentColumns = [
    {
      key: "name" as keyof Student,
      header: "Student",
      render: (student: Student) => (
        <div>
          <div className="font-medium">{student.name}</div>
          <div className="text-sm text-gray-500">{student.studentId} • {student.class}</div>
        </div>
      )
    },
    {
      key: "lastGrade" as keyof Student,
      header: "Laatste Cijfer",
      render: (student: Student) => (
        <div className={`font-medium ${
          student.lastGrade >= 8 ? 'text-green-600' : 
          student.lastGrade >= 6.5 ? 'text-blue-600' : 
          'text-orange-600'
        }`}>
          {student.lastGrade}
        </div>
      )
    },
    {
      key: "attendance" as keyof Student,
      header: "Aanwezigheid",
      render: (student: Student) => (
        <div className={`font-medium ${
          student.attendance >= 95 ? 'text-green-600' : 
          student.attendance >= 85 ? 'text-blue-600' : 
          'text-orange-600'
        }`}>
          {student.attendance}%
        </div>
      )
    },
    {
      key: "status" as keyof Student,
      header: "Status",
      render: (student: Student) => (
        <Badge variant={student.status === 'Actief' ? 'default' : 'secondary'}>
          {student.status}
        </Badge>
      )
    }
  ];

  const subjectColumns = [
    {
      key: "name" as keyof Subject,
      header: "Vak",
      render: (subject: Subject) => (
        <div>
          <div className="font-medium">{subject.name}</div>
          <div className="text-sm text-gray-500">{subject.code}</div>
        </div>
      )
    },
    {
      key: "class" as keyof Subject,
      header: "Klas",
      render: (subject: Subject) => subject.class
    },
    {
      key: "students" as keyof Subject,
      header: "Studenten",
      render: (subject: Subject) => (
        <div className="text-center font-medium">{subject.students}</div>
      )
    },
    {
      key: "schedule" as keyof Subject,
      header: "Rooster",
      render: (subject: Subject) => (
        <div className="text-sm">{subject.schedule}</div>
      )
    }
  ];

  const attendanceColumns = [
    {
      key: "studentName" as keyof AttendanceRecord,
      header: "Student",
      render: (record: AttendanceRecord) => (
        <div>
          <div className="font-medium">{record.studentName}</div>
          <div className="text-sm text-gray-500">{record.subject}</div>
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

  const getStats = () => {
    const totalStudents = myStudents.length;
    const avgGrade = myStudents.reduce((sum, s) => sum + s.lastGrade, 0) / totalStudents;
    const avgAttendance = myStudents.reduce((sum, s) => sum + s.attendance, 0) / totalStudents;
    const totalSubjects = mySubjects.length;

    return { totalStudents, avgGrade, avgAttendance, totalSubjects };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen">
      <PremiumHeader 
        title={`Welkom, ${currentUser.name}`}
        description="Docenten Dashboard - Beheer uw lessen en studenten"
        icon={GraduationCap}
        breadcrumbs={{
          items: [
            { label: "Dashboard", href: "/" },
            { label: "Docent Dashboard" }
          ]
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mijn Studenten</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-500">Alle klassen</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gemiddeld Cijfer</p>
                  <p className="text-3xl font-bold text-green-600">{stats.avgGrade.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Alle studenten</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aanwezigheid</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.avgAttendance.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Gemiddeld</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mijn Vakken</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalSubjects}</p>
                  <p className="text-sm text-gray-500">Dit semester</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="schedule">Mijn Rooster</TabsTrigger>
            <TabsTrigger value="students">Mijn Studenten</TabsTrigger>
            <TabsTrigger value="subjects">Mijn Vakken</TabsTrigger>
            <TabsTrigger value="grades">Cijfers</TabsTrigger>
            <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
            <TabsTrigger value="messages">Berichten</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <Calendar className="h-5 w-5" />
                  Mijn Kalenderrooster
                </CardTitle>
                <CardDescription>
                  Overzicht van uw lessen en evenementen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Kalender component wordt hier getoond</p>
                  <p className="text-sm">Alleen uw eigen lessen en evenementen zijn bewerkbaar</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <Users className="h-5 w-5" />
                  Mijn Studenten
                </CardTitle>
                <CardDescription>
                  Alle studenten uit uw klassen en vakken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={myStudents}
                  columns={studentColumns}
                  searchPlaceholder="Zoek studenten..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <BookOpen className="h-5 w-5" />
                  Mijn Vakken
                </CardTitle>
                <CardDescription>
                  Vakken die u onderwijst dit semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={mySubjects}
                  columns={subjectColumns}
                  searchPlaceholder="Zoek vakken..."
                  showActions={true}
                  actionLabel="Bewerken"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <FileText className="h-5 w-5" />
                  Cijfers Beheer
                </CardTitle>
                <CardDescription>
                  Voer cijfers in voor uw studenten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Cijfers interface wordt hier getoond</p>
                  <Button className="mt-4">
                    Nieuwe Cijfers Invoeren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                      <ClipboardCheck className="h-5 w-5" />
                      Aanwezigheid Beheer
                    </CardTitle>
                    <CardDescription>
                      Registreer aanwezigheid van uw studenten
                    </CardDescription>
                  </div>
                  <Button>
                    Nieuwe Aanwezigheid
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <StandardTable
                  data={recentAttendance}
                  columns={attendanceColumns}
                  searchPlaceholder="Zoek aanwezigheidsrecords..."
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                  <MessageCircle className="h-5 w-5" />
                  Berichten
                </CardTitle>
                <CardDescription>
                  Communiceer met directeur, collega's, studenten en ouders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Berichtensysteem wordt hier getoond</p>
                  <p className="text-sm">U kunt berichten sturen naar directeur, docenten, studenten en ouders</p>
                  <Button className="mt-4">
                    Nieuw Bericht
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}