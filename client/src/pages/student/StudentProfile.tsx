import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomDialogContent } from "@/components/ui/custom-dialog-content";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Camera,
  School,
  Users,
  BookOpen,
  GraduationCap,
  IdCard,
  Home,
  UserCheck,
  Clock,
  Award,
  Target
} from "lucide-react";

interface StudentProfile {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  enrollmentDate?: string;
  classId?: number;
  className?: string;
  status: string;
  photoUrl?: string;
  nationality?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  parentNames?: string;
  medicalInfo?: string;
}

interface StudentStats {
  currentGPA: number;
  totalSubjects: number;
  completedCredits: number;
  attendanceRate: number;
  enrollmentYear: string;
  academicYear: string;
}

export default function StudentProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<StudentProfile>>({});

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ['/api/student/profile'],
    staleTime: 60000,
  });

  const { data: stats } = useQuery<StudentStats>({
    queryKey: ['/api/student/profile/stats'],
    staleTime: 60000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<StudentProfile>) => {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
      setIsEditing(false);
      setEditedProfile({});
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profielgegevens zijn succesvol bijgewerkt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van je profiel.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setEditedProfile(profile || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile(prev => ({
          ...prev,
          photoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Profiel niet gevonden</p>
        </div>
      </div>
    );
  }

  const currentProfile = isEditing ? { ...profile, ...editedProfile } : profile;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijn Profiel</h1>
          <p className="text-gray-600">Bekijk en bewerk je persoonlijke gegevens</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Annuleren
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1e40af]/90"
              >
                {updateProfileMutation.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Persoonlijke Gegevens</TabsTrigger>
          <TabsTrigger value="academic">Academische Informatie</TabsTrigger>
          <TabsTrigger value="contact">Contact & Noodgeval</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-[#1e40af]">
                <User className="h-5 w-5 mr-2" />
                Profielfoto & Basisgegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={currentProfile.photoUrl} 
                      alt={`${currentProfile.firstName} ${currentProfile.lastName}`} 
                    />
                    <AvatarFallback className="text-2xl bg-[#1e40af] text-white">
                      {currentProfile.firstName?.charAt(0)}{currentProfile.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-[#1e40af] text-white p-2 rounded-full cursor-pointer hover:bg-[#1e40af]/90">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentProfile.firstName} {currentProfile.lastName}
                  </h3>
                  <p className="text-gray-600">Student ID: {currentProfile.studentId}</p>
                  <Badge variant="outline" className="mt-2">
                    {currentProfile.status}
                  </Badge>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Voornaam</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.firstName}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        firstName: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Achternaam</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.lastName}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        lastName: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Geboortedatum
                  </Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={currentProfile.dateOfBirth}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        dateOfBirth: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.dateOfBirth || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Geslacht</Label>
                  {isEditing ? (
                    <select
                      value={currentProfile.gender || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        gender: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    >
                      <option value="">Selecteer...</option>
                      <option value="Man">Man</option>
                      <option value="Vrouw">Vrouw</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.gender || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Nationaliteit</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.nationality || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        nationality: e.target.value
                      }))}
                      placeholder="Bijv. Nederlandse"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.nationality || 'Niet opgegeven'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-[#1e40af]">
                  <School className="h-5 w-5 mr-2" />
                  Academische Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Klas</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{currentProfile.className || 'Niet toegewezen'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Inschrijfdatum</span>
                  </div>
                  <p className="text-sm text-gray-900">{currentProfile.enrollmentDate || 'Niet opgegeven'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge variant="outline" className="text-[#1e40af] border-[#1e40af]">
                    {currentProfile.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-[#1e40af]">
                    <Award className="h-5 w-5 mr-2" />
                    Academische Prestaties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-[#1e40af]">{stats.currentGPA.toFixed(1)}</p>
                      <p className="text-xs text-gray-600">Gemiddeld Cijfer</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
                      <p className="text-xs text-gray-600">Aanwezigheid</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Totaal Vakken:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.totalSubjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Academisch Jaar:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.academicYear}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-[#1e40af]">
                  <Mail className="h-5 w-5 mr-2" />
                  Contactgegevens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 inline mr-1" />
                    E-mailadres
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={currentProfile.email}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefoonnummer
                  </Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={currentProfile.phone || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      placeholder="Bijv. 06-12345678"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.phone || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    <Home className="h-4 w-4 inline mr-1" />
                    Adres
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={currentProfile.address || ''}
                        onChange={(e) => setEditedProfile(prev => ({
                          ...prev,
                          address: e.target.value
                        }))}
                        placeholder="Straat en huisnummer"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={currentProfile.postalCode || ''}
                          onChange={(e) => setEditedProfile(prev => ({
                            ...prev,
                            postalCode: e.target.value
                          }))}
                          placeholder="Postcode"
                        />
                        <Input
                          value={currentProfile.city || ''}
                          onChange={(e) => setEditedProfile(prev => ({
                            ...prev,
                            city: e.target.value
                          }))}
                          placeholder="Plaats"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900">
                      {currentProfile.address && (
                        <p>{currentProfile.address}</p>
                      )}
                      {(currentProfile.postalCode || currentProfile.city) && (
                        <p>{currentProfile.postalCode} {currentProfile.city}</p>
                      )}
                      {!currentProfile.address && !currentProfile.postalCode && !currentProfile.city && (
                        <p>Niet opgegeven</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-[#1e40af]">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Noodcontact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ouders/Voogden</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.parentNames || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        parentNames: e.target.value
                      }))}
                      placeholder="Namen van ouders/voogden"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.parentNames || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Noodcontactpersoon</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.emergencyContact || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        emergencyContact: e.target.value
                      }))}
                      placeholder="Naam noodcontactpersoon"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.emergencyContact || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Noodtelefoonnummer</Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={currentProfile.emergencyPhone || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        emergencyPhone: e.target.value
                      }))}
                      placeholder="Telefoonnummer noodcontact"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.emergencyPhone || 'Niet opgegeven'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Medische informatie</Label>
                  {isEditing ? (
                    <textarea
                      value={currentProfile.medicalInfo || ''}
                      onChange={(e) => setEditedProfile(prev => ({
                        ...prev,
                        medicalInfo: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e40af] resize-none"
                      rows={3}
                      placeholder="Belangrijke medische informatie..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{currentProfile.medicalInfo || 'Geen bijzonderheden'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}