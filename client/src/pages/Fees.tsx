import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, DollarSign, CreditCard, CheckCircle, 
  Users, Settings, Percent, AlertCircle, ChevronDown, FileText, UserPlus, Euro, Coins, 
  Mail, Phone, Home, CalendarIcon, Plus, User, X, MapPin, School, XCircle, Receipt, Calculator,
  Clock, TrendingUp, FileSpreadsheet, Building2, Banknote, Target, Send
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { SearchActionLayout } from '@/components/ui/data-table-container';
import { StandardTable, StandardTableHeader, StandardTableBody, StandardTableRow, 
         StandardTableHeaderCell, StandardTableCell, TableLoadingState, TableEmptyState, 
         TableActionCell } from '@/components/ui/standard-table';
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
  CustomDialog,
  DialogHeaderWithIcon,
  DialogFormContainer,
  DialogFooterContainer,
  FormLabel as CustomFormLabel
} from "@/components/ui/custom-dialog";
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Schema voor factuur toevoegen
const invoiceFormSchema = z.object({
  studentId: z.string().min(1, { message: "Selecteer een student" }),
  type: z.string().min(1, { message: "Selecteer factuurtype" }),
  description: z.string().min(3, { message: "Omschrijving is verplicht" }),
  baseAmount: z.coerce.number().min(0.01, { message: "Bedrag moet groter zijn dan 0" }),
  dueDate: z.date({ required_error: "Selecteer een vervaldatum" }),
  academicYear: z.string().min(1, { message: "Selecteer een academisch jaar" }),
  classId: z.string().optional(),
  notes: z.string().optional(),
});

// Schema voor tariefbeheer
const tuitionRateFormSchema = z.object({
  academicYear: z.string().min(1, { message: "Academisch jaar is verplicht" }),
  type: z.string().min(1, { message: "Type is verplicht" }),
  name: z.string().min(1, { message: "Naam is verplicht" }),
  baseAmount: z.coerce.number().min(0.01, { message: "Bedrag moet groter zijn dan 0" }),
  description: z.string().optional(),
});

// Schema voor kortingsbeheer
const discountFormSchema = z.object({
  name: z.string().min(1, { message: "Naam is verplicht" }),
  discountType: z.string().min(1, { message: "Type korting is verplicht" }),
  discountValue: z.string().min(1, { message: "Waarde is verplicht" }),
  academicYear: z.string().min(1, { message: "Academisch jaar is verplicht" }),
  description: z.string().optional(),
});

// Schema voor bulk facturen
const bulkInvoiceFormSchema = z.object({
  classId: z.string().min(1, { message: "Selecteer een klas" }),
  type: z.string().min(1, { message: "Selecteer factuurtype" }),
  description: z.string().min(3, { message: "Omschrijving is verplicht" }),
  baseAmount: z.coerce.number().min(0.01, { message: "Bedrag moet groter zijn dan 0" }),
  dueDate: z.date({ required_error: "Selecteer een vervaldatum" }),
  academicYear: z.string().min(1, { message: "Selecteer een academisch jaar" }),
  notes: z.string().optional(),
});

// Hulpfunctie voor valutaformattering
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Factuurtype configuratie
const invoiceTypes = [
  { value: 'COL', label: 'Collegegeld', prefix: 'COL' },
  { value: 'INS', label: 'Inschrijfgeld', prefix: 'INS' },
  { value: 'MTR', label: 'Lesmateriaal', prefix: 'MTR' },
  { value: 'TRP', label: 'Uitstap/Trip', prefix: 'TRP' },
  { value: 'EXM', label: 'Examengeld', prefix: 'EXM' },
  { value: 'CRT', label: 'Certificaat', prefix: 'CRT' },
];

const academicYears = [
  '2023-2024',
  '2024-2025',
  '2025-2026'
];

