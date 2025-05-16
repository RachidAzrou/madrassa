import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, DollarSign, CreditCard, CheckCircle, Users,
  Settings, Percent, AlertCircle, ChevronDown, FileText, UserPlus, Euro, Coins, Mail, Phone, Home,
  CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validatieschema voor betalingsformulier
const feeFormSchema = z.object({
  studentId: z.number({
    required_error: "Selecteer een student"
  }),
  description: z.string().min(3, {
    message: "Beschrijving moet minimaal 3 tekens bevatten"
  }),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 
    { message: "Bedrag moet een positief getal zijn" }
  ),
  dueDate: z.date({
    required_error: "Vervaldatum is verplicht",
  }),
  status: z.string({
    required_error: "Status is verplicht",
  })
});

// Validatieschema voor collegegeld instellingen
const tuitionSettingSchema = z.object({
  academicYear: z.string({
    required_error: "Academisch jaar is verplicht"
  }),
  standardTuition: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 
    { message: "Bedrag moet een positief getal zijn" }
  ),
  registrationFee: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Bedrag moet een positief getal zijn of 0" }
  ).optional(),
  materialsFee: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Bedrag moet een positief getal zijn of 0" }
  ).optional(),
  dueDate: z.date({
    required_error: "Vervaldatum is verplicht",
  }),
  isActive: z.boolean().default(true)
});

// Validatieschema voor kortingsregel
const discountSchema = z.object({
  name: z.string({
    required_error: "Naam van de korting is verplicht"
  }).min(3, {
    message: "Naam moet minimaal 3 tekens bevatten"
  }),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"], {
    required_error: "Type korting is verplicht"
  }),
  discountValue: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 
    { message: "Waarde moet een positief getal zijn" }
  ),
  academicYear: z.string({
    required_error: "Academisch jaar is verplicht"
  }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  applicableToAll: z.boolean().default(false),
  minStudentsPerFamily: z.number().optional(),
  isActive: z.boolean().default(true)
});

