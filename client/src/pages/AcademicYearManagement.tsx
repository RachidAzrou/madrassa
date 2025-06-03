import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus,
  Calendar,
  Settings,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload
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
import { Textarea } from '@/components/ui/textarea';
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

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  finalReportDate: string;
  description?: string;
}

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  type: 'vacation' | 'public_holiday' | 'study_break';
  description?: string;
}

export default function AcademicYearManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateYearDialogOpen, setIsCreateYearDialogOpen] = useState(false);
  const [isEditYearDialogOpen, setIsEditYearDialogOpen] = useState(false);
  const [isCreateHolidayDialogOpen, setIsCreateHolidayDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

  const [yearFormData, setYearFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    finalReportDate: '',
    description: ''
  });

  const [holidayFormData, setHolidayFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as 'vacation' | 'public_holiday' | 'study_break',
    academicYearId: 0,
    description: ''
  });

  // Data queries
  const { data: academicYearsData = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['/api/academic-years'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: holidaysData = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['/api/school-holidays'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/academic-years', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol aangemaakt" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsCreateYearDialogOpen(false);
      resetYearForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het aanmaken", variant: "destructive" });
    }
  });

  const updateYearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/academic-years/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol bijgewerkt" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsEditYearDialogOpen(false);
      resetYearForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het bijwerken", variant: "destructive" });
    }
  });

  const deleteYearMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/academic-years/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol verwijderd" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsDeleteDialogOpen(false);
      setYearToDelete(null);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het verwijderen", variant: "destructive" });
    }
  });

  const createHolidayMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/school-holidays', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Vakantie succesvol toegevoegd" });
      queryClient.invalidateQueries({ queryKey: ['/api/school-holidays'] });
      setIsCreateHolidayDialogOpen(false);
      resetHolidayForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het toevoegen", variant: "destructive" });
    }
  });

  // Helper functions
  const resetYearForm = () => {
    setYearFormData({
      name: '',
      startDate: '',
      endDate: '',
      registrationStartDate: '',
      registrationEndDate: '',
      finalReportDate: '',
      description: ''
    });
    setSelectedYear(null);
  };

  const resetHolidayForm = () => {
    setHolidayFormData({
      name: '',
      startDate: '',
      endDate: '',
      type: 'vacation',
      academicYearId: 0,
      description: ''
    });
    setSelectedHoliday(null);
  };

  const handleEditYear = (year: AcademicYear) => {
    setSelectedYear(year);
    setYearFormData({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      registrationStartDate: year.registrationStartDate,
      registrationEndDate: year.registrationEndDate,
      finalReportDate: year.finalReportDate,
      description: year.description || ''
    });
    setIsEditYearDialogOpen(true);
  };

  const handleDeleteYear = (year: AcademicYear) => {
    setYearToDelete(year);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteYear = () => {
    if (yearToDelete) {
      deleteYearMutation.mutate(yearToDelete.id);
    }
  };

  const handleCreateYear = () => {
    createYearMutation.mutate(yearFormData);
  };

  const handleUpdateYear = () => {
    if (selectedYear) {
      updateYearMutation.mutate({ id: selectedYear.id, data: yearFormData });
    }
  };

  const handleCreateHoliday = () => {
    createHolidayMutation.mutate(holidayFormData);
  };

  const getStatusBadge = (year: AcademicYear) => {
    if (year.isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Actief</Badge>;
    } else {
      return <Badge variant="secondary">Inactief</Badge>;
    }
  };

  const getHolidayTypeBadge = (type: string) => {
    const typeMap = {
      vacation: { label: 'Vakantie', color: 'bg-blue-100 text-blue-800' },
      public_holiday: { label: 'Feestdag', color: 'bg-purple-100 text-purple-800' },
      study_break: { label: 'Studieonderbreking', color: 'bg-orange-100 text-orange-800' }
    };
    const config = typeMap[type as keyof typeof typeMap] || typeMap.vacation;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Filter functions
  const filteredYears = academicYearsData.filter((year: AcademicYear) => {
    return year.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredHolidays = holidaysData.filter((holiday: Holiday) => {
    return holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 min-h-screen">
      <PremiumHeader 
        title="Schooljaar Beheer" 
        description="Beheer schooljaren, academische periodes en schoolvakanties met een intuïtieve interface"
        icon={Calendar}
        breadcrumbs={{
          parent: "Beheer",
          current: "Schooljaar Beheer"
        }}
      />

      {/* Enhanced Statistics Dashboard */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-blue-100 mb-2">Totaal Schooljaren</p>
                  <p className="text-3xl font-bold">{filteredYears.length}</p>
                  <p className="text-xs text-blue-200 mt-1">Actief beheerd</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-emerald-100 mb-2">Actieve Schooljaren</p>
                  <p className="text-3xl font-bold">
                    {academicYearsData.filter((y: any) => y.isActive).length}
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">Momenteel lopend</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Settings className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-purple-100 mb-2">Schoolvakanties</p>
                  <p className="text-3xl font-bold">{filteredHolidays.length}</p>
                  <p className="text-xs text-purple-200 mt-1">Gepland dit jaar</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium text-amber-100 mb-2">Komende Vakanties</p>
                  <p className="text-3xl font-bold">
                    {holidaysData.filter((h: any) => new Date(h.startDate) > new Date()).length}
                  </p>
                  <p className="text-xs text-amber-200 mt-1">Nog te komen</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
                  <Clock className="h-7 w-7 text-white" />
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
              placeholder="Zoek schooljaren of vakanties..."
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
              size="sm"
              onClick={() => setIsCreateYearDialogOpen(true)}
              className="h-7 px-3 rounded-sm text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Schooljaar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateHolidayDialogOpen(true)}
              className="h-7 px-3 rounded-sm text-xs border-[#e5e7eb]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Vakantie
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter Options */}
        {showFilterOptions && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Schooljaren</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Schooljaar Overzicht</h2>
          <p className="text-sm text-gray-600">{filteredYears.length} schooljaren beheerd</p>
        </div>

        <TableContainer>
          <Tabs defaultValue="years" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="years">
                Schooljaren ({filteredYears.length})
              </TabsTrigger>
              <TabsTrigger value="holidays">
                Vakanties ({filteredHolidays.length})
              </TabsTrigger>
            </TabsList>

            {/* Academic Years Tab */}
            <TabsContent value="years">
              {yearsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Schooljaren laden...</p>
                </div>
              ) : filteredYears.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen schooljaren</h3>
                  <p className="text-gray-500 mb-4">Begin met het toevoegen van je eerste schooljaar.</p>
                  <Button onClick={() => setIsCreateYearDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schooljaar Toevoegen
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schooljaar</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Inschrijving</TableHead>
                      <TableHead>Eindrapport</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredYears.map((year: AcademicYear) => (
                      <TableRow key={year.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{year.name}</div>
                            {year.description && (
                              <div className="text-sm text-gray-500">{year.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(parseISO(year.startDate), 'dd MMM yyyy', { locale: nl })}</div>
                            <div className="text-gray-500">tot {format(parseISO(year.endDate), 'dd MMM yyyy', { locale: nl })}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(parseISO(year.registrationStartDate), 'dd MMM', { locale: nl })}</div>
                            <div className="text-gray-500">tot {format(parseISO(year.registrationEndDate), 'dd MMM', { locale: nl })}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(year.finalReportDate), 'dd MMM yyyy', { locale: nl })}
                        </TableCell>
                        <TableCell>{getStatusBadge(year)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditYear(year)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteYear(year)}
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
            </TabsContent>

            {/* Holidays Tab */}
            <TabsContent value="holidays">
              {holidaysLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Vakanties laden...</p>
                </div>
              ) : filteredHolidays.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakanties</h3>
                  <p className="text-gray-500 mb-4">Voeg schoolvakanties en vrije dagen toe.</p>
                  <Button onClick={() => setIsCreateHolidayDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Vakantie Toevoegen
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Schooljaar</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.map((holiday: Holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{holiday.name}</div>
                            {holiday.description && (
                              <div className="text-sm text-gray-500">{holiday.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getHolidayTypeBadge(holiday.type)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(parseISO(holiday.startDate), 'dd MMM', { locale: nl })} - {format(parseISO(holiday.endDate), 'dd MMM yyyy', { locale: nl })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {academicYearsData.find((year: AcademicYear) => year.id === holiday.academicYearId)?.name || 'Onbekend'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </TableContainer>
      </DataTableContainer>

      {/* Create Academic Year Dialog */}
      <Dialog open={isCreateYearDialogOpen} onOpenChange={setIsCreateYearDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuw Schooljaar</DialogTitle>
            <DialogDescription>
              Voeg een nieuw schooljaar toe met alle belangrijke datums.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Schooljaar Naam</Label>
                <Input
                  id="name"
                  value={yearFormData.name}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="bijv. 2024-2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving (optioneel)</Label>
                <Input
                  id="description"
                  value={yearFormData.description}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Korte beschrijving"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Datum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={yearFormData.startDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Eind Datum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={yearFormData.endDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationStartDate">Inschrijving Start</Label>
                <Input
                  id="registrationStartDate"
                  type="date"
                  value={yearFormData.registrationStartDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="registrationEndDate">Inschrijving Eind</Label>
                <Input
                  id="registrationEndDate"
                  type="date"
                  value={yearFormData.registrationEndDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="finalReportDate">Eindrapport Datum</Label>
              <Input
                id="finalReportDate"
                type="date"
                value={yearFormData.finalReportDate}
                onChange={(e) => setYearFormData(prev => ({ ...prev, finalReportDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateYearDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateYear}
              disabled={!yearFormData.name || !yearFormData.startDate || !yearFormData.endDate}
            >
              Schooljaar Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={isEditYearDialogOpen} onOpenChange={setIsEditYearDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schooljaar Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van het schooljaar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Schooljaar Naam</Label>
                <Input
                  id="edit-name"
                  value={yearFormData.name}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Beschrijving</Label>
                <Input
                  id="edit-description"
                  value={yearFormData.description}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Datum</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={yearFormData.startDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">Eind Datum</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={yearFormData.endDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-registrationStartDate">Inschrijving Start</Label>
                <Input
                  id="edit-registrationStartDate"
                  type="date"
                  value={yearFormData.registrationStartDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-registrationEndDate">Inschrijving Eind</Label>
                <Input
                  id="edit-registrationEndDate"
                  type="date"
                  value={yearFormData.registrationEndDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-finalReportDate">Eindrapport Datum</Label>
              <Input
                id="edit-finalReportDate"
                type="date"
                value={yearFormData.finalReportDate}
                onChange={(e) => setYearFormData(prev => ({ ...prev, finalReportDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditYearDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateYear}>
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Holiday Dialog */}
      <Dialog open={isCreateHolidayDialogOpen} onOpenChange={setIsCreateHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Vakantie</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe schoolvakantie of vrije dag toe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="holiday-name">Naam</Label>
              <Input
                id="holiday-name"
                value={holidayFormData.name}
                onChange={(e) => setHolidayFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="bijv. Kerstvakantie"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holiday-type">Type</Label>
                <Select 
                  value={holidayFormData.type} 
                  onValueChange={(value: any) => setHolidayFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vakantie</SelectItem>
                    <SelectItem value="public_holiday">Feestdag</SelectItem>
                    <SelectItem value="study_break">Studieonderbreking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="holiday-year">Schooljaar</Label>
                <Select 
                  value={holidayFormData.academicYearId.toString()} 
                  onValueChange={(value) => setHolidayFormData(prev => ({ ...prev, academicYearId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer schooljaar" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearsData.map((year: AcademicYear) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holiday-startDate">Start Datum</Label>
                <Input
                  id="holiday-startDate"
                  type="date"
                  value={holidayFormData.startDate}
                  onChange={(e) => setHolidayFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="holiday-endDate">Eind Datum</Label>
                <Input
                  id="holiday-endDate"
                  type="date"
                  value={holidayFormData.endDate}
                  onChange={(e) => setHolidayFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="holiday-description">Beschrijving (optioneel)</Label>
              <Textarea
                id="holiday-description"
                value={holidayFormData.description}
                onChange={(e) => setHolidayFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Extra informatie over de vakantie"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateHolidayDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateHoliday}
              disabled={!holidayFormData.name || !holidayFormData.startDate || !holidayFormData.endDate || !holidayFormData.academicYearId}
            >
              Vakantie Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteYear}
        title="Schooljaar Verwijderen"
        description={`Weet je zeker dat je het schooljaar "${yearToDelete?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        itemName={yearToDelete?.name || ''}
      />
    </div>
  );
}