export default function Fees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tab management
  const [activeTab, setActiveTab] = useState("overzicht");
  
  // Dialog states
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false);
  const [showBulkInvoiceDialog, setShowBulkInvoiceDialog] = useState(false);
  const [showAddTuitionRateDialog, setShowAddTuitionRateDialog] = useState(false);
  const [showAddDiscountDialog, setShowAddDiscountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  // Bulk actions
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  
  // Fetch data
  const { data: invoicesData = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/invoices'],
    enabled: activeTab === 'betalingen'
  });

  const { data: statsData = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/fees/stats'],
    enabled: activeTab === 'overzicht'
  });

  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students']
  });

  const { data: studentGroupsData = [], isLoading: isLoadingStudentGroups } = useQuery({
    queryKey: ['/api/student-groups']
  });

  const { data: tuitionRatesData = [], isLoading: isLoadingTuitionRates } = useQuery({
    queryKey: ['/api/tuition-rates'],
    enabled: activeTab === 'instellingen'
  });

  const { data: feeDiscountsData = [], isLoading: isLoadingFeeDiscounts } = useQuery({
    queryKey: ['/api/fee-discounts'],
    enabled: activeTab === 'instellingen'
  });

  const { data: paymentsData = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments'],
    enabled: activeTab === 'betalingen'
  });

  // Forms voor verschillende items
  const invoiceForm = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      studentId: "",
      type: "COL",
      description: "",
      baseAmount: 0,
      academicYear: "2024-2025",
      classId: "",
      notes: "",
    },
  });

  const tuitionRateForm = useForm<z.infer<typeof tuitionRateFormSchema>>({
    resolver: zodResolver(tuitionRateFormSchema),
    defaultValues: {
      academicYear: "2024-2025",
      type: "COL",
      name: "",
      baseAmount: 0,
      description: "",
    },
  });

  const discountForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      discountType: "percentage",
      discountValue: "",
      academicYear: "2024-2025",
      description: "",
    },
  });

  const bulkInvoiceForm = useForm<z.infer<typeof bulkInvoiceFormSchema>>({
    resolver: zodResolver(bulkInvoiceFormSchema),
    defaultValues: {
      classId: "",
      type: "COL",
      description: "",
      baseAmount: 0,
      academicYear: "2024-2025",
      notes: "",
    },
  });

  // Filter facturen op zoektermen en filters
  const filteredInvoices = invoicesData.filter((invoice: any) => {
    const matchesSearch = !searchQuery || 
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesType = typeFilter === "all" || invoice.type === typeFilter;
    const matchesYear = yearFilter === "all" || invoice.academicYear === yearFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesYear;
  });

  // Handel factuur aanmaak af
  const handleCreateInvoice = async (values: z.infer<typeof invoiceFormSchema>) => {
    try {
      const response = await apiRequest('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: "Factuur aangemaakt",
          description: "De factuur is succesvol aangemaakt.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
        setShowAddInvoiceDialog(false);
        invoiceForm.reset();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de factuur.",
        variant: "destructive",
      });
    }
  };

  // Handel betaling via Mollie af
  const handleCreatePayment = async (invoice: any) => {
    try {
      const response = await apiRequest('/api/payments/mollie', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.finalAmount,
          description: `Betaling factuur ${invoice.invoiceNumber}`,
          redirectUrl: `${window.location.origin}/fees?payment=success`,
          webhookUrl: `${window.location.origin}/api/webhooks/mollie`,
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            invoiceType: invoice.type,
            studentId: invoice.studentId,
          }
        }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        // Open Mollie checkout in nieuwe tab
        window.open(checkoutUrl, '_blank');
        
        toast({
          title: "Betaling gestart",
          description: "De betalingspagina is geopend in een nieuwe tab.",
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het starten van de betaling.",
        variant: "destructive",
      });
    }
  };

  // Handel bulk facturen aanmaak af
  const handleCreateBulkInvoices = async (values: z.infer<typeof bulkInvoiceFormSchema>) => {
    try {
      const response = await apiRequest('/api/invoices/bulk', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Bulk facturen aangemaakt",
          description: data.message,
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
        setShowBulkInvoiceDialog(false);
        bulkInvoiceForm.reset();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de bulk facturen.",
        variant: "destructive",
      });
    }
  };

  // Handel tariefaanmaak af
  const handleCreateTuitionRate = async (values: z.infer<typeof tuitionRateFormSchema>) => {
    try {
      const response = await apiRequest('/api/tuition-rates', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: "Tarief aangemaakt",
          description: "Het nieuwe tarief is succesvol aangemaakt.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/tuition-rates'] });
        setShowAddTuitionRateDialog(false);
        tuitionRateForm.reset();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van het tarief.",
        variant: "destructive",
      });
    }
  };

  // Handel kortingsaanmaak af
  const handleCreateDiscount = async (values: z.infer<typeof discountFormSchema>) => {
    try {
      const response = await apiRequest('/api/fee-discounts', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: "Korting aangemaakt",
          description: "De nieuwe korting is succesvol aangemaakt.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/fee-discounts'] });
        setShowAddDiscountDialog(false);
        discountForm.reset();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de korting.",
        variant: "destructive",
      });
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      open: { label: "Open", color: "bg-blue-100 text-blue-800" },
      paid: { label: "Betaald", color: "bg-green-100 text-green-800" },
      overdue: { label: "Te laat", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Geannuleerd", color: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: string }) => {
    const typeConfig = invoiceTypes.find(t => t.value === type);
    return (
      <Badge variant="outline">
        {typeConfig?.label || type}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <PremiumHeader
        title="Betalingsbeheer"
        description="Volledig schoolbetalingen-beheersysteem met facturatie, Mollie integratie en rapportage"
        icon={Coins}
        breadcrumbs="Financiën > Betalingsbeheer"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overzicht" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="betalingen" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Facturen & Betalingen
          </TabsTrigger>
          <TabsTrigger value="instellingen" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tarieven & Kortingen
          </TabsTrigger>
          <TabsTrigger value="rapporten" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Rapporten
          </TabsTrigger>
        </TabsList>

        {/* Overzicht Tab */}
        <TabsContent value="overzicht" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Geïnd</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statsData.totalCollected || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Dit academisch jaar
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statsData.pendingAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Nog te ontvangen
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Te Laat</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statsData.overdueAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Openstaande schulden
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Voltooiingsgraad</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(statsData.completionRate || 0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Betalingen voltooid
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Snelle Acties */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
              <CardDescription>Veelgebruikte taken voor betalingsbeheer</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => setShowAddInvoiceDialog(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Receipt className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Nieuwe Factuur</div>
                  <div className="text-sm text-muted-foreground">Maak factuur voor student</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setShowBulkInvoiceDialog(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Building2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Bulk Facturen</div>
                  <div className="text-sm text-muted-foreground">Facturen voor hele klas</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setShowAddTuitionRateDialog(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Settings className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Tarieven Beheren</div>
                  <div className="text-sm text-muted-foreground">Stel schoolgelden in</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facturen & Betalingen Tab */}
        <TabsContent value="betalingen" className="space-y-6">
          {/* Zoek en acties */}
          <SearchActionLayout>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoeken naar facturen..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="overdue">Te laat</SelectItem>
                  <SelectItem value="cancelled">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {invoiceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Academisch jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center bg-[#1e40af] hover:bg-blue-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Nieuwe Factuur</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Factuur opties</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAddInvoiceDialog(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Individuele Factuur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBulkInvoiceDialog(true)}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Bulk Facturen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SearchActionLayout>

          {/* Facturen tabel */}
          <StandardTable>
            <StandardTableHeader>
              <StandardTableRow>
                <StandardTableHeaderCell>
                  <Checkbox />
                </StandardTableHeaderCell>
                <StandardTableHeaderCell>Factuurnummer</StandardTableHeaderCell>
                <StandardTableHeaderCell>Student</StandardTableHeaderCell>
                <StandardTableHeaderCell>Type</StandardTableHeaderCell>
                <StandardTableHeaderCell>Beschrijving</StandardTableHeaderCell>
                <StandardTableHeaderCell>Bedrag</StandardTableHeaderCell>
                <StandardTableHeaderCell>Vervaldatum</StandardTableHeaderCell>
                <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                <StandardTableHeaderCell>Acties</StandardTableHeaderCell>
              </StandardTableRow>
            </StandardTableHeader>
            
            {isLoadingInvoices ? (
              <TableLoadingState colSpan={9} />
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <StandardTableBody>
                {filteredInvoices.map((invoice: any) => (
                  <StandardTableRow key={invoice.id} className="hover:bg-gray-50">
                    <StandardTableCell>
                      <Checkbox 
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvoices([...selectedInvoices, invoice.id]);
                          } else {
                            setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                          }
                        }}
                      />
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs font-mono">
                        {invoice.invoiceNumber}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {invoice.student?.firstName?.[0]}{invoice.student?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-xs">
                            {invoice.student?.firstName} {invoice.student?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.student?.studentId}
                          </div>
                        </div>
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <TypeBadge type={invoice.type} />
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs">
                        <div className="font-medium">{invoice.description}</div>
                        {invoice.notes && (
                          <div className="text-gray-500 mt-1">{invoice.notes}</div>
                        )}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs">
                        <div className="font-medium">
                          {formatCurrency(parseFloat(invoice.finalAmount || '0'))}
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="text-gray-500 line-through">
                            {formatCurrency(parseFloat(invoice.baseAmount || '0'))}
                          </div>
                        )}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd-MM-yyyy', { locale: nl }) : '-'}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <StatusBadge status={invoice.status} />
                    </StandardTableCell>
                    <TableActionCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'open' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCreatePayment(invoice)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableActionCell>
                  </StandardTableRow>
                ))}
              </StandardTableBody>
            ) : (
              <TableEmptyState 
                colSpan={9}
                icon={<Receipt className="w-12 h-12 text-gray-300" />}
                title="Geen facturen gevonden"
                description="Er zijn nog geen facturen aangemaakt of er zijn geen facturen die voldoen aan je filters."
                action={
                  <Button
                    variant="outline"
                    onClick={() => setShowAddInvoiceDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Nieuwe factuur aanmaken</span>
                  </Button>
                }
              />
            )}
          </StandardTable>
        </TabsContent>

        {/* Tarieven & Kortingen Tab */}
        <TabsContent value="instellingen" className="space-y-6">
          {/* Action buttons like in students page */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddTuitionRateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nieuw Tarief
              </Button>
              <Button 
                onClick={() => setShowAddDiscountDialog(true)}
                variant="outline"
              >
                <Target className="mr-2 h-4 w-4" />
                Nieuwe Korting
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tarieven section */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Banknote className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Schoolgeld Tarieven</h3>
                      <p className="text-sm text-gray-500">Standaard tarieven per academisch jaar</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {tuitionRatesData && Array.isArray(tuitionRatesData) ? tuitionRatesData.length : 0}
                  </Badge>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {tuitionRatesData && Array.isArray(tuitionRatesData) && tuitionRatesData.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {tuitionRatesData.map((rate: any) => (
                      <div key={rate.id} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Euro className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{rate.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>{rate.academicYear}</span>
                                <span>•</span>
                                <TypeBadge type={rate.type} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-semibold text-lg text-gray-900">
                                {formatCurrency(parseFloat(rate.baseAmount || '0'))}
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Banknote className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen tarieven</h3>
                    <p className="text-gray-500 mb-4">Je hebt nog geen schoolgeld tarieven ingesteld.</p>
                    <Button onClick={() => setShowAddTuitionRateDialog(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Eerste tarief toevoegen
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Kortingen section */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Kortingsregels</h3>
                      <p className="text-sm text-gray-500">Automatische kortingen bij facturatie</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {feeDiscountsData && Array.isArray(feeDiscountsData) ? feeDiscountsData.length : 0}
                  </Badge>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {feeDiscountsData && Array.isArray(feeDiscountsData) && feeDiscountsData.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {feeDiscountsData.map((discount: any) => (
                      <div key={discount.id} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Percent className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{discount.name}</div>
                              <div className="text-sm text-gray-500">
                                <span>{discount.academicYear}</span>
                                {discount.description && (
                                  <>
                                    <span> • </span>
                                    <span className="truncate max-w-32">{discount.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-semibold text-lg text-gray-900">
                                {discount.discountType === 'percentage' ? 
                                  `${discount.discountValue}%` : 
                                  formatCurrency(parseFloat(discount.discountValue || '0'))
                                }
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen kortingen</h3>
                    <p className="text-gray-500 mb-4">Je hebt nog geen kortingsregels ingesteld.</p>
                    <Button onClick={() => setShowAddDiscountDialog(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Eerste korting toevoegen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Rapporten Tab */}
        <TabsContent value="rapporten" className="space-y-6">
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Rapporten & Analyses</h2>
              <p className="text-sm text-gray-600">Exporteer en analyseer betalingsgegevens</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Periode instellen
              </Button>
            </div>
          </div>

          {/* Basic reports */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Financieel Overzicht</h3>
                  <p className="text-sm text-gray-500">Compleet inkomsten rapport</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Overzicht van alle inkomsten, openstaande bedragen en betalingstrends</p>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Openstaande Schulden</h3>
                  <p className="text-sm text-gray-500">Debiteuren overzicht</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Lijst van studenten met openstaande betalingen en vervaldatums</p>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Betalingshistorie</h3>
                  <p className="text-sm text-gray-500">Transactie overzicht</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Chronologisch overzicht van alle uitgevoerde betalingen</p>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>

          {/* Advanced analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Trend Analyse</h3>
                  <p className="text-sm text-gray-500">Betalingspatronen & voorspellingen</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Analyse van betalingstrends, seizoenspatronen en voorspellingen voor komende periodes</p>
              <Button className="w-full" variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Genereer Analyse
              </Button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Betalingsherinneringen</h3>
                  <p className="text-sm text-gray-500">Automatische notificaties</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Verstuur automatische herinneringen naar studenten met openstaande betalingen</p>
              <Button className="w-full" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Verstuur Herinneringen
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog voor nieuwe factuur */}
      <Dialog open={showAddInvoiceDialog} onOpenChange={setShowAddInvoiceDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 bg-opacity-20 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Nieuwe Factuur Aanmaken</DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Maak een nieuwe factuur aan voor een specifieke student met automatische kortingsberekening.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Form {...invoiceForm}>
              <form onSubmit={invoiceForm.handleSubmit(handleCreateInvoice)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentsData && Array.isArray(studentsData) && studentsData.map((student: any) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.firstName} {student.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={invoiceForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factuurtype</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={invoiceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Beschrijving van de factuur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="baseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={invoiceForm.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academisch Jaar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer jaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={invoiceForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vervaldatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "dd-MM-yyyy", { locale: nl })
                            ) : (
                              <span>Selecteer datum</span>
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
                          locale={nl}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Extra notities bij deze factuur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowAddInvoiceDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit">
                    Factuur Aanmaken
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog voor bulk facturen */}
      <Dialog open={showBulkInvoiceDialog} onOpenChange={setShowBulkInvoiceDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 bg-opacity-20 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Bulk Facturen Aanmaken</DialogTitle>
                <DialogDescription className="text-green-100 mt-1">
                  Maak facturen aan voor alle studenten in een specifieke klas met automatische kortingsberekening.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Form {...bulkInvoiceForm}>
              <form onSubmit={bulkInvoiceForm.handleSubmit(handleCreateBulkInvoices)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkInvoiceForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer klas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentGroupsData && Array.isArray(studentGroupsData) && studentGroupsData.map((group: any) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.academicYear})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={bulkInvoiceForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factuurtype</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={bulkInvoiceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Beschrijving van de factuur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkInvoiceForm.control}
                  name="baseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bulkInvoiceForm.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academisch Jaar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer jaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={bulkInvoiceForm.control}
                  name="dueDate"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vervaldatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "dd-MM-yyyy", { locale: nl })
                            ) : (
                              <span>Selecteer datum</span>
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
                          locale={nl}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkInvoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Extra notities bij deze facturen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowBulkInvoiceDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit">
                    Bulk Facturen Aanmaken
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog voor nieuw tarief */}
      <Dialog open={showAddTuitionRateDialog} onOpenChange={setShowAddTuitionRateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Nieuw Tarief Toevoegen
            </DialogTitle>
            <DialogDescription>
              Stel een nieuw standaard tarief in voor het geselecteerde academische jaar.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...tuitionRateForm}>
            <form onSubmit={tuitionRateForm.handleSubmit(handleCreateTuitionRate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={tuitionRateForm.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academisch Jaar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer jaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tuitionRateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={tuitionRateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijv. Standaard collegegeld" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={tuitionRateForm.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={tuitionRateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Extra uitleg over dit tarief" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddTuitionRateDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  Tarief Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog voor nieuwe korting */}
      <Dialog open={showAddDiscountDialog} onOpenChange={setShowAddDiscountDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nieuwe Korting Toevoegen
            </DialogTitle>
            <DialogDescription>
              Maak een nieuwe kortingsregel aan die automatisch wordt toegepast bij facturatie.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...discountForm}>
            <form onSubmit={discountForm.handleSubmit(handleCreateDiscount)} className="space-y-4">
              <FormField
                control={discountForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijv. Gezinskorting" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input 
                          placeholder={discountForm.watch('discountType') === 'percentage' ? "10" : "50.00"} 
                          {...field} 
                        />
                      </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer jaar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={discountForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Voorwaarden en uitleg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDiscountDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  Korting Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}