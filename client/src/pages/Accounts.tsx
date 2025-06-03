import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus,
  Key,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  UserCheck,
  GraduationCap,
  Users
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  TableLoadingState,
  EmptyTableState,
  QuickActions
} from "@/components/ui/data-table-container";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface UserAccount {
  id: number;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'guardian';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  // Related person data
  personId: number;
  firstName: string;
  lastName: string;
  personType: string;
}

interface ExportData {
  format: 'pdf' | 'excel';
  includePasswords: boolean;
  roleFilter: string;
}

export default function Accounts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);

  const [accountFormData, setAccountFormData] = useState({
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'guardian',
    personId: 0,
    isActive: true
  });

  const [exportFormData, setExportFormData] = useState<ExportData>({
    format: 'excel',
    includePasswords: false,
    roleFilter: 'all'
  });

  const [bulkCreateFormData, setBulkCreateFormData] = useState({
    type: 'all' as 'all' | 'class' | 'program',
    role: 'student' as 'student' | 'teacher' | 'guardian',
    classId: 0,
    programId: 0,
    generateDefaultPasswords: true,
    defaultPassword: 'myMadrassa2024!',
    sendEmailNotifications: false
  });

  // Data queries
  const { data: accountsData = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/user-accounts'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: studentsData = [] } = useQuery({
    queryKey: ['/api/students'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ['/api/teachers'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: guardiansData = [] } = useQuery({
    queryKey: ['/api/guardians'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: studentGroupsData = [] } = useQuery({
    queryKey: ['/api/student-groups'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: programsData = [] } = useQuery({
    queryKey: ['/api/programs'],
    select: (data: any) => data?.programs || []
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/user-accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Account succesvol aangemaakt" });
      queryClient.invalidateQueries({ queryKey: ['/api/user-accounts'] });
      setIsCreateDialogOpen(false);
      resetAccountForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het aanmaken", variant: "destructive" });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/user-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Account succesvol bijgewerkt" });
      queryClient.invalidateQueries({ queryKey: ['/api/user-accounts'] });
      setIsEditDialogOpen(false);
      resetAccountForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het bijwerken", variant: "destructive" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/user-accounts/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Account succesvol verwijderd" });
      queryClient.invalidateQueries({ queryKey: ['/api/user-accounts'] });
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het verwijderen", variant: "destructive" });
    }
  });

  const bulkCreateAccountsMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/user-accounts/bulk-create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (result) => {
      toast({ 
        title: "Succes", 
        description: `${result.created} accounts succesvol aangemaakt` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-accounts'] });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het bulk aanmaken", variant: "destructive" });
    }
  });

  const exportAccountsMutation = useMutation({
    mutationFn: async (exportData: ExportData) => {
      const response = await fetch('/api/user-accounts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounts_export.${exportData.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Succes", description: "Accounts succesvol geëxporteerd" });
      setIsExportDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het exporteren", variant: "destructive" });
    }
  });

  // Helper functions
  const resetAccountForm = () => {
    setAccountFormData({
      email: '',
      password: '',
      role: 'student',
      personId: 0,
      isActive: true
    });
    setSelectedAccount(null);
  };

  const generateDefaultPassword = () => {
    return 'myMadrassa2024!';
  };

  const handleEditAccount = (account: UserAccount) => {
    setSelectedAccount(account);
    setAccountFormData({
      email: account.email,
      password: account.password,
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

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete.id);
    }
  };

  const handleCreateAccount = () => {
    const accountData = {
      ...accountFormData,
      password: accountFormData.password || generateDefaultPassword()
    };
    createAccountMutation.mutate(accountData);
  };

  const handleUpdateAccount = () => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data: accountFormData });
    }
  };

  const handleBulkCreateAccounts = (role: string) => {
    let people: any[] = [];
    
    switch(role) {
      case 'student':
        people = studentsData.filter((student: any) => 
          !accountsData.some((account: UserAccount) => 
            account.personId === student.id && account.role === 'student'
          )
        );
        break;
      case 'teacher':
        people = teachersData.filter((teacher: any) => 
          !accountsData.some((account: UserAccount) => 
            account.personId === teacher.id && account.role === 'teacher'
          )
        );
        break;
      case 'guardian':
        people = guardiansData.filter((guardian: any) => 
          !accountsData.some((account: UserAccount) => 
            account.personId === guardian.id && account.role === 'guardian'
          )
        );
        break;
    }

    const accountsToCreate = people.map(person => ({
      email: person.email,
      password: generateDefaultPassword(),
      role: role,
      personId: person.id,
      isActive: true
    })).filter(account => account.email); // Only create accounts for people with email

    if (accountsToCreate.length === 0) {
      toast({ 
        title: "Geen accounts", 
        description: `Alle ${role === 'student' ? 'studenten' : role === 'teacher' ? 'docenten' : 'voogden'} hebben al een account of geen email.`,
        variant: "destructive" 
      });
      return;
    }

    bulkCreateAccountsMutation.mutate({ accounts: accountsToCreate, role });
  };

  const handleExport = () => {
    exportAccountsMutation.mutate(exportFormData);
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      student: { label: 'Student', color: 'bg-blue-100 text-blue-800', icon: Users },
      teacher: { label: 'Docent', color: 'bg-green-100 text-green-800', icon: GraduationCap },
      guardian: { label: 'Voogd', color: 'bg-purple-100 text-purple-800', icon: UserCheck }
    };
    const config = roleMap[role as keyof typeof roleMap] || roleMap.student;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Actief</Badge> :
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactief</Badge>;
  };

  const getPersonOptions = (role: string) => {
    switch(role) {
      case 'student':
        return studentsData.filter((student: any) => 
          student.email && !accountsData.some((account: UserAccount) => 
            account.personId === student.id && account.role === 'student'
          )
        );
      case 'teacher':
        return teachersData.filter((teacher: any) => 
          teacher.email && !accountsData.some((account: UserAccount) => 
            account.personId === teacher.id && account.role === 'teacher'
          )
        );
      case 'guardian':
        return guardiansData.filter((guardian: any) => 
          guardian.email && !accountsData.some((account: UserAccount) => 
            account.personId === guardian.id && account.role === 'guardian'
          )
        );
      default:
        return [];
    }
  };

  // Filter functions
  const filteredAccounts = accountsData.filter((account: UserAccount) => {
    const matchesSearch = account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${account.firstName} ${account.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && account.isActive) ||
                         (statusFilter === "inactive" && !account.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const accountStats = {
    total: accountsData.length,
    students: accountsData.filter((a: UserAccount) => a.role === 'student').length,
    teachers: accountsData.filter((a: UserAccount) => a.role === 'teacher').length,
    guardians: accountsData.filter((a: UserAccount) => a.role === 'guardian').length,
    active: accountsData.filter((a: UserAccount) => a.isActive).length
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-cyan-50/20 min-h-screen">
      <PremiumHeader 
        title="Accounts" 
        description="Beheer login accounts voor studenten, docenten en voogden met geavanceerde beveiligingsopties"
        icon={Key}
        breadcrumbs={{
          parent: "Beheer",
          current: "Accounts"
        }}
      />

      {/* Enhanced Statistics Dashboard */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-slate-600 to-slate-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-slate-200 mb-2">Totaal Accounts</p>
                  <p className="text-3xl font-bold">{accountStats.total}</p>
                  <p className="text-xs text-slate-300 mt-1">Alle gebruikers</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Key className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-blue-100 mb-2">Student Accounts</p>
                  <p className="text-3xl font-bold">{accountStats.students}</p>
                  <p className="text-xs text-blue-200 mt-1">Leerling toegang</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-emerald-100 mb-2">Docent Accounts</p>
                  <p className="text-3xl font-bold">{accountStats.teachers}</p>
                  <p className="text-xs text-emerald-200 mt-1">Onderwijzer toegang</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-purple-100 mb-2">Voogd Accounts</p>
                  <p className="text-3xl font-bold">{accountStats.guardians}</p>
                  <p className="text-xs text-purple-200 mt-1">Ouder toegang</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-teal-100 mb-2">Actieve Accounts</p>
                  <p className="text-3xl font-bold">{accountStats.active}</p>
                  <p className="text-xs text-teal-200 mt-1">Momenteel ingelogd</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTableContainer>
        <SearchActionBar>
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek accounts..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
              className="h-7 px-2 rounded-sm border-[#e5e7eb] text-xs"
            >
              {showPasswords ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
              {showPasswords ? 'Verberg' : 'Toon'} Wachtwoorden
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

            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-7 px-3 rounded-sm text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Account
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter Options */}
        {showFilterOptions && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Rol:</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rollen</SelectItem>
                    <SelectItem value="student">Studenten</SelectItem>
                    <SelectItem value="teacher">Docenten</SelectItem>
                    <SelectItem value="guardian">Voogden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Statussen</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-6 border-b border-gray-200 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Account Overzicht</h2>
              <p className="text-sm text-gray-600">{filteredAccounts.length} accounts beheerd met veilige toegangscontrole</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-2 rounded-lg border border-indigo-200">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Bulk Accounts:</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkCreateDialogOpen(true)}
                className="h-9 px-4 text-xs bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Geavanceerd Aanmaken
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkCreateAccounts('student')}
                className="h-9 px-4 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <Users className="h-3.5 w-3.5 mr-2" />
                Alle Studenten
                <Badge className="ml-2 bg-blue-200 text-blue-800 text-xs">
                  {studentsData.filter((student: any) => 
                    student.email && !accountsData.some((account: UserAccount) => 
                      account.personId === student.id && account.role === 'student'
                    )
                  ).length}
                </Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkCreateAccounts('teacher')}
                className="h-9 px-4 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
              >
                <GraduationCap className="h-3.5 w-3.5 mr-2" />
                Alle Docenten
                <Badge className="ml-2 bg-emerald-200 text-emerald-800 text-xs">
                  {teachersData.filter((teacher: any) => 
                    teacher.email && !accountsData.some((account: UserAccount) => 
                      account.personId === teacher.id && account.role === 'teacher'
                    )
                  ).length}
                </Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkCreateAccounts('guardian')}
                className="h-9 px-4 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
              >
                <UserCheck className="h-3.5 w-3.5 mr-2" />
                Alle Voogden
                <Badge className="ml-2 bg-purple-200 text-purple-800 text-xs">
                  {guardiansData.filter((guardian: any) => 
                    guardian.email && !accountsData.some((account: UserAccount) => 
                      account.personId === guardian.id && account.role === 'guardian'
                    )
                  ).length}
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        <TableContainer>
          {accountsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Accounts laden...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Key className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen accounts</h3>
              <p className="text-gray-500 mb-4">Begin met het aanmaken van login accounts.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Account Toevoegen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Wachtwoord</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Laatste Login</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account: UserAccount) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.firstName} {account.lastName}</div>
                        <div className="text-sm text-gray-500">ID: {account.personId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>
                      {showPasswords ? (
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{account.password}</code>
                      ) : (
                        <span className="text-gray-400">••••••••</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(account.role)}</TableCell>
                    <TableCell>{getStatusBadge(account.isActive)}</TableCell>
                    <TableCell>
                      {account.lastLogin ? 
                        format(parseISO(account.lastLogin), 'dd MMM yyyy', { locale: nl }) : 
                        <span className="text-gray-400">Nooit</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </DataTableContainer>

      {/* Create Account Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Account</DialogTitle>
            <DialogDescription>
              Maak een nieuwe login account aan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={accountFormData.role} 
                onValueChange={(value: any) => {
                  setAccountFormData(prev => ({ ...prev, role: value, personId: 0, email: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="person">Persoon</Label>
              <Select 
                value={accountFormData.personId.toString()} 
                onValueChange={(value) => {
                  const personId = parseInt(value);
                  const people = getPersonOptions(accountFormData.role);
                  const person = people.find((p: any) => p.id === personId);
                  setAccountFormData(prev => ({ 
                    ...prev, 
                    personId: personId,
                    email: person?.email || '' 
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer persoon" />
                </SelectTrigger>
                <SelectContent>
                  {getPersonOptions(accountFormData.role).map((person: any) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.firstName} {person.lastName} ({person.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="text"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={`Standaard: ${generateDefaultPassword()}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Laat leeg voor standaard wachtwoord: {generateDefaultPassword()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive"
                checked={accountFormData.isActive}
                onCheckedChange={(checked) => setAccountFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive">Account is actief</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={!accountFormData.email || !accountFormData.personId}
            >
              Account Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de accountgegevens.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Wachtwoord</Label>
              <Input
                id="edit-password"
                type="text"
                value={accountFormData.password}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
              />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateAccount}>
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accounts Exporteren</DialogTitle>
            <DialogDescription>
              Exporteer accountgegevens naar PDF of Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="export-format">Format</Label>
              <Select 
                value={exportFormData.format} 
                onValueChange={(value: any) => setExportFormData(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="export-role">Rol Filter</Label>
              <Select 
                value={exportFormData.roleFilter} 
                onValueChange={(value) => setExportFormData(prev => ({ ...prev, roleFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="student">Alleen Studenten</SelectItem>
                  <SelectItem value="teacher">Alleen Docenten</SelectItem>
                  <SelectItem value="guardian">Alleen Voogden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includePasswords"
                checked={exportFormData.includePasswords}
                onCheckedChange={(checked) => setExportFormData(prev => ({ ...prev, includePasswords: !!checked }))}
              />
              <Label htmlFor="includePasswords">Wachtwoorden meenemen</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporteren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteAccount}
        title="Account Verwijderen"
        description={`Weet je zeker dat je het account van "${accountToDelete?.firstName} ${accountToDelete?.lastName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
      />
    </div>
  );
}