export default function Fees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('fee-records');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  
  // Extra state voor de nieuwe functies
  const [isAddTuitionSettingOpen, setIsAddTuitionSettingOpen] = useState(false);
  const [isAddDiscountOpen, setIsAddDiscountOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isViewGuardiansOpen, setIsViewGuardiansOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch fee records with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/fees', { searchTerm, program, status, page: currentPage, type: activeTab }],
    staleTime: 30000,
  });

  // Fetch programs for filter
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Fetch fee statistics
  const { data: statsData } = useQuery<{
    stats: {
      totalCollected: number;
      pendingAmount: number;
      totalStudents: number;
      completionRate: number;
      overdueAmount: number;
      pendingInvoices: number;
    }
  }>({
    queryKey: ['/api/fees/stats'],
  });
  
  // Fetch students for the student selector
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
  });
  
  // Fetch fee settings (collegegeld instellingen)
  const { data: feeSettingsData } = useQuery({
    queryKey: ['/api/fee-settings'],
  });
  
  // Fetch discounts (kortingen)
  const { data: discountsData } = useQuery({
    queryKey: ['/api/fee-discounts'],
  });
  
  // Fetch students with outstanding debts (openstaande schulden)
  const { data: outstandingDebtsData } = useQuery({
    queryKey: ['/api/fees/outstanding'],
  });
  
  // Fetch guardians for a specific student
  const { data: guardianData, refetch: refetchGuardians } = useQuery({
    queryKey: ['/api/guardians/student', selectedStudent?.id],
    enabled: !!selectedStudent?.id && isViewGuardiansOpen,
  });

  // Vanwege de API structuur, is data een array van fee records
  const feeRecords = Array.isArray(data) ? data : [];
  const totalRecords = feeRecords.length;
  const totalPages = Math.ceil(totalRecords / 10);
  
  // Ophalen van programma's voor het filter
  const programs = Array.isArray(programsData) ? programsData : [];
  
  // Students voor in de dropdown
  const students = Array.isArray(studentsData) ? studentsData : [];
  
  // Instellingen en kortingen
  const feeSettings = Array.isArray(feeSettingsData) ? feeSettingsData : [];
  const discounts = Array.isArray(discountsData) ? discountsData : [];
  const outstandingDebts = Array.isArray(outstandingDebtsData) ? outstandingDebtsData : [];

  // Type voor het formulier
  type FeeFormValues = z.infer<typeof feeFormSchema>;
  type TuitionSettingFormValues = z.infer<typeof tuitionSettingSchema>;
  type DiscountFormValues = z.infer<typeof discountSchema>;
  
  // Formulier init
  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      status: 'niet betaald',
    },
  });
  
  const tuitionForm = useForm<TuitionSettingFormValues>({
    resolver: zodResolver(tuitionSettingSchema),
    defaultValues: {
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      standardTuition: '',
      registrationFee: '',
      materialsFee: '',
      dueDate: new Date(new Date().getFullYear(), 7, 1), // 1 augustus van huidige jaar
      isActive: true
    }
  });
  
  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      applicableToAll: false,
      isActive: true
    }
  });
  
  const handleAddFeeRecord = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditFee = (fee: any) => {
    setSelectedFee(fee);
    form.reset({
      studentId: fee.studentId,
      description: fee.description,
      amount: fee.amount.toString(),
      dueDate: new Date(fee.dueDate),
      status: fee.status
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteFee = (fee: any) => {
    setSelectedFee(fee);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedFee) return;
    
    try {
      await apiRequest(`/api/fees/${selectedFee.id}`, { method: 'DELETE' });
      
      // Data refreshen
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      
      // Dialog sluiten en success melding tonen
      setIsDeleteDialogOpen(false);
      toast({
        title: "Betaling verwijderd",
        description: "De betaling is succesvol verwijderd uit het systeem.",
      });
    } catch (error) {
      console.error('Fout bij verwijderen betaling:', error);
      toast({
        title: "Fout bij verwijderen betaling",
        description: "Er is een fout opgetreden bij het verwijderen van de betaling. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditSubmit = async (values: FeeFormValues) => {
    if (!selectedFee) return;
    
    try {
      // Converteren naar juiste formaat voor de API
      const feeData = {
        studentId: values.studentId,
        description: values.description,
        amount: parseFloat(values.amount),
        dueDate: values.dueDate.toISOString(),
        status: values.status,
        updatedAt: new Date().toISOString()
      };
      
      await apiRequest(`/api/fees/${selectedFee.id}`, { method: 'PUT', body: feeData });
      
      // Data refreshen
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      
      // Dialog sluiten en success melding tonen
      setIsEditDialogOpen(false);
      toast({
        title: "Betaling bijgewerkt",
        description: "De betaling is succesvol bijgewerkt in het systeem.",
      });
    } catch (error) {
      console.error('Fout bij bijwerken betaling:', error);
      toast({
        title: "Fout bij bijwerken betaling",
        description: "Er is een fout opgetreden bij het bijwerken van de betaling. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };
  
  const onSubmit = async (values: FeeFormValues) => {
    try {
      // Converteren naar juiste formaat voor de API
      const feeData = {
        studentId: values.studentId,
        description: values.description,
        amount: parseFloat(values.amount),
        dueDate: values.dueDate.toISOString(),
        status: values.status,
        createdAt: new Date().toISOString()
      };
      
      await apiRequest('/api/fees', { method: 'POST', body: feeData });
      
      // Data refreshen
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      
      // Dialog sluiten en succes melding tonen
      setIsAddDialogOpen(false);
      toast({
        title: "Betaling aangemaakt",
        description: "De betaling is succesvol toegevoegd aan het systeem.",
      });
      
      // Form resetten
      form.reset();
    } catch (error) {
      console.error('Fout bij aanmaken betaling:', error);
      toast({
        title: "Fout bij aanmaken betaling",
        description: "Er is een fout opgetreden bij het aanmaken van de betaling. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitTuitionSetting = async (values: TuitionSettingFormValues) => {
    try {
      // Converteren naar juiste formaat voor de API
      const tuitionData = {
        academicYear: values.academicYear,
        standardTuition: parseFloat(values.standardTuition),
        registrationFee: values.registrationFee ? parseFloat(values.registrationFee) : null,
        materialsFee: values.materialsFee ? parseFloat(values.materialsFee) : null,
        dueDate: values.dueDate.toISOString(),
        isActive: values.isActive
      };
      
      await apiRequest('POST', '/api/fee-settings', tuitionData);
      
      // Data refreshen
      queryClient.invalidateQueries({ queryKey: ['/api/fee-settings'] });
      
      // Dialog sluiten en succes melding tonen
      setIsAddTuitionSettingOpen(false);
      toast({
        title: "Collegegeld instelling aangemaakt",
        description: "De collegegeld instelling is succesvol toegevoegd aan het systeem.",
      });
      
      // Form resetten
      tuitionForm.reset();
    } catch (error) {
      console.error('Fout bij aanmaken collegegeld instelling:', error);
      toast({
        title: "Fout bij aanmaken instelling",
        description: "Er is een fout opgetreden bij het aanmaken van de collegegeld instelling. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitDiscount = async (values: DiscountFormValues) => {
    try {
      // Converteren naar juiste formaat voor de API
      const discountData = {
        name: values.name,
        description: values.description || null,
        discountType: values.discountType,
        discountValue: parseFloat(values.discountValue),
        academicYear: values.academicYear,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        applicableToAll: values.applicableToAll,
        minStudentsPerFamily: values.minStudentsPerFamily || null,
        isActive: values.isActive
      };
      
      await apiRequest('POST', '/api/fee-discounts', discountData);
      
      // Data refreshen
      queryClient.invalidateQueries({ queryKey: ['/api/fee-discounts'] });
      
      // Dialog sluiten en succes melding tonen
      setIsAddDiscountOpen(false);
      toast({
        title: "Kortingsregel aangemaakt",
        description: "De kortingsregel is succesvol toegevoegd aan het systeem.",
      });
      
      // Form resetten
      discountForm.reset();
    } catch (error) {
      console.error('Fout bij aanmaken kortingsregel:', error);
      toast({
        title: "Fout bij aanmaken korting",
        description: "Er is een fout opgetreden bij het aanmaken van de kortingsregel. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'betaald':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Betaald</Badge>;
      case 'in behandeling':
      case 'pending':
      case 'niet betaald':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Niet betaald</Badge>;
      case 'te laat':
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Te laat</Badge>;
      case 'gedeeltelijk':
      case 'partial':
      case 'gedeeltelijk betaald':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Gedeeltelijk betaald</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleViewGuardians = (student: any) => {
    setSelectedStudent(student);
    setIsViewGuardiansOpen(true);
    refetchGuardians();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <CreditCard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Betalingsbeheer</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer van collegegelden, betalingen, kortingen en schulden
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek betalingsrecords of studenten..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-1">
            <Button onClick={() => {
              // Actie afhankelijk van het huidige tabblad
              if (activeTab === 'fee-records') {
                setIsAddDialogOpen(true);
              } else if (activeTab === 'tuition-settings') {
                setIsAddTuitionSettingOpen(true);
              } else if (activeTab === 'discounts') {
                setIsAddDiscountOpen(true);
              }
            }} className="flex items-center bg-[#1e3a8a] hover:bg-blue-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Toevoegen</span>
            </Button>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-9 p-0 ml-1">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toevoegen...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Betalingsrecord</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddTuitionSettingOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Collegegeld Instelling</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddDiscountOpen(true)}>
                  <Percent className="mr-2 h-4 w-4" />
                  <span>Kortingsregel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs voor verschillende onderdelen van betalingsbeheer */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="fee-records" className="text-sm">
            <FileText className="w-4 h-4 mr-2" />
            Betalingen
          </TabsTrigger>
          <TabsTrigger value="tuition-settings" className="text-sm">
            <Settings className="w-4 h-4 mr-2" />
            Collegegeld
          </TabsTrigger>
          <TabsTrigger value="discounts" className="text-sm">
            <Percent className="w-4 h-4 mr-2" />
            Kortingen
          </TabsTrigger>
          <TabsTrigger value="debt-management" className="text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Schuldbeheer
          </TabsTrigger>
        </TabsList>

        {/* Content voor Betalingen tab */}
        <TabsContent value="fee-records" className="space-y-6">
          {/* Statistieken */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Totaal Geïnd</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {statsData?.stats?.totalCollected 
                      ? formatCurrency(statsData.stats.totalCollected) 
                      : "€0,00"}
                  </h3>
                </div>
                <div className="bg-emerald-100 h-12 w-12 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Openstaand Bedrag</p>
                  <h3 className="text-2xl font-bold mt-1 text-amber-600">
                    {statsData?.stats?.pendingAmount 
                      ? formatCurrency(statsData.stats.pendingAmount) 
                      : "€0,00"}
                  </h3>
                </div>
                <div className="bg-amber-100 h-12 w-12 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Betalingsgraad</p>
                  <div className="flex items-center mt-1">
                    <h3 className="text-2xl font-bold">
                      {statsData?.stats?.completionRate 
                        ? `${statsData.stats.completionRate}%` 
                        : "0%"}
                    </h3>
                    <Progress 
                      className="h-2 ml-2 w-16" 
                      value={statsData?.stats?.completionRate || 0} 
                    />
                  </div>
                </div>
                <div className="bg-blue-100 h-12 w-12 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Te Laat Bedrag</p>
                  <h3 className="text-2xl font-bold mt-1 text-red-600">
                    {statsData?.stats?.overdueAmount 
                      ? formatCurrency(statsData.stats.overdueAmount) 
                      : "€0,00"}
                  </h3>
                </div>
                <div className="bg-red-100 h-12 w-12 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabel met betalingen */}
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={program}
                    onValueChange={handleProgramChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alle programma's" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle programma's</SelectItem>
                      {programs.map((prog: any) => (
                        <SelectItem key={prog.id} value={prog.id.toString()}>
                          {prog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alle statussen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statussen</SelectItem>
                      <SelectItem value="betaald">Betaald</SelectItem>
                      <SelectItem value="niet betaald">Niet betaald</SelectItem>
                      <SelectItem value="te laat">Te laat</SelectItem>
                      <SelectItem value="gedeeltelijk betaald">Gedeeltelijk betaald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => {
                    // Export logica
                    toast({
                      title: "Export gestart",
                      description: "Betalingsgegevens worden geëxporteerd naar PDF.",
                    });
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporteren
                </Button>
              </div>

              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-gray-500">Betalingen laden...</p>
                </div>
              ) : isError ? (
                <div className="py-12 text-center">
                  <p className="text-red-500">Fout bij het laden van betalingsgegevens. Probeer de pagina te vernieuwen.</p>
                </div>
              ) : feeRecords.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">Geen betalingsrecords gevonden.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Beschrijving
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bedrag
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vervaldatum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feeRecords.map((fee: any) => {
                        // Find student data
                        const student = students.find((s: any) => s.id === fee.studentId);
                        
                        return (
                          <tr key={fee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 bg-[#1e3a8a] text-white">
                                  <AvatarFallback>
                                    {student ? `${student.firstName.charAt(0)}${student.lastName.charAt(0)}` : '--'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student ? `${student.firstName} ${student.lastName}` : 'Onbekende student'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {student?.studentId || 'Geen ID'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{fee.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(fee.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {fee.dueDate 
                                  ? new Date(fee.dueDate).toLocaleDateString('nl-NL', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })
                                  : '-'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(fee.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {student && (
                                  <Button variant="ghost" size="icon" onClick={() => handleViewGuardians(student)}>
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="sr-only">Voogden</span>
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleEditFee(fee)}>
                                  <Edit className="h-4 w-4 text-blue-500" />
                                  <span className="sr-only">Bewerken</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFee(fee)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">Verwijderen</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Paginering */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Vorige
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Volgende
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Pagina <span className="font-medium">{currentPage}</span> van <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button 
                          variant="outline" 
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Vorige</span>
                          &larr;
                        </Button>
                        
                        {/* Numerieke knoppen */}
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                          <Button 
                            key={i} 
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                              ${currentPage === i + 1 
                                ? 'bg-[#1e3a8a] text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Volgende</span>
                          &rarr;
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Dialog voor toevoegen betalingsrecord */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nieuwe Betaling Toevoegen</DialogTitle>
                <DialogDescription>
                  Voeg een nieuwe betalingsrecord toe voor een student.
                </DialogDescription>
              </DialogHeader>
                
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student: any) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName} ({student.studentId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrag (€)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vervaldatum</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={
                                  "w-full pl-3 text-left font-normal " +
                                  (!field.value && "text-muted-foreground")
                                }
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: nl })
                                ) : (
                                  <span>Kies een datum</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="niet betaald">Niet betaald</SelectItem>
                            <SelectItem value="betaald">Betaald</SelectItem>
                            <SelectItem value="te laat">Te laat</SelectItem>
                            <SelectItem value="gedeeltelijk betaald">Gedeeltelijk betaald</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit">Toevoegen</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Content voor Collegegeld Instellingen tab */}
        <TabsContent value="tuition-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-[#1e3a8a]" />
                Collegegeld Instellingen
              </CardTitle>
              <CardDescription>
                Beheer de standaard bedragen en instellingen voor collegegeld per academisch jaar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeSettings.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Geen collegegeld instellingen gevonden.</p>
                  <Button 
                    onClick={() => setIsAddTuitionSettingOpen(true)}
                    className="mt-4 bg-[#1e3a8a] hover:bg-blue-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Instelling Toevoegen
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Academisch Jaar
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collegegeld
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inschrijfgeld
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Materialen
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vervaldatum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feeSettings.map((setting: any) => (
                        <tr key={setting.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {setting.academicYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(setting.standardTuition)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {setting.registrationFee ? formatCurrency(setting.registrationFee) : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {setting.materialsFee ? formatCurrency(setting.materialsFee) : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {setting.dueDate 
                              ? new Date(setting.dueDate).toLocaleDateString('nl-NL')
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={setting.isActive 
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                            }>
                              {setting.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4 text-blue-500" />
                                <span className="sr-only">Bewerken</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Verwijderen</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Dialog voor toevoegen collegegeld instelling */}
          <Dialog open={isAddTuitionSettingOpen} onOpenChange={setIsAddTuitionSettingOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nieuwe Collegegeld Instelling</DialogTitle>
                <DialogDescription>
                  Configureer collegegeld voor een academisch jaar.
                </DialogDescription>
              </DialogHeader>
                
              <Form {...tuitionForm}>
                <form onSubmit={tuitionForm.handleSubmit(handleSubmitTuitionSetting)} className="space-y-4">
                  <FormField
                    control={tuitionForm.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2025-2026" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={tuitionForm.control}
                    name="standardTuition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standaard Collegegeld (€)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={tuitionForm.control}
                      name="registrationFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inschrijfgeld (€)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={tuitionForm.control}
                      name="materialsFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materiaalkosten (€)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="25" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={tuitionForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vervaldatum</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={
                                  "w-full pl-3 text-left font-normal " +
                                  (!field.value && "text-muted-foreground")
                                }
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: nl })
                                ) : (
                                  <span>Kies een datum</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddTuitionSettingOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit">Toevoegen</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Content voor Kortingen tab */}
        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="h-5 w-5 mr-2 text-[#1e3a8a]" />
                Kortingsregels
              </CardTitle>
              <CardDescription>
                Beheer de verschillende kortingen die toegepast kunnen worden op collegegeld.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discounts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Geen kortingsregels gevonden.</p>
                  <Button 
                    onClick={() => setIsAddDiscountOpen(true)}
                    className="mt-4 bg-[#1e3a8a] hover:bg-blue-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Korting Toevoegen
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Naam
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Waarde
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jaar
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Geldigheid
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {discounts.map((discount: any) => (
                        <tr key={discount.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                            {discount.description && (
                              <div className="text-xs text-gray-500">{discount.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {discount.discountType === 'percentage' ? 'Percentage' : 'Vast bedrag'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {discount.discountType === 'percentage' 
                              ? `${discount.discountValue}%` 
                              : formatCurrency(discount.discountValue)
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {discount.academicYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {discount.startDate && discount.endDate 
                              ? `${new Date(discount.startDate).toLocaleDateString('nl-NL')} tot ${new Date(discount.endDate).toLocaleDateString('nl-NL')}`
                              : 'Gehele jaar'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={discount.isActive 
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                            }>
                              {discount.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4 text-blue-500" />
                                <span className="sr-only">Bewerken</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Verwijderen</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Dialog voor toevoegen kortingsregel */}
          <Dialog open={isAddDiscountOpen} onOpenChange={setIsAddDiscountOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nieuwe Kortingsregel</DialogTitle>
                <DialogDescription>
                  Configureer een nieuwe korting voor collegegeld.
                </DialogDescription>
              </DialogHeader>
                
              <Form {...discountForm}>
                <form onSubmit={discountForm.handleSubmit(handleSubmitDiscount)} className="space-y-4">
                  <FormField
                    control={discountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam van de korting</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Vroegboekkorting" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={discountForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Korting bij betaling voor 1 juni" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={discountForm.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type korting</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Vast bedrag</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={discountForm.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waarde</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={discountForm.watch('discountType') === 'percentage' ? "10" : "50"} />
                          </FormControl>
                          <FormDescription>
                            {discountForm.watch('discountType') === 'percentage' ? "Percentage (%)" : "Bedrag (€)"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={discountForm.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2025-2026" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={discountForm.control}
                    name="applicableToAll"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Toepasbaar op alle studenten</FormLabel>
                          <FormDescription>
                            Indien aangevinkt, wordt deze korting automatisch toegepast op alle studenten
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDiscountOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit">Toevoegen</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Content voor Schuldbeheer tab */}
        <TabsContent value="debt-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-[#1e3a8a]" />
                Schuldbeheer
              </CardTitle>
              <CardDescription>
                Bekijk en beheer studenten met openstaande betalingen en schulden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {outstandingDebts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Geen openstaande schulden gevonden.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Studenten met schuld</p>
                            <h3 className="text-2xl font-bold mt-1">
                              {statsData?.stats?.pendingInvoices || 0}
                            </h3>
                          </div>
                          <div className="bg-red-100 h-12 w-12 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Totaal openstaand</p>
                            <h3 className="text-2xl font-bold mt-1">
                              {statsData?.stats?.pendingAmount 
                                ? formatCurrency(statsData.stats.pendingAmount) 
                                : "€0,00"}
                            </h3>
                          </div>
                          <div className="bg-amber-100 h-12 w-12 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Te laat bedrag</p>
                            <h3 className="text-2xl font-bold mt-1 text-red-600">
                              {statsData?.stats?.overdueAmount 
                                ? formatCurrency(statsData.stats.overdueAmount) 
                                : "€0,00"}
                            </h3>
                          </div>
                          <div className="bg-red-100 h-12 w-12 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Openstaand Bedrag
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aantal Facturen
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Langste Achterstand
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acties
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outstandingDebts.map((debt: any) => {
                          // Find student data
                          const student = students.find((s: any) => s.id === debt.studentId);
                          
                          return (
                            <tr key={debt.studentId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 bg-[#1e3a8a] text-white">
                                    <AvatarFallback>
                                      {student ? `${student.firstName.charAt(0)}${student.lastName.charAt(0)}` : '--'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {student ? `${student.firstName} ${student.lastName}` : 'Onbekende student'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {student?.studentId || 'Geen ID'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-red-600">
                                  {formatCurrency(debt.totalOutstanding)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {debt.invoiceCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {debt.longestOverdue} dagen
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  {student?.email && (
                                    <Button variant="ghost" size="sm">
                                      <Mail className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  )}
                                  {student?.phone && (
                                    <Button variant="ghost" size="sm">
                                      <Phone className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    className="border-blue-200 text-blue-700"
                                    size="sm"
                                    onClick={() => handleViewGuardians(student)}
                                  >
                                    <Users className="mr-1 h-4 w-4" />
                                    Voogden
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="border-amber-200 text-amber-700"
                                    size="sm"
                                    onClick={() => {
                                      // Open update betaalstatus dialog
                                      setSelectedStudent(student);
                                      setIsUpdateStatusOpen(true);
                                    }}
                                  >
                                    <CreditCard className="mr-1 h-4 w-4" />
                                    Update
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bewerk dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Betalingsrecord Bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van deze betaling aan.
            </DialogDescription>
          </DialogHeader>
            
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Vervaldatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={
                              "w-full pl-3 text-left font-normal " +
                              (!field.value && "text-muted-foreground")
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: nl })
                            ) : (
                              <span>Kies een datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="niet betaald">Niet betaald</SelectItem>
                        <SelectItem value="betaald">Betaald</SelectItem>
                        <SelectItem value="te laat">Te laat</SelectItem>
                        <SelectItem value="gedeeltelijk betaald">Gedeeltelijk betaald</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Verwijder dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Betaling Verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u deze betaling wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 bg-red-50 rounded-md border border-red-100">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Waarschuwing:</span> Alle gegevens van deze betaling zullen permanent worden verwijderd.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Voogden bekijken dialog */}
      <Dialog open={isViewGuardiansOpen} onOpenChange={setIsViewGuardiansOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voogden van Student</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Voogd informatie voor ${selectedStudent.firstName} ${selectedStudent.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!guardianData || guardianData.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Geen voogden gevonden voor deze student.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {guardianData.map((guardian: any, index: number) => (
                  <Card key={guardian.id} className="overflow-hidden">
                    <CardHeader className="pb-2 bg-slate-50">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 bg-[#1e3a8a] text-white">
                          <AvatarFallback>
                            {`${guardian.firstName.charAt(0)}${guardian.lastName.charAt(0)}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {guardian.firstName} {guardian.lastName}
                          </CardTitle>
                          <CardDescription>
                            {guardian.relationship || 'Relatie niet gespecificeerd'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 gap-3">
                        {guardian.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{guardian.email}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="ml-auto text-xs h-7"
                              onClick={() => {
                                window.open(`mailto:${guardian.email}?subject=Betalingsherinnering%20voor%20${selectedStudent.firstName}%20${selectedStudent.lastName}&body=Beste%20${guardian.firstName}%20${guardian.lastName},%0D%0A%0D%0AWij%20willen%20u%20eraan%20herinneren%20dat%20er%20nog%20een%20openstaande%20betaling%20is%20voor%20${selectedStudent.firstName}.`, '_blank');
                              }}
                            >
                              Bericht sturen
                            </Button>
                          </div>
                        )}
                        {guardian.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{guardian.phone}</span>
                          </div>
                        )}
                        {guardian.address && (
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{guardian.address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsViewGuardiansOpen(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Betaalstatus bijwerken dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Betaalstatus Bijwerken</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Bijwerken van betalingsstatus voor ${selectedStudent.firstName} ${selectedStudent.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          {/* Hier zou het formulier voor betaalstatus komen */}
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <h3 className="font-medium text-yellow-800 mb-2">Openstaande Betalingen</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collegegeld 2025-2026:</span>
                  <span className="font-medium">€450,00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lesmateriaal:</span>
                  <span className="font-medium">€50,00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-medium">
                  <span>Totaal openstaand:</span>
                  <span className="text-red-600">€500,00</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status bijwerken naar</label>
                <Select defaultValue="partial">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Betaald</SelectItem>
                    <SelectItem value="partial">Gedeeltelijk betaald</SelectItem>
                    <SelectItem value="pending">Niet betaald</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Betaald bedrag (€)</label>
                <Input className="mt-1" defaultValue="200.00" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Betaalmethode</label>
                <Select defaultValue="bank">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecteer betaalmethode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bankoverschrijving</SelectItem>
                    <SelectItem value="cash">Contant</SelectItem>
                    <SelectItem value="online">Online betaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Datum van betaling</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(), "PPP", { locale: nl })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      onSelect={() => {}}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Notities</label>
                <Input className="mt-1" placeholder="Bijvoorbeeld: eerste termijn betaald" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              onClick={() => {
                setIsUpdateStatusOpen(false);
                toast({
                  title: "Betaalstatus bijgewerkt",
                  description: "De betaalstatus is succesvol bijgewerkt.",
                });
              }}
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}