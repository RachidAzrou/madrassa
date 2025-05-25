import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, DollarSign, CreditCard, CheckCircle, 
  Users, Settings, Percent, AlertCircle, ChevronDown, FileText, UserPlus, Euro, Coins, 
  Mail, Phone, Home, CalendarIcon, Plus, User, X, MapPin, School, XCircle, Receipt
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// Schema voor betaling toevoegen
const feeFormSchema = z.object({
  studentId: z.string().min(1, { message: "Selecteer een student" }),
  amount: z.coerce.number().min(0.01, { message: "Bedrag moet groter zijn dan 0" }),
  description: z.string().min(3, { message: "Omschrijving is verplicht" }),
  dueDate: z.date({ required_error: "Selecteer een vervaldatum" }),
  status: z.string().min(1, { message: "Selecteer een status" }),
  paymentMethod: z.string().min(1, { message: "Selecteer een betaalmethode" }).optional(),
  paymentDate: z.date().optional(),
  academicYear: z.string().min(1, { message: "Selecteer een academisch jaar" }),
  feeType: z.string().min(1, { message: "Selecteer een type betaling" }),
});

// Schema voor tuition settings
const tuitionSettingSchema = z.object({
  name: z.string().min(3, { message: "Naam is verplicht" }),
  academicYear: z.string().min(1, { message: "Selecteer een academisch jaar" }),
  amount: z.coerce.number().min(0.01, { message: "Bedrag moet groter zijn dan 0" }),
  dueDate: z.date({ required_error: "Selecteer een vervaldatum" }),
  description: z.string().optional(),
  installments: z.coerce.number().min(1, { message: "Minimaal 1 termijn" }).optional(),
  isActive: z.boolean().default(true),
});

// Schema voor kortingen
const discountSchema = z.object({
  name: z.string().min(3, { message: "Naam is verplicht" }),
  discountType: z.string().min(1, { message: "Selecteer een type korting" }),
  value: z.coerce.number().min(0.01, { message: "Waarde moet groter zijn dan 0" }),
  isPercentage: z.boolean().default(false),
  validFrom: z.date({ required_error: "Selecteer een startdatum" }),
  validUntil: z.date({ required_error: "Selecteer een einddatum" }).optional(),
  criteria: z.string().min(3, { message: "Criteria is verplicht" }),
  maxUsesPerStudent: z.coerce.number().min(1, { message: "Minimaal 1 gebruik" }).optional(),
});

