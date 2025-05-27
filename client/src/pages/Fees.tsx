import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, DollarSign, CreditCard, CheckCircle, 
  Users, Settings, Percent, AlertCircle, ChevronDown, FileText, UserPlus, Euro, Coins, 
  Mail, Phone, Home, CalendarIcon, Plus, User, X, MapPin, School, XCircle, Receipt, Calculator,
  Clock, TrendingUp, FileSpreadsheet
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
  academicYear: z.string().min(1, { message: "Selecteer een academisch jaar" }),
  feeType: z.string().min(1, { message: "Selecteer een type betaling" }),
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
  
  // Tab management
  const [activeTab, setActiveTab] = useState("overzicht");
  
  // Dialog states
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  // Fetch data
  const { data: feesData = [], isLoading: isLoadingFees } = useQuery({
    queryKey: ['/api/fees'],
    enabled: activeTab === 'betalingen'
  });

  const { data: statsData = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/fees/stats'],
    enabled: activeTab === 'overzicht'
  });

  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students']
  });

  const { data: academicYearsData = [], isLoading: isLoadingAcademicYears } = useQuery({
    queryKey: ['/api/academic-years']
  });

  const { data: feeTypesData = [], isLoading: isLoadingFeeTypes } = useQuery({
    queryKey: ['/api/fee-types']
  });

  // Form for adding fees
  const feeForm = useForm<z.infer<typeof feeFormSchema>>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      studentId: "",
      amount: 0,
      description: "",
      status: "pending",
      academicYear: "2024-2025",
      feeType: "",
    },
  });

  // Filter fees based on search and filters
  const filteredFees = feesData.filter((fee: any) => {
    const matchesSearch = !searchQuery || 
      fee.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
    const matchesYear = yearFilter === "all" || fee.academicYear === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Handle fee creation
  const handleCreateFee = async (values: z.infer<typeof feeFormSchema>) => {
    try {
      const response = await apiRequest('/api/fees', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({
          title: "Betaling toegevoegd",
          description: "De betaling is succesvol toegevoegd.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/fees'] });
        queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
        setShowAddFeeDialog(false);
        feeForm.reset();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de betaling.",
        variant: "destructive",
      });
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      paid: { label: "Betaald", variant: "default" as const, color: "bg-green-100 text-green-800" },
      pending: { label: "In behandeling", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      overdue: { label: "Te laat", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      cancelled: { label: "Geannuleerd", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <PremiumHeader
        title="Betalingsbeheer"
        description="Beheer schoolgelden, betalingen en financiële instellingen"
        icon={Coins}
        breadcrumb="Financiën > Betalingsbeheer"
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
            Betalingen
          </TabsTrigger>
          <TabsTrigger value="instellingen" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Instellingen
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
                <CardTitle className="text-sm font-medium">Studenten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Actieve studenten
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
              <CardDescription>Veelgebruikte taken voor betalingsbeheer</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => setShowAddFeeDialog(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <PlusCircle className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Nieuwe Betaling</div>
                  <div className="text-sm text-muted-foreground">Voeg betalingsverplichting toe</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setShowSettingsDialog(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Settings className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Instellingen</div>
                  <div className="text-sm text-muted-foreground">Configureer tarieven</div>
                </div>
              </Button>
              
              <Button 
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Export</div>
                  <div className="text-sm text-muted-foreground">Download rapporten</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Betalingen Tab */}
        <TabsContent value="betalingen" className="space-y-6">
          {/* Zoek en acties */}
          <SearchActionLayout>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoeken naar betalingen..."
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
                  {academicYearsData.map((year: any) => (
                    <SelectItem key={year.id} value={year.name}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => setShowAddFeeDialog(true)} 
                className="flex items-center bg-[#1e40af] hover:bg-blue-800"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Nieuwe Betaling</span>
              </Button>
            </div>
          </SearchActionLayout>

          {/* Betalingen tabel */}
          <StandardTable>
            <StandardTableHeader>
              <div className="grid grid-cols-6 gap-4 p-4">
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">STUDENT</div>
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">BESCHRIJVING</div>
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">BEDRAG</div>
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">VERVALDATUM</div>
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">STATUS</div>
                <div className="font-medium text-xs text-gray-600 uppercase tracking-wide">ACTIES</div>
              </div>
            </StandardTableHeader>
            
            {isLoadingFees ? (
              <TableLoadingState colSpan={6} />
            ) : filteredFees && filteredFees.length > 0 ? (
              <StandardTableBody>
                {filteredFees.map((fee: any) => (
                  <StandardTableRow key={fee.id} className="hover:bg-gray-50">
                    <StandardTableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {fee.student?.firstName?.[0]}{fee.student?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-xs">
                            {fee.student?.firstName} {fee.student?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {fee.student?.studentId}
                          </div>
                        </div>
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs">
                        <div className="font-medium">{fee.description}</div>
                        <div className="text-gray-500">{fee.feeType}</div>
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs font-medium">
                        {formatCurrency(parseFloat(fee.amount || '0'))}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="text-xs">
                        {fee.dueDate ? format(new Date(fee.dueDate), 'dd-MM-yyyy', { locale: nl }) : '-'}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <StatusBadge status={fee.status} />
                    </StandardTableCell>
                    <TableActionCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableActionCell>
                  </StandardTableRow>
                ))}
              </StandardTableBody>
            ) : (
              <TableEmptyState 
                colSpan={6}
                icon={<Receipt className="w-12 h-12 text-gray-300" />}
                title="Geen betalingen gevonden"
                description="Er zijn nog geen betalingen aangemaakt of er zijn geen betalingen die voldoen aan je filters."
                action={
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFeeDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Nieuwe betaling toevoegen</span>
                  </Button>
                }
              />
            )}
          </StandardTable>
        </TabsContent>

        {/* Instellingen Tab */}
        <TabsContent value="instellingen" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Betalingsinstellingen</CardTitle>
              <CardDescription>Configureer tarieven en betalingsopties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Instellingen worden hier weergegeven...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapporten Tab */}
        <TabsContent value="rapporten" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financiële Rapporten</CardTitle>
              <CardDescription>Genereer en download betalingsrapporten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Rapporten worden hier weergegeven...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog voor nieuwe betaling */}
      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Nieuwe Betaling Toevoegen
            </DialogTitle>
            <DialogDescription>
              Voeg een nieuwe betalingsverplichting toe voor een student.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...feeForm}>
            <form onSubmit={feeForm.handleSubmit(handleCreateFee)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={feeForm.control}
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
                          {studentsData.map((student: any) => (
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
                  control={feeForm.control}
                  name="amount"
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
              </div>

              <FormField
                control={feeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Beschrijving van de betaling" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={feeForm.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type Betaling</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feeTypesData.map((type: any) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={feeForm.control}
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
                          {academicYearsData.map((year: any) => (
                            <SelectItem key={year.id} value={year.name}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={feeForm.control}
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
                  control={feeForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddFeeDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  Betaling Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}