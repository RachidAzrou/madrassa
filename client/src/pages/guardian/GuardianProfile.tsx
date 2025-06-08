import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Heart,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";

interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  relationship: string;
  occupation: string;
  isEmergencyContact: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
  dateOfBirth: string;
  status: string;
}

export default function GuardianProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Guardian>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: profile, isLoading: profileLoading } = useQuery<Guardian>({
    queryKey: ['/api/guardian/profile'],
    retry: false,
  });

  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/guardian/children'],
    retry: false,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Guardian>) => {
      const response = await fetch('/api/guardian/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message || 'Update failed'}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profiel bijgewerkt",
        description: "Uw profiel is succesvol bijgewerkt.",
      });
      setIsEditing(false);
      setEditedData({});
      queryClient.invalidateQueries({ queryKey: ['/api/guardian/profile'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van uw profiel.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleSave = () => {
    if (editedData) {
      updateProfileMutation.mutate(editedData);
    }
  };

  const handleInputChange = (field: keyof Guardian, value: string | boolean) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (profileLoading || childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#1e40af] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Profiel laden...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profiel niet gevonden</h3>
          <p className="text-gray-600">Uw profiel kon niet worden geladen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mijn Profiel</h1>
            <p className="text-gray-600">Beheer uw persoonlijke informatie en voorkeuren</p>
          </div>
          
          {!isEditing ? (
            <Button onClick={handleEdit} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
              <Edit3 className="w-4 h-4 mr-2" />
              Bewerken
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleCancel} 
                variant="outline"
                disabled={updateProfileMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Annuleren
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-[#1e40af] hover:bg-[#1e40af]/90"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1e40af]" />
                  Persoonlijke Informatie
                </CardTitle>
                <CardDescription>
                  Uw basis contactgegevens en persoonlijke informatie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-[#1e40af] text-white text-xl">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h3>
                    <p className="text-gray-600 capitalize">{profile.relationship}</p>
                    <Badge variant="secondary" className="mt-1">
                      {profile.isEmergencyContact ? 'Noodcontact' : 'Reguliere voogd'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editedData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.firstName}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editedData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.lastName}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {profile.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoon</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {profile.phone}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Beroep</Label>
                    {isEditing ? (
                      <Input
                        id="occupation"
                        value={editedData.occupation || ''}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.occupation}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relatie</Label>
                    {isEditing ? (
                      <Input
                        id="relationship"
                        value={editedData.relationship || ''}
                        onChange={(e) => handleInputChange('relationship', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md capitalize">{profile.relationship}</div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1e40af]" />
                    Adresgegevens
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Straat</Label>
                      {isEditing ? (
                        <Input
                          id="street"
                          value={editedData.street || ''}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                        />
                      ) : (
                        <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.street}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Huisnummer</Label>
                      {isEditing ? (
                        <Input
                          id="houseNumber"
                          value={editedData.houseNumber || ''}
                          onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                        />
                      ) : (
                        <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.houseNumber}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postcode</Label>
                      {isEditing ? (
                        <Input
                          id="postalCode"
                          value={editedData.postalCode || ''}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        />
                      ) : (
                        <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.postalCode}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Stad</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={editedData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      ) : (
                        <div className="py-2 px-3 bg-gray-50 rounded-md">{profile.city}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Opmerkingen</Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      value={editedData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Aanvullende opmerkingen..."
                    />
                  ) : (
                    <div className="py-2 px-3 bg-gray-50 rounded-md min-h-[80px]">
                      {profile.notes || 'Geen opmerkingen'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children and Quick Info */}
          <div className="space-y-6">
            {/* Children Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1e40af]" />
                  Mijn Kinderen
                </CardTitle>
                <CardDescription>
                  Overzicht van uw kinderen op school
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#1e40af] text-white text-sm">
                            {child.firstName[0]}{child.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{child.firstName} {child.lastName}</h4>
                          <p className="text-sm text-gray-600">ID: {child.studentId}</p>
                          <p className="text-sm text-gray-600">Klas: {child.class}</p>
                        </div>
                        <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                          {child.status === 'active' ? 'Actief' : 'Inactief'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Geen kinderen gevonden
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1e40af]" />
                  Account Informatie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">Actief</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Noodcontact</span>
                  <Badge variant={profile.isEmergencyContact ? "default" : "secondary"}>
                    {profile.isEmergencyContact ? "Ja" : "Nee"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Lid sinds</span>
                  <span className="text-sm font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Laatst bijgewerkt</span>
                  <span className="text-sm font-medium">
                    {new Date(profile.updatedAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}