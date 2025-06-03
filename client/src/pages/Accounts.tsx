import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Key, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Eye, 
  EyeOff,
  Shield,
  FileText,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/components/common/PageHeader";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { CustomDialogContent } from "@/components/ui/custom-dialog-content";
import { apiRequest } from "@/lib/queryClient";

interface UserAccount {
  id: number;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'guardian' | 'secretariat' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  personId: number;
  firstName: string;
  lastName: string;
  personType: string;
}

interface AccountFormData {
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'guardian' | 'secretariat' | 'admin';
  personId: number;
  isActive: boolean;
}

export default function Accounts() {
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<AccountFormData>({
    email: "",
    password: "",
    role: "student",
    personId: 0,
    isActive: true
  });
  const [bulkRole, setBulkRole] = useState<'student' | 'teacher' | 'guardian'>('student');
  const [selectedPersons, setSelectedPersons] = useState<number[]>([]);
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState("{firstName}.{lastName}@mymadrassa.nl");

  // Fetch data
  const { data: accountsData = [], isLoading } = useQuery({
    queryKey: ["/api/accounts"]
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ["/api/teachers"]
  });

  const { data: studentsData = [] } = useQuery({
    queryKey: ["/api/students"]
  });

  const { data: guardiansData = [] } = useQuery({
    queryKey: ["/api/guardians"]
  });

  const availablePersons = [
    ...(teachersData?.teachers || []).map((t: any) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      type: 'teacher'
    })),
    ...(studentsData || []).map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      type: 'student'
    })),
    ...(guardiansData || []).map((g: any) => ({
      id: g.id,
      name: `${g.firstName} ${g.lastName}`,
      type: 'guardian'
    }))
  ];

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      return apiRequest("/api/accounts", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsAddDialogOpen(false);
      resetForm();
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AccountFormData> }) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsEditDialogOpen(false);
      resetForm();
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDeleteDialogOpen(false);
    }
  });

  const bulkCreateAccountsMutation = useMutation({
    mutationFn: async (accounts: AccountFormData[]) => {
      return apiRequest("/api/accounts/bulk", {
        method: "POST",
        body: JSON.stringify({ accounts })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsBulkDialogOpen(false);
      resetBulkForm();
    }
  });

  // Utility functions
  const generateDefaultPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const resetForm = () => {
    setAccountFormData({
      email: "",
      password: "",
      role: "student",
      personId: 0,
      isActive: true
    });
    setSelectedAccount(null);
  };

  const resetBulkForm = () => {
    setSelectedPersons([]);
    setBulkRole('student');
    setBulkEmailTemplate("{firstName}.{lastName}@mymadrassa.nl");
  };

  const generateEmailFromTemplate = (firstName: string, lastName: string) => {
    return bulkEmailTemplate
      .replace('{firstName}', firstName.toLowerCase())
      .replace('{lastName}', lastName.toLowerCase())
      .replace(/\s+/g, '');
  };

  const getPersonsByRole = () => {
    const dataMap = {
      student: studentsData || [],
      teacher: teachersData?.teachers || [],
      guardian: guardiansData || []
    };
    return dataMap[bulkRole] || [];
  };

  // Role styling
  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: { label: "Administrator", color: "bg-red-100 text-red-800 border-red-200" },
      secretariat: { label: "Secretariaat", color: "bg-orange-100 text-orange-800 border-orange-200" },
      teacher: { label: "Docent", color: "bg-green-100 text-green-800 border-green-200" },
      guardian: { label: "Voogd", color: "bg-purple-100 text-purple-800 border-purple-200" },
      student: { label: "Student", color: "bg-blue-100 text-blue-800 border-blue-200" }
    };

    const roleInfo = roleMap[role as keyof typeof roleMap] || { label: role, color: "bg-gray-100 text-gray-800 border-gray-200" };
    
    return (
      <Badge variant="outline" className={`${roleInfo.color} border`}>
        {roleInfo.label}
      </Badge>
    );
  };

  // Event handlers
  const handleCreateAccount = () => {
    const password = accountFormData.password || generateDefaultPassword();
    createAccountMutation.mutate({
      ...accountFormData,
      password
    });
  };

  const handleUpdateAccount = () => {
    if (!selectedAccount) return;
    const updateData = { ...accountFormData };
    if (!updateData.password) {
      delete (updateData as any).password; // Don't update password if empty
    }
    updateAccountMutation.mutate({
      id: selectedAccount.id,
      data: updateData
    });
  };

  const handleEditAccount = (account: UserAccount) => {
    setSelectedAccount(account);
    setAccountFormData({
      email: account.email,
      password: '',
      role: account.role,
      personId: account.personId,
      isActive: account.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteAccount = (account: UserAccount) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkCreateAccounts = () => {
    const selectedPersonsData = getPersonsByRole().filter((person: any) => 
      selectedPersons.includes(person.id)
    );

    const accounts = selectedPersonsData.map((person: any) => ({
      email: generateEmailFromTemplate(person.firstName, person.lastName),
      password: generateDefaultPassword(),
      role: bulkRole,
      personId: person.id,
      isActive: true
    }));

    bulkCreateAccountsMutation.mutate(accounts);
  };

  // Filter accounts
  const filteredAccounts = (accountsData as UserAccount[]).filter((account: UserAccount) => {
    const matchesSearch = 
      account.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && account.isActive) ||
      (statusFilter === "inactive" && !account.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const accountStats = {
    total: (accountsData as UserAccount[]).length,
    students: (accountsData as UserAccount[]).filter((a: UserAccount) => a.role === 'student').length,
    teachers: (accountsData as UserAccount[]).filter((a: UserAccount) => a.role === 'teacher').length,
    guardians: (accountsData as UserAccount[]).filter((a: UserAccount) => a.role === 'guardian').length,
    secretariat: (accountsData as UserAccount[]).filter((a: UserAccount) => a.role === 'secretariat').length,
    admin: (accountsData as UserAccount[]).filter((a: UserAccount) => a.role === 'admin').length,
    active: (accountsData as UserAccount[]).filter((a: UserAccount) => a.isActive).length
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Accountbeheer"
        description="Beheer gebruikersaccounts en toegangsrechten"
        icon={<Key className="h-8 w-8" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{accountStats.total}</div>
            <p className="text-sm text-gray-600">Totaal</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{accountStats.students}</div>
            <p className="text-sm text-gray-600">Studenten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{accountStats.teachers}</div>
            <p className="text-sm text-gray-600">Docenten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{accountStats.guardians}</div>
            <p className="text-sm text-gray-600">Voogden</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{accountStats.secretariat}</div>
            <p className="text-sm text-gray-600">Secretariaat</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{accountStats.admin}</div>
            <p className="text-sm text-gray-600">Admins</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{accountStats.active}</div>
            <p className="text-sm text-gray-600">Actief</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Zoek accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter op rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle rollen</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="secretariat">Secretariaat</SelectItem>
              <SelectItem value="teacher">Docent</SelectItem>
              <SelectItem value="guardian">Voogd</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter op status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="inactive">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporteer
          </Button>
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} size="sm">
            <Users className="h-4 w-4 mr-2" />
            Bulk Aanmaken
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Account Toevoegen
          </Button>
        </div>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Gebruiker</th>
                  <th className="text-left p-4 font-medium text-gray-900">Email</th>
                  <th className="text-left p-4 font-medium text-gray-900">Rol</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900">Laatste Login</th>
                  <th className="text-left p-4 font-medium text-gray-900">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account: UserAccount) => (
                  <tr key={account.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {account.firstName[0]}{account.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {account.firstName} {account.lastName}
                          </div>
                          <div className="text-sm text-gray-500">ID: {account.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-900">{account.email}</td>
                    <td className="p-4">{getRoleDisplay(account.role)}</td>
                    <td className="p-4">
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-600">
                      {account.lastLogin 
                        ? format(parseISO(account.lastLogin), "dd MMM yyyy HH:mm", { locale: nl })
                        : "Nooit ingelogd"
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAccounts.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Geen accounts gevonden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <CustomDialogContent>
          <DialogHeader>
            <DialogTitle>Account Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuw gebruikersaccount toe aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                placeholder="gebruiker@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Wachtwoord (optioneel)</Label>
              <Input
                id="password"
                type="password"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                placeholder="Laat leeg voor automatisch wachtwoord"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={accountFormData.role} 
                onValueChange={(value: any) => setAccountFormData({ ...accountFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="secretariat">Secretariaat</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="person">Gekoppelde Persoon</Label>
              <Select 
                value={accountFormData.personId.toString()} 
                onValueChange={(value) => setAccountFormData({ ...accountFormData, personId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer persoon" />
                </SelectTrigger>
                <SelectContent>
                  {availablePersons.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name} ({person.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={accountFormData.isActive}
                onCheckedChange={(checked) => 
                  setAccountFormData({ ...accountFormData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">Account is actief</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={createAccountMutation.isPending}
            >
              {createAccountMutation.isPending ? "Toevoegen..." : "Account Toevoegen"}
            </Button>
          </DialogFooter>
        </CustomDialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <CustomDialogContent>
          <DialogHeader>
            <DialogTitle>Account Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de accountinstellingen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-password">Nieuw Wachtwoord (optioneel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                placeholder="Laat leeg om ongewijzigd te laten"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select 
                value={accountFormData.role} 
                onValueChange={(value: any) => setAccountFormData({ ...accountFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="secretariat">Secretariaat</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={accountFormData.isActive}
                onCheckedChange={(checked) => 
                  setAccountFormData({ ...accountFormData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="edit-isActive">Account is actief</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleUpdateAccount}
              disabled={updateAccountMutation.isPending}
            >
              {updateAccountMutation.isPending ? "Opslaan..." : "Wijzigingen Opslaan"}
            </Button>
          </DialogFooter>
        </CustomDialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Accounts Aanmaken</DialogTitle>
            <DialogDescription>
              Selecteer personen om accounts voor aan te maken
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <Label htmlFor="bulk-role">Rol Type</Label>
              <Select value={bulkRole} onValueChange={(value: 'student' | 'teacher' | 'guardian') => setBulkRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Studenten</SelectItem>
                  <SelectItem value="teacher">Docenten</SelectItem>
                  <SelectItem value="guardian">Voogden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Template */}
            <div>
              <Label htmlFor="email-template">Email Template</Label>
              <Input
                id="email-template"
                value={bulkEmailTemplate}
                onChange={(e) => setBulkEmailTemplate(e.target.value)}
                placeholder="{firstName}.{lastName}@mymadrassa.nl"
              />
              <p className="text-sm text-gray-500 mt-1">
                Gebruik {'{firstName}'} en {'{lastName}'} als placeholders
              </p>
            </div>

            {/* Person Selection */}
            <div>
              <Label>Selecteer {bulkRole === 'student' ? 'Studenten' : bulkRole === 'teacher' ? 'Docenten' : 'Voogden'}</Label>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {getPersonsByRole().map((person: any) => (
                  <div key={person.id} className="flex items-center space-x-2 p-3 border-b">
                    <Checkbox
                      id={`person-${person.id}`}
                      checked={selectedPersons.includes(person.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPersons([...selectedPersons, person.id]);
                        } else {
                          setSelectedPersons(selectedPersons.filter(id => id !== person.id));
                        }
                      }}
                    />
                    <Label htmlFor={`person-${person.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>{person.firstName} {person.lastName}</span>
                        <span className="text-sm text-gray-500">
                          {generateEmailFromTemplate(person.firstName, person.lastName)}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedPersons.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Overzicht</h4>
                <p className="text-blue-700">
                  {selectedPersons.length} accounts worden aangemaakt voor {bulkRole === 'student' ? 'studenten' : bulkRole === 'teacher' ? 'docenten' : 'voogden'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Automatisch gegenereerde wachtwoorden worden gebruikt
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleBulkCreateAccounts}
              disabled={selectedPersons.length === 0 || bulkCreateAccountsMutation.isPending}
            >
              {bulkCreateAccountsMutation.isPending ? "Aanmaken..." : `${selectedPersons.length} Accounts Aanmaken`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (accountToDelete) {
            deleteAccountMutation.mutate(accountToDelete.id);
          }
        }}
        title="Account Verwijderen"
        description={`Weet je zeker dat je het account van ${accountToDelete?.firstName} ${accountToDelete?.lastName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        isLoading={deleteAccountMutation.isPending}
      />
    </div>
  );
}