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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<AccountFormData>({
    email: '',
    password: '',
    role: 'student',
    personId: 0,
    isActive: true
  });
  const [bulkCreateOptions, setBulkCreateOptions] = useState({
    type: 'students', // 'students', 'teachers', 'guardians', 'class'
    classId: '',
    defaultPassword: 'Welkom123!'
  });
  const [showPassword, setShowPassword] = useState(false);

  // Queries
  const { data: accountsData = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: studentsData = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ["/api/teachers"],
  });

  const { data: guardiansData = [] } = useQuery({
    queryKey: ["/api/guardians"],
  });

  const { data: studentGroupsData = [] } = useQuery({
    queryKey: ["/api/student-groups"],
  });

  // Combine all persons for account creation
  const availablePersons = [
    ...(Array.isArray(studentsData) ? studentsData.map((s: any) => ({ ...s, type: 'Student' })) : []),
    ...(Array.isArray(teachersData?.teachers) ? teachersData.teachers.map((t: any) => ({ ...t, type: 'Docent' })) : []),
    ...(Array.isArray(guardiansData) ? guardiansData.map((g: any) => ({ ...g, type: 'Voogd' })) : [])
  ].filter(person => !accountsData.some((account: any) => account.personId === person.id));

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      return apiRequest("/api/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AccountFormData> }) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });

  const bulkCreateAccountsMutation = useMutation({
    mutationFn: async (data: { type: string; classId?: string; defaultPassword: string }) => {
      return apiRequest("/api/accounts/bulk", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsBulkCreateDialogOpen(false);
      toast({
        title: "Succes",
        description: `${result.created} accounts succesvol aangemaakt.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bulk aanmaken van accounts.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const generateDefaultPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const resetForm = () => {
    setAccountFormData({
      email: '',
      password: '',
      role: 'student',
      personId: 0,
      isActive: true
    });
    setSelectedAccount(null);
  };



  const getPersonOptions = (role: string) => {
    switch (role) {
      case 'student':
        return studentsData;
      case 'teacher':
        return teachersData;
      case 'guardian':
        return guardiansData;
      default:
        return [];
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      student: { label: "Student", color: "bg-blue-100 text-blue-800" },
      teacher: { label: "Docent", color: "bg-green-100 text-green-800" },
      guardian: { label: "Voogd", color: "bg-purple-100 text-purple-800" },
      secretariat: { label: "Secretariaat", color: "bg-orange-100 text-orange-800" },
      admin: { label: "Admin", color: "bg-red-100 text-red-800" }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={`text-xs ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
        {isActive ? "Actief" : "Inactief"}
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
      delete updateData.password; // Don't update password if empty
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
    bulkCreateAccountsMutation.mutate(bulkCreateOptions);
  };



  // Filter accounts
  const filteredAccounts = accountsData.filter((account: UserAccount) => {
    const matchesSearch = 
      (account.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && account.isActive) ||
      (statusFilter === "inactive" && !account.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const accountStats = {
    students: accountsData.filter((a: UserAccount) => a.role === 'student').length,
    teachers: accountsData.filter((a: UserAccount) => a.role === 'teacher').length,
    guardians: accountsData.filter((a: UserAccount) => a.role === 'guardian').length,
    secretariat: accountsData.filter((a: UserAccount) => a.role === 'secretariat').length,
    admin: accountsData.filter((a: UserAccount) => a.role === 'admin').length,
    active: accountsData.filter((a: UserAccount) => a.isActive).length
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Account Beheer"
        description="Beheer gebruikersaccounts en toegangsrechten voor het systeem."
      />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Studenten</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.students}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Docenten</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.teachers}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-sm">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Voogden</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.guardians}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-sm">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Secretariaat</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.secretariat}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-sm">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Administrator</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.admin}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-sm">
                  <Settings className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Actief</p>
                  <p className="text-xl font-bold text-gray-900">{accountStats.active}</p>
                </div>
                <div className="p-2 bg-teal-100 rounded-sm">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Account Beheer</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{filteredAccounts.length} accounts</span>
              <Button 
                onClick={() => setIsBulkCreateDialogOpen(true)}
                variant="outline"
                className="h-8 text-xs px-3 rounded-sm border-[#e5e7eb]"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Bulk Aanmaken
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white h-8 text-xs px-3 rounded-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Account Toevoegen
              </Button>
            </div>
          </div>

          <div className="p-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <Input
                  placeholder="Zoek accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs border-[#e5e7eb] rounded-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterOptions(!showFilterOptions)}
                  className="h-7 px-2 rounded-sm border-[#e5e7eb] text-xs"
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                  className="h-7 px-2 rounded-sm border-[#e5e7eb] text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilterOptions && (
              <div className="mb-4 p-3 bg-gray-50 border border-[#e5e7eb] rounded-sm">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">Rol:</label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Docent</SelectItem>
                        <SelectItem value="guardian">Voogd</SelectItem>
                        <SelectItem value="secretariat">Secretariaat</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">Status:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts List */}
            {isAccountsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                  <Key className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Geen accounts beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm"
                >
                  Account toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAccounts.map((account: UserAccount) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-800">{account.firstName} {account.lastName}</h4>
                        {getRoleBadge(account.role)}
                        {getStatusBadge(account.isActive)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{account.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setAccountToDelete(account);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <CustomDialogContent>
          <div className="bg-[#1e40af] text-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white">Nieuw Account Aanmaken</h2>
                <p className="text-sm text-blue-100 mt-1">Voeg een nieuw gebruikersaccount toe aan het systeem</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="create-person">Persoon Selecteren</Label>
              <Select value={accountFormData.personId?.toString() || ""} onValueChange={(value) => setAccountFormData(prev => ({ ...prev, personId: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een persoon" />
                </SelectTrigger>
                <SelectContent>
                  {availablePersons.map((person: any) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.firstName} {person.lastName} ({person.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="create-password">Wachtwoord</Label>
              <Input
                id="create-password"
                type="password"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Wachtwoord"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Rol</Label>
              <Select value={accountFormData.role} onValueChange={(value: any) => setAccountFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="secretariat">Secretariaat</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="create-isActive"
                checked={accountFormData.isActive}
                onCheckedChange={(checked) => setAccountFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="create-isActive">Account is actief</Label>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={!accountFormData.email || !accountFormData.personId}
              className="bg-[#1e40af] hover:bg-[#1d4ed8]"
            >
              Account Aanmaken
            </Button>
          </div>
        </CustomDialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <CustomDialogContent>
          <div className="bg-[#059669] text-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white">Account Bewerken</h2>
                <p className="text-sm text-green-100 mt-1">Pas de accountgegevens aan</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Nieuw Wachtwoord (optioneel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Laat leeg om hetzelfde te houden"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={accountFormData.role} onValueChange={(value: any) => setAccountFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="secretariat">Secretariaat</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-isActive"
                checked={accountFormData.isActive}
                onCheckedChange={(checked) => setAccountFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="edit-isActive">Account is actief</Label>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleUpdateAccount}
              disabled={!accountFormData.email}
              className="bg-[#059669] hover:bg-[#047857]"
            >
              Account Bijwerken
            </Button>
          </div>
        </CustomDialogContent>
      </Dialog>

      {/* Bulk Create Accounts Dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <CustomDialogContent className="max-w-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Accounts Aanmaken</h2>
            <p className="text-sm text-gray-600 mt-1">Maak accounts aan voor meerdere personen tegelijk</p>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bulk-type" className="text-sm font-medium text-gray-700">
                Selecteer Type
              </Label>
              <Select value={bulkCreateOptions.type} onValueChange={(value) => setBulkCreateOptions(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Kies een optie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Alle Studenten</SelectItem>
                  <SelectItem value="teachers">Alle Docenten</SelectItem>
                  <SelectItem value="guardians">Alle Voogden</SelectItem>
                  <SelectItem value="class">Studenten van Specifieke Klas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkCreateOptions.type === 'class' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-class" className="text-sm font-medium text-gray-700">
                  Selecteer Klas
                </Label>
                <Select value={bulkCreateOptions.classId} onValueChange={(value) => setBulkCreateOptions(prev => ({ ...prev, classId: value }))}>
                  <SelectTrigger className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Kies een klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(studentGroupsData) && studentGroupsData.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="bulk-password" className="text-sm font-medium text-gray-700">
                Standaard Wachtwoord
              </Label>
              <div className="relative">
                <Input
                  id="bulk-password"
                  type={showPassword ? "text" : "password"}
                  value={bulkCreateOptions.defaultPassword}
                  onChange={(e) => setBulkCreateOptions(prev => ({ ...prev, defaultPassword: e.target.value }))}
                  placeholder="Voer wachtwoord in voor alle accounts"
                  className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-9 w-9 px-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Dit wachtwoord wordt gebruikt voor alle nieuwe accounts
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkCreateDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleBulkCreateAccounts}
              disabled={bulkCreateAccountsMutation.isPending || !bulkCreateOptions.defaultPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkCreateAccountsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Aanmaken...
                </>
              ) : (
                'Accounts Aanmaken'
              )}
            </Button>
          </div>
        </CustomDialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          if (accountToDelete) {
            deleteAccountMutation.mutate(accountToDelete.id);
            setIsDeleteDialogOpen(false);
            setAccountToDelete(null);
          }
        }}
        title="Account Verwijderen"
        description="Weet je zeker dat je dit account wilt verwijderen?"
        item={{
          name: accountToDelete ? `${accountToDelete.firstName} ${accountToDelete.lastName}` : "",
          id: accountToDelete?.email || ""
        }}
        warningText="Deze actie kan niet ongedaan worden gemaakt."
        isLoading={deleteAccountMutation.isPending}
        confirmButtonText="Definitief Verwijderen"
      />
    </div>
  );
}