// Hulpfunctie voor valutaformattering
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export default function Fees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("fee-records");
  const [showAddOptionsDialog, setShowAddOptionsDialog] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTuitionDialog, setShowTuitionDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Fetch fees data
  const { data: feesData, isLoading: isLoadingFees } = useQuery({
    queryKey: ['/api/fees'],
    staleTime: 60000,
  });
  
  // Fetch statistics
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/fees/stats'],
    staleTime: 300000,
  });
  
  // Fetch outstanding fees
  const { data: outstandingFeesData, isLoading: isLoadingOutstandingFees } = useQuery({
    queryKey: ['/api/fees/outstanding'],
    staleTime: 60000,
  });
  
  // Fetch students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 300000,
  });
  
  // Fetch academic years
  const { data: academicYearsData } = useQuery({
    queryKey: ['/api/academic-years'],
    staleTime: 600000,
  });
  
  // Fetch fee types
  const { data: feeTypesData } = useQuery({
    queryKey: ['/api/fee-types'],
    staleTime: 600000,
  });
  
  // Fetch tuition settings
  const { data: tuitionSettingsData } = useQuery({
    queryKey: ['/api/fee-settings'],
    staleTime: 300000,
  });
  
  // Fetch discounts
  const { data: discountsData } = useQuery({
    queryKey: ['/api/fee-discounts'],
    staleTime: 300000,
  });
  
  // Formulier voor betaling toevoegen
  const feeForm = useForm<z.infer<typeof feeFormSchema>>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      studentId: "",
      amount: 0,
      description: "",
      status: "pending",
      academicYear: "",
      feeType: ""
    },
  });
  
  // Formulier voor tuition setting
  const tuitionSettingForm = useForm<z.infer<typeof tuitionSettingSchema>>({
    resolver: zodResolver(tuitionSettingSchema),
    defaultValues: {
      name: "",
      academicYear: "",
      amount: 0,
      description: "",
      installments: 1,
      isActive: true
    },
  });
  
  // Formulier voor korting
  const discountForm = useForm<z.infer<typeof discountSchema>>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: "",
      discountType: "",
      value: 0,
      isPercentage: false,
      criteria: "",
      maxUsesPerStudent: 1
    },
  });
  
  // Filters toepassen
  const filteredFees = feesData ? [...feesData].filter(fee => {
    const matchesSearch = 
      searchQuery === '' || 
      fee.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fee.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fee.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fee.feeType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
    const matchesYear = yearFilter === 'all' || fee.academicYear === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  }) : [];
  
  // Sorteren op datum (nieuwste eerst)
  filteredFees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Function to handle opening add payment form
  const handleAddPayment = () => {
    setIsAddingPayment(true);
    setShowAddOptionsDialog(false);
  };
  
  // Function to handle edit payment
  const handleEditFee = (fee: any) => {
    setSelectedFee(fee);
    feeForm.reset({
      studentId: fee.studentId,
      amount: fee.amount,
      description: fee.description,
      dueDate: new Date(fee.dueDate),
      status: fee.status,
      paymentMethod: fee.paymentMethod || undefined,
      paymentDate: fee.paymentDate ? new Date(fee.paymentDate) : undefined,
      academicYear: fee.academicYear,
      feeType: fee.feeType
    });
    setShowEditDialog(true);
  };
  
  // Function to handle delete payment
  const handleDeleteFee = (fee: any) => {
    setSelectedFee(fee);
    setShowDeleteDialog(true);
  };
  
  // Function to handle view payment details
  const handleViewFee = (fee: any) => {
    // Implement view details functionality
    toast({
      title: "Betaling details",
      description: `Betaling van ${formatCurrency(fee.amount)} voor ${fee.student.firstName} ${fee.student.lastName}`,
    });
  };
  
  // Function to confirm deletion
  const handleConfirmDelete = async () => {
    if (!selectedFee) return;
    
    try {
      await apiRequest(`/api/fees/${selectedFee.id}`, {
        method: 'DELETE',
      });
      
      toast({
        title: "Betaling verwijderd",
        description: "De betaling is succesvol verwijderd.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/outstanding'] });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting fee:", error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de betaling.",
        variant: "destructive",
      });
    }
  };
  
  // Handle edit submit
  const handleEditSubmit = async (values: z.infer<typeof feeFormSchema>) => {
    if (!selectedFee) return;
    
    try {
      await apiRequest(`/api/fees/${selectedFee.id}`, {
        method: 'PATCH',
        body: values
      });
      
      toast({
        title: "Betaling bijgewerkt",
        description: "De betaling is succesvol bijgewerkt.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/outstanding'] });
      
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating fee:", error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de betaling.",
        variant: "destructive",
      });
    }
  };
  
  // Handle add payment submit
  const onSubmit = async (values: z.infer<typeof feeFormSchema>) => {
    try {
      await apiRequest('/api/fees', {
        method: 'POST',
        body: values
      });
      
      toast({
        title: "Betaling toegevoegd",
        description: "De betaling is succesvol toegevoegd.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/outstanding'] });
      
      feeForm.reset();
      setIsAddingPayment(false);
    } catch (error) {
      console.error("Error adding fee:", error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de betaling.",
        variant: "destructive",
      });
    }
  };
  
  // Handle tuition setting submit
  const onSubmitTuitionSetting = async (values: z.infer<typeof tuitionSettingSchema>) => {
    try {
      await apiRequest('/api/fee-settings', {
        method: 'POST',
        body: values
      });
      
      toast({
        title: "Collegegeld instelling toegevoegd",
        description: "De collegegeld instelling is succesvol toegevoegd.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/fee-settings'] });
      
      tuitionSettingForm.reset();
      setShowTuitionDialog(false);
    } catch (error) {
      console.error("Error adding tuition setting:", error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de collegegeld instelling.",
        variant: "destructive",
      });
    }
  };
  
  // Handle discount submit
  const handleSubmitDiscount = async (values: z.infer<typeof discountSchema>) => {
    try {
      await apiRequest('/api/fee-discounts', {
        method: 'POST',
        body: values
      });
      
      toast({
        title: "Korting toegevoegd",
        description: "De korting is succesvol toegevoegd.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/fee-discounts'] });
      
      discountForm.reset();
      setShowDiscountDialog(false);
    } catch (error) {
      console.error("Error adding discount:", error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de korting.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PremiumHeader
        title="Betalingsbeheer"
        path="Administratie > Betalingsbeheer"
        icon={Receipt}
      />
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Zoek en acties */}
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoeken naar betalingen..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="paid">Betaald</SelectItem>
                <SelectItem value="pending">In behandeling</SelectItem>
                <SelectItem value="overdue">Te laat</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Academisch jaar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle jaren</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2 w-[160px] justify-start">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd-MM-yyyy", { locale: nl })
                  ) : (
                    <span>Filter op datum</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={nl}
                />
                {selectedDate && (
                  <div className="p-3 border-t border-border">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                      Filter wissen
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            onClick={() => setShowAddOptionsDialog(true)} 
            className="flex items-center bg-[#1e40af] hover:bg-blue-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Dialog voor "Toevoegen" in studentformulier stijl */}
      <Dialog open={showAddOptionsDialog} onOpenChange={setShowAddOptionsDialog}>
        <DialogContent className="sm:max-w-[95vw] sm:h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center gap-2 text-left">
            <div className="bg-blue-100 p-2 rounded-full">
              <Plus className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="text-xl">Nieuwe gegevens toevoegen</DialogTitle>
              <DialogDescription>
                Selecteer het type gegevens dat u wilt toevoegen aan het betalingssysteem.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card className="border cursor-pointer hover:shadow-md transition-all" onClick={handleAddPayment}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  Betaling Toevoegen
                </CardTitle>
                <CardDescription>
                  Voeg een nieuwe betaling of factuur toe voor een student
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>Maak nieuwe betalingen voor collegegeld, activiteiten of andere kosten</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="gap-1 text-blue-600">
                  <PlusCircle className="h-4 w-4" />
                  <span>Betaling aanmaken</span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Collegegeld Tab */}
            <Card className="border cursor-pointer hover:shadow-md transition-all" onClick={() => {
              setShowAddOptionsDialog(false);
              setShowTuitionDialog(true);
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Euro className="h-5 w-5 text-blue-700" />
                  </div>
                  Collegegeld toevoegen
                </CardTitle>
                <CardDescription>
                  Definieer een nieuwe collegegeld instelling
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>Configureer collegegeld voor een academisch jaar, inclusief termijnen</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="gap-1 text-blue-600">
                  <PlusCircle className="h-4 w-4" />
                  <span>Collegegeld instellen</span>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border cursor-pointer hover:shadow-md transition-all" onClick={() => {
              setShowAddOptionsDialog(false);
              setShowDiscountDialog(true);
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Percent className="h-5 w-5 text-blue-700" />
                  </div>
                  Korting Toevoegen
                </CardTitle>
                <CardDescription>
                  Maak een nieuwe korting of financiële regeling
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>Definieer kortingen op basis van percentages of vaste bedragen</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="gap-1 text-blue-600">
                  <PlusCircle className="h-4 w-4" />
                  <span>Korting configureren</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Tabs voor Betalingsbeheer */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-5 p-1 mb-4 bg-blue-900/10">
          <TabsTrigger value="fee-records" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <FileText className="w-4 h-4 mr-2" />
            Betalingen
          </TabsTrigger>
          <TabsTrigger value="debt-management" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            Schuldbeheer
          </TabsTrigger>
          <TabsTrigger value="tuition-settings" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <Euro className="w-4 h-4 mr-2" />
            Collegegeld
          </TabsTrigger>
          <TabsTrigger value="activities" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <MapPin className="w-4 h-4 mr-2" />
            Activiteiten
          </TabsTrigger>
          <TabsTrigger value="discounts" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <Percent className="w-4 h-4 mr-2" />
            Kortingen
          </TabsTrigger>
        </TabsList>

        {/* Content voor Betalingen tab */}
        <TabsContent value="fee-records" className="space-y-6">
          {/* Statistieken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-[#1e40af] rounded-md">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-700">Totaal Geïnd</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData?.stats?.totalCollected 
                    ? formatCurrency(statsData.stats.totalCollected) 
                    : "€0,00"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-500 rounded-md">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-700">Openstaand Bedrag</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData?.stats?.pendingAmount 
                    ? formatCurrency(statsData.stats.pendingAmount) 
                    : "€0,00"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-600 rounded-md">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-700">Betalingsgraad</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData?.stats?.completionRate 
                    ? `${statsData.stats.completionRate}%` 
                    : "0%"}
                </p>
                <div className="mt-2">
                  <Progress 
                    className="h-2 w-full" 
                    value={statsData?.stats?.completionRate || 0} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabel met betalingen */}
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Recente Betalingen</h3>
              <Button variant="outline" size="sm" className="text-sm flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            
            {isLoadingFees ? (
              <div className="p-8 flex justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
            ) : filteredFees && filteredFees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                      <th className="py-3 px-4 text-left">STUDENT</th>
                      <th className="py-3 px-4 text-left">BESCHRIJVING</th>
                      <th className="py-3 px-4 text-left">BEDRAG</th>
                      <th className="py-3 px-4 text-left">VERVALDATUM</th>
                      <th className="py-3 px-4 text-left">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTIES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredFees.map((fee, index) => (
                      <tr key={fee.id} className="text-sm hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {fee.student?.firstName?.[0]}{fee.student?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{fee.student?.firstName} {fee.student?.lastName}</div>
                              <div className="text-xs text-gray-500">{fee.student?.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[200px] truncate" title={fee.description}>
                            {fee.description}
                          </div>
                          <div className="text-xs text-gray-500">{fee.feeType}</div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(fee.dueDate).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${fee.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                              ${fee.status === 'pending' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                              ${fee.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                              ${fee.status === 'cancelled' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
                            `}
                          >
                            {fee.status === 'paid' && 'Betaald'}
                            {fee.status === 'pending' && 'In behandeling'}
                            {fee.status === 'overdue' && 'Te laat'}
                            {fee.status === 'cancelled' && 'Geannuleerd'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewFee(fee)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditFee(fee)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFee(fee)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Geen betalingen gevonden</h3>
                <p className="text-gray-500 mb-4">Er zijn geen betalingen die voldoen aan de geselecteerde filters.</p>
                <Button
                  variant="outline"
                  onClick={handleAddPayment}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Nieuwe betaling toevoegen</span>
                </Button>
              </div>
            )}
          </div>

          {/* Betaling toevoegen formulier */}
          <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Nieuwe Betaling</DialogTitle>
                <DialogDescription>
                  Voeg een nieuwe betaling of factuur toe voor een student.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...feeForm}>
                <form onSubmit={feeForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={feeForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {studentsData && studentsData.map((student: any) => (
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={feeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrag (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feeForm.control}
                      name="feeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type Betaling</FormLabel>
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
                              <SelectItem value="tuition">Collegegeld</SelectItem>
                              <SelectItem value="activity">Activiteit</SelectItem>
                              <SelectItem value="material">Studiemateriaal</SelectItem>
                              <SelectItem value="other">Overig</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={feeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Omschrijving</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bijvoorbeeld: 'Collegegeld 2024-2025' of 'Inschrijfgeld'"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={feeForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Vervaldatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "dd-MM-yyyy", { locale: nl })
                                  ) : (
                                    <span>Kies een datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={nl}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feeForm.control}
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
                                <SelectValue placeholder="Selecteer status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">In behandeling</SelectItem>
                              <SelectItem value="paid">Betaald</SelectItem>
                              <SelectItem value="overdue">Te laat</SelectItem>
                              <SelectItem value="cancelled">Geannuleerd</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={feeForm.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer academisch jaar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {feeForm.watch("status") === "paid" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={feeForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Betaalmethode</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecteer methode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank">Bankoverschrijving</SelectItem>
                                <SelectItem value="cash">Contant</SelectItem>
                                <SelectItem value="card">Pinbetaling</SelectItem>
                                <SelectItem value="other">Overig</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={feeForm.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Betaaldatum</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd-MM-yyyy", { locale: nl })
                                    ) : (
                                      <span>Kies een datum</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  locale={nl}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingPayment(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" className="bg-[#1e40af] hover:bg-blue-800">
                      Betaling opslaan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Betaling bewerken dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Betaling bewerken</DialogTitle>
                <DialogDescription>
                  Bewerk de gegevens van deze betaling.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...feeForm}>
                <form onSubmit={feeForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                  <FormField
                    control={feeForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {studentsData && studentsData.map((student: any) => (
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={feeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrag (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feeForm.control}
                      name="feeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type Betaling</FormLabel>
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
                              <SelectItem value="tuition">Collegegeld</SelectItem>
                              <SelectItem value="activity">Activiteit</SelectItem>
                              <SelectItem value="material">Studiemateriaal</SelectItem>
                              <SelectItem value="other">Overig</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={feeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Omschrijving</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={feeForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Vervaldatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "dd-MM-yyyy", { locale: nl })
                                  ) : (
                                    <span>Kies een datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={nl}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feeForm.control}
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
                                <SelectValue placeholder="Selecteer status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">In behandeling</SelectItem>
                              <SelectItem value="paid">Betaald</SelectItem>
                              <SelectItem value="overdue">Te laat</SelectItem>
                              <SelectItem value="cancelled">Geannuleerd</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={feeForm.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer academisch jaar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {feeForm.watch("status") === "paid" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={feeForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Betaalmethode</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecteer methode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank">Bankoverschrijving</SelectItem>
                                <SelectItem value="cash">Contant</SelectItem>
                                <SelectItem value="card">Pinbetaling</SelectItem>
                                <SelectItem value="other">Overig</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={feeForm.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Betaaldatum</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd-MM-yyyy", { locale: nl })
                                    ) : (
                                      <span>Kies een datum</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  locale={nl}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" className="bg-[#1e40af] hover:bg-blue-800">
                      Wijzigingen opslaan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Betaling verwijderen</DialogTitle>
                <DialogDescription>
                  Weet u zeker dat u deze betaling wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </DialogDescription>
              </DialogHeader>
              
              {selectedFee && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Student:</span>
                    <span className="font-medium ml-2">{selectedFee.student?.firstName} {selectedFee.student?.lastName}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Beschrijving:</span>
                    <span className="font-medium ml-2">{selectedFee.description}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Bedrag:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedFee.amount)}</span>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="destructive"
                >
                  Verwijderen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Content voor Schuldbeheer tab */}
        <TabsContent value="debt-management" className="space-y-6">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Openstaande Betalingen</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-sm flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" className="text-sm flex items-center gap-1 bg-[#1e40af] hover:bg-blue-800">
                  <Mail className="h-4 w-4" />
                  Herinneringen versturen
                </Button>
              </div>
            </div>
            
            {isLoadingOutstandingFees ? (
              <div className="p-8 flex justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
            ) : outstandingFeesData && outstandingFeesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                      <th className="py-3 px-4 text-left">STUDENT</th>
                      <th className="py-3 px-4 text-left">BESCHRIJVING</th>
                      <th className="py-3 px-4 text-left">BEDRAG</th>
                      <th className="py-3 px-4 text-left">VERVALDATUM</th>
                      <th className="py-3 px-4 text-left">DAGEN TE LAAT</th>
                      <th className="py-3 px-4 text-right">ACTIES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {outstandingFeesData.map((fee: any) => {
                      const daysLate = Math.max(0, Math.floor((new Date().getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                      return (
                        <tr key={fee.id} className="text-sm hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {fee.student?.firstName?.[0]}{fee.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{fee.student?.firstName} {fee.student?.lastName}</div>
                                <div className="text-xs text-gray-500">{fee.student?.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-[200px] truncate" title={fee.description}>
                              {fee.description}
                            </div>
                            <div className="text-xs text-gray-500">{fee.feeType}</div>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(fee.amount)}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(fee.dueDate).toLocaleDateString('nl-NL')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline" 
                              className={`
                                ${daysLate > 30 ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                ${daysLate > 14 && daysLate <= 30 ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                                ${daysLate <= 14 ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                              `}
                            >
                              {daysLate} dagen
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="text-sm flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                Herinnering
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="text-sm flex items-center gap-1 text-emerald-600"
                                onClick={() => handleEditFee(fee)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Markeer als betaald
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Geen openstaande betalingen!</h3>
                <p className="text-gray-500">Alle betalingen zijn volledig voldaan. Er zijn geen achterstallige betalingen.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Content voor Collegegeld Instellingen tab */}
        <TabsContent value="tuition-settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-[#1e40af]" />
                    Collegegeld
                  </div>
                </CardTitle>
                <CardDescription>Academisch jaar 2024-2025</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowTuitionDialog(true)}
                    className="text-sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Collegegeld Toevoegen
                  </Button>
                </div>
                
                <Dialog open={showTuitionDialog} onOpenChange={setShowTuitionDialog}>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Nieuw Collegegeld</DialogTitle>
                      <DialogDescription>
                        Configureer een nieuwe collegegeld instelling voor een academisch jaar
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...tuitionSettingForm}>
                      <form onSubmit={tuitionSettingForm.handleSubmit(onSubmitTuitionSetting)} className="space-y-4">
                        <FormField
                          control={tuitionSettingForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Naam</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Bijv. Collegegeld 2024-2025" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={tuitionSettingForm.control}
                            name="academicYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Academisch Jaar</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecteer jaar" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={tuitionSettingForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bedrag (€)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={tuitionSettingForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Vervaldatum</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd-MM-yyyy", { locale: nl })
                                      ) : (
                                        <span>Kies een datum</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    locale={nl}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={tuitionSettingForm.control}
                            name="installments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Aantal Termijnen</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={tuitionSettingForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-end space-x-2 space-y-0 h-full pb-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="tuition-active"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="tuition-active" className="text-sm cursor-pointer">Collegegeld actief</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={tuitionSettingForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beschrijving (optioneel)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowTuitionDialog(false)}
                          >
                            Annuleren
                          </Button>
                          <Button type="submit" className="bg-[#1e40af] hover:bg-blue-800">
                            Collegegeld toevoegen
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                {tuitionSettingsData && tuitionSettingsData.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {tuitionSettingsData.map((setting: any) => (
                      <div key={setting.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-medium">{setting.name}</h4>
                            <div className="text-sm text-gray-500">{setting.academicYear}</div>
                          </div>
                          <Badge variant={setting.isActive ? "default" : "outline"}>
                            {setting.isActive ? "Actief" : "Inactief"}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Bedrag:</span>
                            <span className="font-medium ml-1">{formatCurrency(setting.amount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Termijnen:</span>
                            <span className="font-medium ml-1">{setting.installments || 1}</span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Vervaldatum:</span>
                            <span className="font-medium ml-1">
                              {new Date(setting.dueDate).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-3">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 border rounded-md bg-gray-50 mt-4">
                    <Euro className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-base font-medium">Geen collegegeld instellingen</h3>
                    <p className="text-sm text-gray-500 mb-3">Er zijn nog geen collegegeld instellingen geconfigureerd.</p>
                    <Button 
                      onClick={() => setShowTuitionDialog(true)}
                      size="sm"
                      className="bg-[#1e40af] hover:bg-blue-800"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Collegegeld toevoegen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Overzicht Collegegeld</CardTitle>
                <CardDescription>Samenvatting van collegegeld instellingen en betalingen</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-blue-100">
                        <School className="h-5 w-5 text-[#1e40af]" />
                      </div>
                      <h4 className="font-medium">Huidige Periode</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collegegeld 2024-2025:</span>
                        <span className="font-medium">€2.390,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Betaald:</span>
                        <span className="font-medium">€1.793,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resterende betalingen:</span>
                        <span className="font-medium">€597,00</span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Betalingsvoortgang</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-blue-100">
                        <Users className="h-5 w-5 text-[#1e40af]" />
                      </div>
                      <h4 className="font-medium">Studentenbetalingen</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Totaal # studenten:</span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volledig betaald:</span>
                        <span className="font-medium">118 (76%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gedeeltelijk betaald:</span>
                        <span className="font-medium">32 (20%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Niet betaald:</span>
                        <span className="font-medium">6 (4%)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-medium mb-3">Recente Collegegeld Betalingen</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                        <th className="py-2 px-3 text-left">STUDENT</th>
                        <th className="py-2 px-3 text-left">PERIODE</th>
                        <th className="py-2 px-3 text-left">BEDRAG</th>
                        <th className="py-2 px-3 text-left">DATUM</th>
                        <th className="py-2 px-3 text-left">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="text-sm hover:bg-gray-50">
                        <td className="py-2 px-3">Ahmed Yilmaz</td>
                        <td className="py-2 px-3">2024-2025, Termijn 2</td>
                        <td className="py-2 px-3 font-medium">€795,00</td>
                        <td className="py-2 px-3">15-02-2025</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Betaald
                          </Badge>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50">
                        <td className="py-2 px-3">Sarah Bakker</td>
                        <td className="py-2 px-3">2024-2025, Termijn 2</td>
                        <td className="py-2 px-3 font-medium">€795,00</td>
                        <td className="py-2 px-3">14-02-2025</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Betaald
                          </Badge>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50">
                        <td className="py-2 px-3">Mohamed El Amrani</td>
                        <td className="py-2 px-3">2024-2025, Termijn 2</td>
                        <td className="py-2 px-3 font-medium">€795,00</td>
                        <td className="py-2 px-3">10-02-2025</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                            In behandeling
                          </Badge>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50">
                        <td className="py-2 px-3">Lisa Jansen</td>
                        <td className="py-2 px-3">2024-2025, Termijn 2</td>
                        <td className="py-2 px-3 font-medium">€795,00</td>
                        <td className="py-2 px-3">05-02-2025</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            Te laat
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content voor Activiteiten tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Activiteiten en Kosten</h3>
              <Button className="flex items-center bg-[#1e40af] hover:bg-blue-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Activiteit toevoegen</span>
              </Button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">Schoolreis Amsterdam</CardTitle>
                      <Badge>€45,00</Badge>
                    </div>
                    <CardDescription>12 mei 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">Dagexcursie naar het Rijksmuseum en Nemo Science Museum in Amsterdam.</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Betaald door studenten</span>
                      <span>32/45</span>
                    </div>
                    <Progress value={71} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Bewerken
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">Sportdag</CardTitle>
                      <Badge>€15,00</Badge>
                    </div>
                    <CardDescription>24 juni 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">Jaarlijkse sportdag met verschillende activiteiten en lunch inbegrepen.</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Betaald door studenten</span>
                      <span>84/156</span>
                    </div>
                    <Progress value={54} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Bewerken
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">Meerdaagse Studiereis</CardTitle>
                      <Badge>€295,00</Badge>
                    </div>
                    <CardDescription>14-17 september 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">Vierdaagse educatieve reis naar Berlijn met bezoeken aan culturele instellingen.</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Betaald door studenten</span>
                      <span>12/60</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Bewerken
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Content voor Kortingen tab */}
        <TabsContent value="discounts" className="space-y-6">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Kortingen en Speciale Regelingen</h3>
              <Button 
                onClick={() => setShowDiscountDialog(true)}
                className="flex items-center bg-[#1e40af] hover:bg-blue-800"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Korting toevoegen</span>
              </Button>
            </div>
            
            <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nieuwe Korting</DialogTitle>
                  <DialogDescription>
                    Maak een nieuwe korting of financiële regeling aan
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...discountForm}>
                  <form onSubmit={discountForm.handleSubmit(handleSubmitDiscount)} className="space-y-4">
                    <FormField
                      control={discountForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naam</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bijv. Gezinskorting" />
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
                            <FormLabel>Type Korting</FormLabel>
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
                                <SelectItem value="family">Gezinskorting</SelectItem>
                                <SelectItem value="early_payment">Vroegboekkorting</SelectItem>
                                <SelectItem value="financial_aid">Financiële hulp</SelectItem>
                                <SelectItem value="scholarship">Beurs</SelectItem>
                                <SelectItem value="other">Overig</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <FormField
                          control={discountForm.control}
                          name="isPercentage"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="is-percentage"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel htmlFor="is-percentage" className="text-sm cursor-pointer">
                                  Percentage in plaats van vast bedrag
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={discountForm.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {discountForm.watch("isPercentage") ? "Percentage (%)" : "Bedrag (€)"}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step={discountForm.watch("isPercentage") ? "1" : "0.01"}
                                  min="0"
                                  max={discountForm.watch("isPercentage") ? "100" : undefined}
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={discountForm.control}
                        name="validFrom"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Geldig vanaf</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd-MM-yyyy", { locale: nl })
                                    ) : (
                                      <span>Kies een datum</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  locale={nl}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={discountForm.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Geldig tot (optioneel)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd-MM-yyyy", { locale: nl })
                                    ) : (
                                      <span>Kies een datum</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  locale={nl}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={discountForm.control}
                      name="criteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Criteria</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bijv. Voor gezinnen met 3+ kinderen ingeschreven" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={discountForm.control}
                      name="maxUsesPerStudent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max. gebruik per student</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Hoe vaak kan een student deze korting gebruiken? Standaard: 1 keer.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDiscountDialog(false)}
                      >
                        Annuleren
                      </Button>
                      <Button type="submit" className="bg-[#1e40af] hover:bg-blue-800">
                        Korting toevoegen
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <div className="p-4">
              {discountsData && discountsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discountsData.map((discount: any) => (
                    <Card key={discount.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">{discount.name}</CardTitle>
                          <Badge>
                            {discount.isPercentage ? `${discount.value}%` : formatCurrency(discount.value)}
                          </Badge>
                        </div>
                        <CardDescription>{discount.discountType}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">{discount.criteria}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="font-normal">
                            Geldig vanaf: {new Date(discount.validFrom).toLocaleDateString('nl-NL')}
                          </Badge>
                          {discount.validUntil && (
                            <Badge variant="outline" className="font-normal">
                              Geldig tot: {new Date(discount.validUntil).toLocaleDateString('nl-NL')}
                            </Badge>
                          )}
                          <Badge variant="outline" className="font-normal">
                            Max. per student: {discount.maxUsesPerStudent || 1}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Gebruikers
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Bewerken
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Geen kortingen gevonden</h3>
                  <p className="text-gray-500 mb-4">Er zijn nog geen kortingen of speciale regelingen geconfigureerd.</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDiscountDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Nieuwe korting toevoegen</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Collegegeld toevoegen dialog */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Collegegeld Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe collegegeld betaling toe voor een student
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-select">Student</Label>
              <Select defaultValue={selectedStudent || ""} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student-select">
                  <SelectValue placeholder="Selecteer een student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData && studentsData.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tuition-amount">Bedrag (€)</Label>
                <Input
                  id="tuition-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue="795"
                />
              </div>
              
              <div>
                <Label htmlFor="payment-type">Type Betaling</Label>
                <Select defaultValue="tuition">
                  <SelectTrigger id="payment-type">
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Collegegeld</SelectItem>
                    <SelectItem value="enrollment">Inschrijfgeld</SelectItem>
                    <SelectItem value="installment">Termijnbetaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="tuition-description">Omschrijving</Label>
              <Input
                id="tuition-description"
                placeholder="Bijv. Collegegeld 2024-2025, Termijn 1"
                defaultValue="Collegegeld 2024-2025, Termijn 2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tuition-due-date">Vervaldatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="tuition-due-date"
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>15 Februari 2025</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date("2025-02-15")}
                      onSelect={() => {}}
                      locale={nl}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="tuition-status">Status</Label>
                <Select defaultValue="pending">
                  <SelectTrigger id="tuition-status">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">In behandeling</SelectItem>
                    <SelectItem value="paid">Betaald</SelectItem>
                    <SelectItem value="overdue">Te laat</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="academic-year">Academisch Jaar</Label>
              <Select defaultValue="2024-2025">
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Selecteer academisch jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingPayment(false)}>
              Annuleren
            </Button>
            <Button className="bg-[#1e40af] hover:bg-blue-800">
              Collegegeld toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}