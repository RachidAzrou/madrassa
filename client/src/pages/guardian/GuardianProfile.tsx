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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Home,
  Briefcase
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

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function GuardianProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Guardian>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
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
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van uw profiel.",
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/guardian/password', {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Wachtwoord gewijzigd",
        description: "Uw wachtwoord is succesvol bijgewerkt.",
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij wachtwoord wijzigen",
        description: error.message || "Er is een fout opgetreden bij het wijzigen van uw wachtwoord.",
        variant: "destructive",
      });
    }
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

  // Password management functions
  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Wachtwoorden komen niet overeen",
        description: "Het nieuwe wachtwoord en bevestiging moeten hetzelfde zijn.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Wachtwoord te kort",
        description: "Het wachtwoord moet minimaal 8 karakters lang zijn.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
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
    <div className="max-w-7xl mx-auto">
      {/* Header - Teacher Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mijn Profiel</h1>
            <p className="text-gray-600 mt-1">Beheer uw persoonlijke informatie en accountinstellingen</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header Card - Teacher Style */}
      <Card className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-blue-100 text-lg capitalize">{profile.relationship}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-blue-100">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-blue-100">{profile.phone}</span>
                </div>
                <Badge className={`${profile.isEmergencyContact 
                  ? 'bg-yellow-500/20 text-yellow-100 border-yellow-300' 
                  : 'bg-white/20 text-white border-white/30'}`}>
                  {profile.isEmergencyContact ? 'Noodcontact' : 'Reguliere voogd'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content - Teacher Style */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Persoonlijk
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Beveiliging
          </TabsTrigger>
          <TabsTrigger value="children" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kinderen
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#1e40af]" />
                  Persoonlijke Informatie
                </CardTitle>
                <CardDescription>
                  Uw basis contactgegevens en persoonlijke informatie
                </CardDescription>
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
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Basis Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Voornaam</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Achternaam</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.lastName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Beroep</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.occupation || ''}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.occupation || 'Niet opgegeven'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Heart className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Relatie</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.relationship || ''}
                        onChange={(e) => handleInputChange('relationship', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 capitalize">{profile.relationship}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Email</span>
                    </div>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 break-all">{profile.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Telefoon</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Adres Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Straat</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.street || ''}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.street || 'Niet opgegeven'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Huisnummer</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.houseNumber || ''}
                        onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.houseNumber || 'Niet opgegeven'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Postcode</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.postalCode || ''}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.postalCode || 'Niet opgegeven'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Stad</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.city || 'Niet opgegeven'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(isEditing || profile.notes) && (
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Aanvullende Informatie
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-medium uppercase tracking-wide">Opmerkingen</span>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={editedData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        placeholder="Aanvullende opmerkingen..."
                        className="text-sm font-medium text-gray-900"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{profile.notes || 'Geen opmerkingen'}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#1e40af]" />
                Wachtwoord wijzigen
              </CardTitle>
              <CardDescription>
                Wijzig uw wachtwoord voor extra beveiliging
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Wachtwoord wijzigen
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        placeholder="Voer uw huidige wachtwoord in"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Voer uw nieuwe wachtwoord in"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Bevestig uw nieuwe wachtwoord"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handlePasswordSave}
                      disabled={updatePasswordMutation.isPending}
                      className="bg-[#1e40af] hover:bg-[#1e40af]/90 flex-1"
                    >
                      {updatePasswordMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Wachtwoord opslaan
                    </Button>
                    <Button
                      onClick={handlePasswordCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


        </TabsContent>

        {/* Children Tab */}
        <TabsContent value="children" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1e40af]" />
                Mijn Kinderen
              </CardTitle>
              <CardDescription>
                Overzicht van uw kinderen op school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.id} className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#1e40af] text-white text-sm font-medium">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <span className="text-xs font-medium uppercase tracking-wide">Student ID</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{child.studentId}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <span className="text-xs font-medium uppercase tracking-wide">Klas</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{child.class}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <span className="text-xs font-medium uppercase tracking-wide">Status</span>
                            </div>
                            <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                              {child.status === 'active' ? 'Actief' : 'Inactief'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {children.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen kinderen gevonden</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}