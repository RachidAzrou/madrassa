import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, UserCircle, Mail, Home, Phone, Briefcase, MapPin, FileText, Eye, AlertTriangle } from 'lucide-react';

// Guardian type definitie
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone?: string;
  address?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  isEmergencyContact: boolean;
  notes?: string;
  occupation?: string;
};

type StudentGuardianRelation = {
  id: number;
  studentId: number;
  guardianId: number;
  isPrimary: boolean;
  student?: {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    status?: string;
  };
};

interface GuardianDetailViewProps {
  guardian: GuardianType;
  guardianStudentsData: StudentGuardianRelation[];
  guardianStudentsLoading: boolean;
  getRelationshipLabel: (relationship: string) => string;
}

export const GuardianDetailView: React.FC<GuardianDetailViewProps> = ({
  guardian,
  guardianStudentsData,
  guardianStudentsLoading,
  getRelationshipLabel
}) => {
  return (
    <div className="mt-4 space-y-8">
      {/* Profielkaart */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <div className="flex flex-col items-center text-center p-6 border rounded-md bg-white shadow-sm">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="bg-[#1e3a8a] text-white text-2xl">
                {guardian.firstName ? guardian.firstName.charAt(0) : ''}{guardian.lastName ? guardian.lastName.charAt(0) : ''}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{guardian.firstName} {guardian.lastName}</h2>
            <p className="text-gray-500 mb-2">{getRelationshipLabel(guardian.relationship)}</p>
            {guardian.isEmergencyContact && (
              <Badge variant="destructive" className="mt-1">Noodcontact</Badge>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          {/* Contact informatie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <Label className="text-sm font-medium text-gray-700">Email</Label>
              </div>
              <div className="p-3 border rounded-md bg-gray-50">
                {guardian.email || 'Niet ingevuld'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <Label className="text-sm font-medium text-gray-700">Telefoonnummer</Label>
              </div>
              <div className="p-3 border rounded-md bg-gray-50">
                {guardian.phone || 'Niet ingevuld'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <Label className="text-sm font-medium text-gray-700">Adres</Label>
              </div>
              <div className="p-3 border rounded-md bg-gray-50">
                {guardian.street && guardian.houseNumber ? 
                  `${guardian.street} ${guardian.houseNumber}` : 
                  'Niet ingevuld'
                }
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <Label className="text-sm font-medium text-gray-700">Plaats</Label>
              </div>
              <div className="p-3 border rounded-md bg-gray-50">
                {guardian.postalCode && guardian.city ? 
                  `${guardian.postalCode} ${guardian.city}` : 
                  'Niet ingevuld'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Extra informatie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium text-gray-700">Relatie</Label>
          </div>
          <div className="p-3 border rounded-md bg-gray-50">
            {getRelationshipLabel(guardian.relationship)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium text-gray-700">Beroep</Label>
          </div>
          <div className="p-3 border rounded-md bg-gray-50">
            {guardian.occupation || 'Niet ingevuld'}
          </div>
        </div>
      </div>
      
      {/* Noodcontact info als van toepassing */}
      {guardian.isEmergencyContact && (
        <div className="p-5 border-l-4 border-red-600 bg-red-50 rounded-r-lg shadow-sm">
          <div className="flex items-center mb-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-red-800">Noodcontact</h3>
          </div>
          
          <p className="text-sm text-red-700 mb-3 ml-11">
            Dit contact is aangeduid als noodcontact voor de onderstaande studenten en kan gecontacteerd worden in noodgevallen.
          </p>
        </div>
      )}
      
      {/* Notities */}
      {guardian.notes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium text-gray-700">
              Notities
            </Label>
          </div>
          <div className="p-4 bg-gray-50 rounded-md min-h-[100px] border border-gray-200 text-sm">
            {guardian.notes}
          </div>
        </div>
      )}
      
      {/* Toegewezen studenten */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Toegewezen studenten</h3>
          </div>
          {guardianStudentsData && guardianStudentsData.length > 0 && (
            <Badge variant={guardian.isEmergencyContact ? "destructive" : "outline"} className="ml-2">
              {guardianStudentsData.length} {guardianStudentsData.length === 1 ? 'student' : 'studenten'}
            </Badge>
          )}
        </div>
        
        {guardianStudentsLoading ? (
          <div className="flex justify-center my-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : guardianStudentsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">Geen studenten gekoppeld</h3>
            <p className="text-sm text-gray-400">Deze voogd heeft nog geen gekoppelde studenten</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guardianStudentsData.map((relation) => {
              return (
                <div
                  key={relation.id}
                  className="flex items-center p-4 bg-white hover:bg-gray-50 border rounded-lg shadow-sm"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#1e3a8a] text-white text-lg">
                      {relation.student?.firstName?.[0] || '?'}{relation.student?.lastName?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    {relation.student ? (
                      <>
                        <div className="text-md font-medium">{relation.student.firstName} {relation.student.lastName}</div>
                        <div className="text-sm text-gray-500 flex items-center flex-wrap gap-2">
                          <span>#{relation.student.studentId}</span>
                          {relation.isPrimary && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Primair contact
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">Student #{relation.studentId}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-blue-600"
                    onClick={() => {
                      // Implementatie voor wanneer de knop wordt geklikt
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianDetailView;