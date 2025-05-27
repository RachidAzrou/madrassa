import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  User,
  Baby
} from "lucide-react";
import { PremiumHeader } from "@/components/layout/premium-header";
import { StandardTable } from "@/components/ui/standard-table";

interface Child {
  id: number;
  name: string;
  studentId: string;
  class: string;
  status: string;
  avgGrade: number;
  attendance: number;
  outstandingPayments: number;
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

interface Payment {
  id: number;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  paymentDate?: string;
  reference: string;
}

interface Report {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

export default function ParentDashboard() {
  const [currentParent] = useState({
    name: "Fatima El-Mahmoud",
    email: "fatima.elmoud@email.com",
    phone: "0478 123 456",
    relationship: "Moeder"
  });

  const [myChildren] = useState<Child[]>([
    {
      id: 1,
      name: "Hassan El-Mahmoud",
      studentId: "STU001",
      class: "Klas 1A",
      status: "Actief",
      avgGrade: 8.5,
      attendance: 95,
      outstandingPayments: 75.00
    },
    {
      id: 2,
      name: "Amina El-Mahmoud",
      studentId: "STU007",
      class: "Klas 3B",
      status: "Actief",
      avgGrade: 9.2,
      attendance: 98,
      outstandingPayments: 0.00
    }
  ]);

  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const [childGrades] = useState<Grade[]>([
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

  const [childAttendance] = useState<AttendanceRecord[]>([
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

  const [childPayments] = useState<Payment[]>([
    {
      id: 1,
      type: "Inschrijvingsgeld",
      description: "Inschrijving schooljaar 2024-2025",
      amount: 150.00,
      dueDate: "2024-09-01",
      status: "Betaald",
      paymentDate: "2024-08-25",
      reference: "INS-STU001-2024"
    },
    {
      id: 2,
      type: "Lesmateriaal",
      description: "Boeken en materialen Semester 1",
      amount: 75.00,
      dueDate: "2024-06-01",
      status: "Openstaand",
      reference: "MTR-STU001-2024-S1"
    },
    {
      id: 3,
      type: "Activiteit",
      description: "Schooluitstap Islamitisch Centrum",
      amount: 25.00,
      dueDate: "2024-05-30",
      status: "Openstaand",
      reference: "ACT-STU001-2024-05"
    }
  ]);

  const [childReports] = useState<Report[]>([
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

  const childColumns = [
    {
      key: "name" as keyof Child,
      header: "Kind",
      render: (child: Child) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {child.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{child.name}</div>
            <div className="text-sm text-gray-500">{child.studentId} • {child.class}</div>
          </div>
        </div>
      )
    },
    {
      key: "avgGrade" as keyof Child,
      header: "Gemiddeld Cijfer",
      render: (child: Child) => (
        <div className={`font-medium text-center ${
          child.avgGrade >= 8 ? 'text-green-600' : 
          child.avgGrade >= 6.5 ? 'text-blue-600' : 
          'text-orange-600'
        }`}>
          {child.avgGrade}
        </div>
      )
    },
    {
      key: "attendance" as keyof Child,
      header: "Aanwezigheid",
      render: (child: Child) => (
        <div className={`font-medium text-center ${
          child.attendance >= 95 ? 'text-green-600' : 
          child.attendance >= 85 ? 'text-blue-600' : 
          'text-orange-600'
        }`}>
          {child.attendance}%
        </div>
      )
    },
    {
      key: "outstandingPayments" as keyof Child,
      header: "Openstaand",
      render: (child: Child) => (
        <div className={`font-medium text-center ${
          child.outstandingPayments === 0 ? 'text-green-600' : 'text-orange-600'
        }`}>
          €{child.outstandingPayments.toFixed(2)}
        </div>
      )
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
    },
    {
      key: "teacher" as keyof Grade,
      header: "Docent",
      render: (grade: Grade) => grade.teacher
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

  const paymentColumns = [
    {
      key: "type" as keyof Payment,
      header: "Type",
      render: (payment: Payment) => (
        <div>
          <div className="font-medium">{payment.type}</div>
          <div className="text-sm text-gray-500">{payment.description}</div>
        </div>
      )
    },
    {
      key: "amount" as keyof Payment,
      header: "Bedrag",
      render: (payment: Payment) => (
        <div className="text-right font-medium">
          €{payment.amount.toFixed(2)}
        </div>
      )
    },
    {
      key: "dueDate" as keyof Payment,
      header: "Vervaldatum",
      render: (payment: Payment) => new Date(payment.dueDate).toLocaleDateString('nl-NL')
    },
    {
      key: "status" as keyof Payment,
      header: "Status",
      render: (payment: Payment) => (
        <Badge variant={payment.status === 'Betaald' ? 'default' : 'destructive'}>
          {payment.status}
        </Badge>
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

  const getTotalStats = () => {
    const totalChildren = myChildren.length;
    const avgGradeAll = myChildren.reduce((sum, child) => sum + child.avgGrade, 0) / totalChildren;
    const avgAttendanceAll = myChildren.reduce((sum, child) => sum + child.attendance, 0) / totalChildren;
    const totalOutstanding = myChildren.reduce((sum, child) => sum + child.outstandingPayments, 0);

    return { totalChildren, avgGradeAll, avgAttendanceAll, totalOutstanding };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen">
      <PremiumHeader 
        title={`Welkom, ${currentParent.name}`}
        description="Ouder Dashboard - Volg de voortgang van uw kinderen"
        icon={Baby}
        breadcrumbs={{
          items: [
            { label: "Dashboard", href: "/" },
            { label: "Ouder Dashboard" }
          ]
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Parent Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {currentParent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{currentParent.name}</h1>
                <p className="text-gray-600">{currentParent.relationship}</p>
                <p className="text-sm text-gray-500">{currentParent.email} • {currentParent.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mijn Kinderen</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalChildren}</p>
                  <p className="text-sm text-gray-500">Op school</p>
                </div>
                <Baby className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gemiddeld Cijfer</p>
                  <p className="text-3xl font-bold text-green-600">{stats.avgGradeAll.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Alle kinderen</p>
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
                  <p className="text-3xl font-bold text-purple-600">{stats.avgAttendanceAll.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Gemiddeld</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Openstaand</p>
                  <p className={`text-3xl font-bold ${stats.totalOutstanding === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    €{stats.totalOutstanding.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Te betalen</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {!selectedChild ? (
          // Children Overview
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                <Users className="h-5 w-5" />
                Mijn Kinderen
              </CardTitle>
              <CardDescription>
                Klik op een kind om de details te bekijken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardTable
                data={myChildren}
                columns={childColumns}
                searchPlaceholder="Zoek kinderen..."
                showActions={true}
                actionLabel="Bekijken"
                onEdit={(child) => setSelectedChild(child)}
              />
            </CardContent>
          </Card>
        ) : (
          // Individual Child Details
          <div className="space-y-6">
            {/* Child Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {selectedChild.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold">{selectedChild.name}</h1>
                      <p className="text-gray-600">{selectedChild.studentId} • {selectedChild.class}</p>
                      <Badge variant={selectedChild.status === 'Actief' ? 'default' : 'secondary'}>
                        {selectedChild.status}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedChild(null)}
                  >
                    Terug naar Overzicht
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Child Details Tabs */}
            <Tabs defaultValue="schedule" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="schedule">Rooster</TabsTrigger>
                <TabsTrigger value="grades">Cijfers</TabsTrigger>
                <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                <TabsTrigger value="payments">Betalingen</TabsTrigger>
                <TabsTrigger value="reports">Rapporten</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                      <Calendar className="h-5 w-5" />
                      Kalenderrooster - {selectedChild.name}
                    </CardTitle>
                    <CardDescription>
                      Overzicht van alle lessen en evenementen (alleen lezen)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Kalender component wordt hier getoond</p>
                      <p className="text-sm">Rooster van {selectedChild.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                      <FileText className="h-5 w-5" />
                      Cijfers - {selectedChild.name}
                    </CardTitle>
                    <CardDescription>
                      Alle behaalde cijfers van uw kind
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StandardTable
                      data={childGrades}
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
                      Aanwezigheid - {selectedChild.name}
                    </CardTitle>
                    <CardDescription>
                      Aanwezigheidsregistratie van uw kind
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StandardTable
                      data={childAttendance}
                      columns={attendanceColumns}
                      searchPlaceholder="Zoek aanwezigheid..."
                      showActions={false}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                      <CreditCard className="h-5 w-5" />
                      Betalingen - {selectedChild.name}
                    </CardTitle>
                    <CardDescription>
                      Alle betalingen en openstaande bedragen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StandardTable
                      data={childPayments}
                      columns={paymentColumns}
                      searchPlaceholder="Zoek betalingen..."
                      showActions={true}
                      actionLabel="Betalen"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium leading-tight tracking-tight flex items-center gap-2 text-[#0b4ca4]">
                      <FileText className="h-5 w-5" />
                      Rapporten - {selectedChild.name}
                    </CardTitle>
                    <CardDescription>
                      Alle beschikbare rapporten en documenten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StandardTable
                      data={childReports}
                      columns={reportColumns}
                      searchPlaceholder="Zoek rapporten..."
                      showActions={true}
                      actionLabel="Download"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}