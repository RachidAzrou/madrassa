import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumHeader } from "@/components/layout/premium-header";
import { StandardTable } from "@/components/ui/standard-table";
import { SearchActionLayout } from "@/components/ui/search-action-layout";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Plus, Users, MapPin, Phone, Mail, Globe, Edit, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  directorsCount: number;
  studentsCount: number;
  status: string;
}

interface Director {
  id: number;
  schoolId: number;
  schoolName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  startDate: string;
  status: string;
}

export default function Scholen() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([
    {
      id: 1,
      name: "Madrassa Al-Noor Amsterdam",
      address: "Overtoom 123, 1054 HD Amsterdam",
      phone: "020-1234567",
      email: "info@alnoor.nl",
      website: "www.alnoor.nl",
      description: "Islamitische basisschool in Amsterdam West",
      directorsCount: 1,
      studentsCount: 285,
      status: "Actief"
    },
    {
      id: 2,
      name: "Islamitische School Rotterdam",
      address: "Coolsingel 45, 3012 AB Rotterdam",
      phone: "010-9876543",
      email: "contact@isr.nl",
      website: "www.isr.nl",
      description: "Voortgezet onderwijs volgens islamitische waarden",
      directorsCount: 2,
      studentsCount: 420,
      status: "Actief"
    }
  ]);

  const [directors, setDirectors] = useState<Director[]>([
    {
      id: 1,
      schoolId: 1,
      schoolName: "Madrassa Al-Noor Amsterdam",
      firstName: "Ahmed",
      lastName: "Hassan",
      email: "directeur@mymadrassa.be",
      phone: "020-1234567",
      startDate: "2023-01-15",
      status: "Actief"
    },
    {
      id: 2,
      schoolId: 2,
      schoolName: "Islamitische School Rotterdam",
      firstName: "Fatima",
      lastName: "Al-Zahra",
      email: "f.alzahra@isr.nl",
      phone: "010-9876543",
      startDate: "2022-09-01",
      status: "Actief"
    },
    {
      id: 3,
      schoolId: 2,
      schoolName: "Islamitische School Rotterdam",
      firstName: "Omar",
      lastName: "Ibn Khattab",
      email: "o.ibnkhattab@isr.nl",
      phone: "010-9876544",
      startDate: "2023-08-15",
      status: "Actief"
    }
  ]);

  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [isDirectorDialogOpen, setIsDirectorDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [activeTab, setActiveTab] = useState<"schools" | "directors">("schools");

  const [schoolForm, setSchoolForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: ""
  });

  const [directorForm, setDirectorForm] = useState({
    schoolId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    startDate: ""
  });

  const resetSchoolForm = () => {
    setSchoolForm({
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      description: ""
    });
    setEditingSchool(null);
  };

  const resetDirectorForm = () => {
    setDirectorForm({
      schoolId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      startDate: ""
    });
    setEditingDirector(null);
  };

  const handleAddSchool = () => {
    resetSchoolForm();
    setIsSchoolDialogOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name,
      address: school.address,
      phone: school.phone,
      email: school.email,
      website: school.website,
      description: school.description
    });
    setIsSchoolDialogOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchools(schools.filter(s => s.id !== school.id));
    setDirectors(directors.filter(d => d.schoolId !== school.id));
    toast({
      title: "School verwijderd",
      description: `${school.name} is succesvol verwijderd`,
    });
  };

  const handleSaveSchool = () => {
    if (!schoolForm.name || !schoolForm.email) {
      toast({
        title: "Fout",
        description: "Naam en email zijn verplicht",
        variant: "destructive"
      });
      return;
    }

    if (editingSchool) {
      setSchools(schools.map(s => 
        s.id === editingSchool.id 
          ? { ...s, ...schoolForm }
          : s
      ));
      toast({
        title: "School bijgewerkt",
        description: `${schoolForm.name} is succesvol bijgewerkt`,
      });
    } else {
      const newSchool: School = {
        id: schools.length + 1,
        ...schoolForm,
        directorsCount: 0,
        studentsCount: 0,
        status: "Actief"
      };
      setSchools([...schools, newSchool]);
      toast({
        title: "School toegevoegd",
        description: `${schoolForm.name} is succesvol toegevoegd`,
      });
    }

    setIsSchoolDialogOpen(false);
    resetSchoolForm();
  };

  const handleAddDirector = () => {
    resetDirectorForm();
    setIsDirectorDialogOpen(true);
  };

  const handleEditDirector = (director: Director) => {
    setEditingDirector(director);
    setDirectorForm({
      schoolId: director.schoolId.toString(),
      firstName: director.firstName,
      lastName: director.lastName,
      email: director.email,
      phone: director.phone,
      startDate: director.startDate
    });
    setIsDirectorDialogOpen(true);
  };

  const handleDeleteDirector = (director: Director) => {
    setDirectors(directors.filter(d => d.id !== director.id));
    
    // Update school directors count
    setSchools(schools.map(s => 
      s.id === director.schoolId 
        ? { ...s, directorsCount: Math.max(0, s.directorsCount - 1) }
        : s
    ));
    
    toast({
      title: "Directeur verwijderd",
      description: `${director.firstName} ${director.lastName} is succesvol verwijderd`,
    });
  };

  const handleSaveDirector = () => {
    if (!directorForm.schoolId || !directorForm.firstName || !directorForm.lastName || !directorForm.email) {
      toast({
        title: "Fout",
        description: "Alle velden behalve telefoon zijn verplicht",
        variant: "destructive"
      });
      return;
    }

    const selectedSchool = schools.find(s => s.id === parseInt(directorForm.schoolId));
    if (!selectedSchool) {
      toast({
        title: "Fout",
        description: "Selecteer een geldige school",
        variant: "destructive"
      });
      return;
    }

    if (editingDirector) {
      setDirectors(directors.map(d => 
        d.id === editingDirector.id 
          ? { 
              ...d, 
              schoolId: parseInt(directorForm.schoolId),
              schoolName: selectedSchool.name,
              firstName: directorForm.firstName,
              lastName: directorForm.lastName,
              email: directorForm.email,
              phone: directorForm.phone,
              startDate: directorForm.startDate
            }
          : d
      ));
      toast({
        title: "Directeur bijgewerkt",
        description: `${directorForm.firstName} ${directorForm.lastName} is succesvol bijgewerkt`,
      });
    } else {
      const newDirector: Director = {
        id: directors.length + 1,
        schoolId: parseInt(directorForm.schoolId),
        schoolName: selectedSchool.name,
        firstName: directorForm.firstName,
        lastName: directorForm.lastName,
        email: directorForm.email,
        phone: directorForm.phone,
        startDate: directorForm.startDate,
        status: "Actief"
      };
      setDirectors([...directors, newDirector]);
      
      // Update school directors count
      setSchools(schools.map(s => 
        s.id === parseInt(directorForm.schoolId)
          ? { ...s, directorsCount: s.directorsCount + 1 }
          : s
      ));
      
      toast({
        title: "Directeur toegevoegd",
        description: `${directorForm.firstName} ${directorForm.lastName} is succesvol toegevoegd`,
      });
    }

    setIsDirectorDialogOpen(false);
    resetDirectorForm();
  };

  const schoolColumns = [
    {
      key: "name" as keyof School,
      header: "Schoolnaam",
      render: (school: School) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{school.name}</div>
            <div className="text-sm text-gray-500">{school.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "address" as keyof School,
      header: "Adres",
      render: (school: School) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          {school.address}
        </div>
      )
    },
    {
      key: "phone" as keyof School,
      header: "Contact",
      render: (school: School) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            {school.phone}
          </div>
          {school.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-gray-400" />
              {school.website}
            </div>
          )}
        </div>
      )
    },
    {
      key: "directorsCount" as keyof School,
      header: "Directeuren",
      render: (school: School) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{school.directorsCount}</span>
        </div>
      )
    },
    {
      key: "studentsCount" as keyof School,
      header: "Studenten",
      render: (school: School) => (
        <span className="font-medium text-blue-600">{school.studentsCount}</span>
      )
    },
    {
      key: "status" as keyof School,
      header: "Status",
      render: (school: School) => (
        <Badge variant={school.status === "Actief" ? "default" : "secondary"}>
          {school.status}
        </Badge>
      )
    }
  ];

  const directorColumns = [
    {
      key: "firstName" as keyof Director,
      header: "Directeur",
      render: (director: Director) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {director.firstName} {director.lastName}
            </div>
            <div className="text-sm text-gray-500">{director.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "schoolName" as keyof Director,
      header: "School",
      render: (director: Director) => (
        <div className="font-medium text-blue-600">{director.schoolName}</div>
      )
    },
    {
      key: "phone" as keyof Director,
      header: "Telefoon",
      render: (director: Director) => (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-400" />
          {director.phone}
        </div>
      )
    },
    {
      key: "startDate" as keyof Director,
      header: "Startdatum",
      render: (director: Director) => director.startDate
    },
    {
      key: "status" as keyof Director,
      header: "Status",
      render: (director: Director) => (
        <Badge variant={director.status === "Actief" ? "default" : "secondary"}>
          {director.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <PremiumHeader
        title="Scholenbeheer"
        description="Beheer scholen en hun directeuren in het myMadrassa systeem"
        icon={Building}
        breadcrumbs={{ current: "Scholen" }}
      />

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("schools")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "schools"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Building className="inline h-4 w-4 mr-2" />
          Scholen
        </button>
        <button
          onClick={() => setActiveTab("directors")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "directors"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Directeuren
        </button>
      </div>

      {/* Schools Tab */}
      {activeTab === "schools" && (
        <SearchActionLayout
          searchPlaceholder="Zoek scholen..."
          onSearchChange={() => {}}
          actions={
            <Button onClick={handleAddSchool} className="flex items-center gap-2 hover:bg-green-700 bg-[#1e41af]">
              <Plus className="h-4 w-4" />
              School Toevoegen
            </Button>
          }
        >
          <StandardTable
            data={schools}
            columns={schoolColumns}
            onEdit={handleEditSchool}
            onDelete={handleDeleteSchool}
            searchPlaceholder="Zoek scholen..."
          />
        </SearchActionLayout>
      )}

      {/* Directors Tab */}
      {activeTab === "directors" && (
        <SearchActionLayout
          searchPlaceholder="Zoek directeuren..."
          onSearchChange={() => {}}
          actions={
            <Button onClick={handleAddDirector} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4" />
              Directeur Toevoegen
            </Button>
          }
        >
          <StandardTable
            data={directors}
            columns={directorColumns}
            onEdit={handleEditDirector}
            onDelete={handleDeleteDirector}
            searchPlaceholder="Zoek directeuren..."
          />
        </SearchActionLayout>
      )}

      {/* School Dialog */}
      <CustomDialog 
        open={isSchoolDialogOpen} 
        onOpenChange={setIsSchoolDialogOpen}
        title={editingSchool ? "School Bewerken" : "Nieuwe School Toevoegen"}
        description={editingSchool ? "Wijzig de schoolgegevens" : "Voeg een nieuwe school toe aan het systeem"}
        icon={Building}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Schoolnaam *</Label>
            <Input
              id="name"
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
              placeholder="Bijv. Madrassa Al-Noor"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={schoolForm.email}
              onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
              placeholder="info@school.nl"
            />
          </div>

          <div>
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={schoolForm.address}
              onChange={(e) => setSchoolForm({...schoolForm, address: e.target.value})}
              placeholder="Straat 123, 1234 AB Stad"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={schoolForm.phone}
                onChange={(e) => setSchoolForm({...schoolForm, phone: e.target.value})}
                placeholder="020-1234567"
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={schoolForm.website}
                onChange={(e) => setSchoolForm({...schoolForm, website: e.target.value})}
                placeholder="www.school.nl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={schoolForm.description}
              onChange={(e) => setSchoolForm({...schoolForm, description: e.target.value})}
              placeholder="Korte beschrijving van de school..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSchoolDialogOpen(false);
                resetSchoolForm();
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveSchool}>
              {editingSchool ? "Bijwerken" : "Toevoegen"}
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Director Dialog */}
      <CustomDialog 
        open={isDirectorDialogOpen} 
        onOpenChange={setIsDirectorDialogOpen}
        title={editingDirector ? "Directeur Bewerken" : "Nieuwe Directeur Toevoegen"}
        description={editingDirector ? "Wijzig de directeurgegevens" : "Voeg een nieuwe directeur toe aan een school"}
        icon={UserPlus}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="schoolId">School *</Label>
            <Select value={directorForm.schoolId} onValueChange={(value) => setDirectorForm({...directorForm, schoolId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Voornaam *</Label>
              <Input
                id="firstName"
                value={directorForm.firstName}
                onChange={(e) => setDirectorForm({...directorForm, firstName: e.target.value})}
                placeholder="Ahmed"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Achternaam *</Label>
              <Input
                id="lastName"
                value={directorForm.lastName}
                onChange={(e) => setDirectorForm({...directorForm, lastName: e.target.value})}
                placeholder="Hassan"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="directorEmail">Email *</Label>
            <Input
              id="directorEmail"
              type="email"
              value={directorForm.email}
              onChange={(e) => setDirectorForm({...directorForm, email: e.target.value})}
              placeholder="directeur@school.nl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="directorPhone">Telefoon</Label>
              <Input
                id="directorPhone"
                value={directorForm.phone}
                onChange={(e) => setDirectorForm({...directorForm, phone: e.target.value})}
                placeholder="020-1234567"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                value={directorForm.startDate}
                onChange={(e) => setDirectorForm({...directorForm, startDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDirectorDialogOpen(false);
                resetDirectorForm();
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveDirector}>
              {editingDirector ? "Bijwerken" : "Toevoegen"}
            </Button>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}