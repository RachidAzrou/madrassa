import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  School, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { PremiumHeader } from "@/components/layout/premium-header";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { StandardTable } from "@/components/ui/standard-table";

interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  directorName: string;
  totalStudents: number;
  totalTeachers: number;
  status: string;
  createdAt: string;
}

interface Director {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  schoolId: number;
  status: string;
  lastLogin: string;
}

export default function SuperAdmin() {
  const [schools, setSchools] = useState<School[]>([
    {
      id: 1,
      name: "Al-Noor Islamitische School",
      address: "Hoofdstraat 123, 1000 Brussel",
      phone: "02 123 4567",
      email: "info@al-noor.be",
      website: "www.al-noor.be",
      description: "Een moderne islamitische basisschool",
      directorName: "Ahmed Al-Hassan",
      totalStudents: 245,
      totalTeachers: 18,
      status: "Actief",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Madrassa Ibn Sina",
      address: "Parkstraat 45, 2000 Antwerpen",
      phone: "03 987 6543",
      email: "contact@ibnsina.be",
      website: "www.ibnsina.be",
      description: "Islamitisch onderwijs met focus op wetenschap",
      directorName: "Fatima El-Zahra",
      totalStudents: 189,
      totalTeachers: 14,
      status: "Actief",
      createdAt: "2023-09-20"
    }
  ]);

  const [directors, setDirectors] = useState<Director[]>([
    {
      id: 1,
      firstName: "Ahmed",
      lastName: "Al-Hassan",
      email: "ahmed.hassan@al-noor.be",
      phone: "0478 123 456",
      schoolName: "Al-Noor Islamitische School",
      schoolId: 1,
      status: "Actief",
      lastLogin: "2024-05-27"
    },
    {
      id: 2,
      firstName: "Fatima",
      lastName: "El-Zahra",
      email: "fatima.zahra@ibnsina.be",
      phone: "0499 987 654",
      schoolName: "Madrassa Ibn Sina",
      schoolId: 2,
      status: "Actief",
      lastLogin: "2024-05-26"
    }
  ]);

  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showDirectorDialog, setShowDirectorDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);

  const schoolColumns = [
    {
      key: "name" as keyof School,
      header: "School",
      render: (school: School) => (
        <div>
          <div className="font-medium">{school.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {school.address}
          </div>
        </div>
      )
    },
    {
      key: "directorName" as keyof School,
      header: "Directeur",
      render: (school: School) => school.directorName
    },
    {
      key: "totalStudents" as keyof School,
      header: "Studenten",
      render: (school: School) => (
        <div className="text-center">
          <div className="font-medium">{school.totalStudents}</div>
          <div className="text-sm text-gray-500">{school.totalTeachers} docenten</div>
        </div>
      )
    },
    {
      key: "status" as keyof School,
      header: "Status",
      render: (school: School) => (
        <Badge variant={school.status === 'Actief' ? 'default' : 'secondary'}>
          {school.status}
        </Badge>
      )
    }
  ];

  const directorColumns = [
    {
      key: "firstName" as keyof Director,
      header: "Naam",
      render: (director: Director) => (
        <div>
          <div className="font-medium">{director.firstName} {director.lastName}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {director.email}
          </div>
        </div>
      )
    },
    {
      key: "schoolName" as keyof Director,
      header: "School",
      render: (director: Director) => director.schoolName
    },
    {
      key: "lastLogin" as keyof Director,
      header: "Laatste login",
      render: (director: Director) => new Date(director.lastLogin).toLocaleDateString('nl-NL')
    },
    {
      key: "status" as keyof Director,
      header: "Status",
      render: (director: Director) => (
        <Badge variant={director.status === 'Actief' ? 'default' : 'secondary'}>
          {director.status}
        </Badge>
      )
    }
  ];

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setShowSchoolDialog(true);
  };

  const handleEditDirector = (director: Director) => {
    setEditingDirector(director);
    setShowDirectorDialog(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchools(schools.filter(s => s.id !== school.id));
  };

  const handleDeleteDirector = (director: Director) => {
    setDirectors(directors.filter(d => d.id !== director.id));
  };

  const getTotalStats = () => {
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((sum, school) => sum + school.totalStudents, 0);
    const totalTeachers = schools.reduce((sum, school) => sum + school.totalTeachers, 0);
    const activeSchools = schools.filter(s => s.status === 'Actief').length;

    return { totalSchools, totalStudents, totalTeachers, activeSchools };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen">
      <PremiumHeader 
        title="Superadmin Dashboard"
        description="Beheer alle scholen en hun directeuren"
        icon={Building2}
        breadcrumbs={{
          items: [
            { label: "Dashboard", href: "/" },
            { label: "Superadmin" }
          ]
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totaal Scholen</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalSchools}</p>
                  <p className="text-sm text-green-600">{stats.activeSchools} actief</p>
                </div>
                <School className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totaal Studenten</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-500">Alle scholen</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totaal Docenten</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalTeachers}</p>
                  <p className="text-sm text-gray-500">Alle scholen</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gemiddeld per School</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.round(stats.totalStudents / stats.totalSchools)}
                  </p>
                  <p className="text-sm text-gray-500">Studenten</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>




      </div>

      {/* School Dialog */}
      <CustomDialog
        open={showSchoolDialog}
        onOpenChange={setShowSchoolDialog}
        title={editingSchool ? "School Bewerken" : "Nieuwe School"}
        description={editingSchool ? "Bewerk de schoolgegevens" : "Voeg een nieuwe school toe aan het systeem"}
        icon={School}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Schoolnaam</Label>
              <Input id="name" placeholder="Naam van de school" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="school@example.com" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" placeholder="Volledige adres" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" placeholder="Telefoonnummer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="www.school.be" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea id="description" placeholder="Korte beschrijving van de school" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSchoolDialog(false)}>
              Annuleren
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {editingSchool ? "Opslaan" : "School Toevoegen"}
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Director Dialog */}
      <CustomDialog
        open={showDirectorDialog}
        onOpenChange={setShowDirectorDialog}
        title={editingDirector ? "Directeur Bewerken" : "Nieuwe Directeur"}
        description={editingDirector ? "Bewerk de directeur gegevens" : "Voeg een nieuwe directeur toe"}
        icon={UserPlus}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input id="firstName" placeholder="Voornaam" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input id="lastName" placeholder="Achternaam" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="directeur@school.be" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" placeholder="Telefoonnummer" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <select className="w-full p-2 border rounded">
              <option value="">Selecteer school</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDirectorDialog(false)}>
              Annuleren
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              {editingDirector ? "Opslaan" : "Directeur Toevoegen"}
            </Button>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}