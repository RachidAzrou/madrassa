import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PremiumHeader } from '@/components/layout/premium-header';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Admin',
    lastName: 'Gebruiker',
    email: 'admin@mymadrassa.nl',
    phone: '+31 6 12345678',
    address: 'Voorbeeldstraat 123',
    city: 'Amsterdam',
    postalCode: '1234 AB',
    bio: 'Beheerder van het myMadrassa systeem. Verantwoordelijk voor het dagelijks beheer van de school en ondersteuning van docenten en studenten.'
  });

  const handleSave = () => {
    // Hier zou je de gegevens opslaan naar de backend
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset formulier naar originele waarden
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumHeader
        title="Mijn Profiel"
        description="Beheer je persoonlijke gegevens en account instellingen"
        icon={User}
        breadcrumbs={{
          current: "Mijn Profiel"
        }}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profiel Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-[#1e40af] text-white text-xl">
                  {formData.firstName[0]}{formData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-gray-600">Beheerder</p>
                <p className="text-sm text-gray-500">Lid sinds januari 2024</p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#1e40af] hover:bg-[#1e40af]/90"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Opslaan
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuleren
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Persoonlijke Gegevens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#1e40af]" />
                Persoonlijke Gegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Voornaam</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-2 rounded">{formData.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Achternaam</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-2 rounded">{formData.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {formData.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefoonnummer</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {formData.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adresgegevens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1e40af]" />
                Adresgegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Straat en huisnummer</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded">{formData.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  {isEditing ? (
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-2 rounded">{formData.postalCode}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Plaats</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-2 rounded">{formData.city}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#1e40af]" />
              Over mij
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="bio">Beschrijving</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="text-sm bg-gray-50 p-3 rounded">{formData.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}