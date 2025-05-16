import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, DollarSign, CreditCard, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  const { data: statsData } = useQuery({
    queryKey: ['/api/fees/stats'],
  });
  
  type StatsType = {
    stats: {
      totalCollected: number;
      pendingAmount: number;
      totalStudents: number;
      completionRate: number;
    }
  };
  
  // Fetch students for the student selector
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
  });

  // Vanwege de API structuur, is data een array van fee records
  const feeRecords = Array.isArray(data) ? data : [];
  const totalRecords = feeRecords.length;
  const totalPages = Math.ceil(totalRecords / 10);
  
  // Ophalen van programma's voor het filter
  const programs = Array.isArray(programsData) ? programsData : [];
  
  // Students voor in de dropdown
  const students = Array.isArray(studentsData) ? studentsData : [];

  // Type voor het formulier
  type FeeFormValues = z.infer<typeof feeFormSchema>;
  
  // Formulier init
  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      status: 'in behandeling',
    },
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
      await apiRequest('DELETE', `/api/fees/${selectedFee.id}`);
      
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
      
      await apiRequest('PUT', `/api/fees/${selectedFee.id}`, feeData);
      
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
      
      await apiRequest('POST', '/api/fees', feeData);
      
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
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In behandeling</Badge>;
      case 'te laat':
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Te laat</Badge>;
      case 'gedeeltelijk':
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Gedeeltelijk</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
            Beheer van collegegelden, betalingen en beurzen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek betalingsrecords..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddFeeRecord} className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Betalingsrecord Toevoegen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nieuwe Betaling Toevoegen</DialogTitle>
                <DialogDescription>
                  Voeg een nieuwe betalingsverplichting toe aan het systeem.
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
                                {student.firstName} {student.lastName} ({student.studentNumber})
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
                        <FormLabel>Omschrijving</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="bv. Collegegeld Semester 1 2025" />
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
                          <Input {...field} placeholder="0,00" />
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
                              <SelectValue placeholder="Selecteer status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in behandeling">In behandeling</SelectItem>
                            <SelectItem value="betaald">Betaald</SelectItem>
                            <SelectItem value="te laat">Te laat</SelectItem>
                            <SelectItem value="gedeeltelijk">Gedeeltelijk betaald</SelectItem>
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
                    <Button type="submit">Betaling Toevoegen</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Bewerk dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Betaling Bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van deze betalingsverplichting.
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
                            {student.firstName} {student.lastName} ({student.studentNumber})
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
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="bv. Collegegeld Semester 1 2025" />
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
                      <Input {...field} placeholder="0,00" />
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
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in behandeling">In behandeling</SelectItem>
                        <SelectItem value="betaald">Betaald</SelectItem>
                        <SelectItem value="te laat">Te laat</SelectItem>
                        <SelectItem value="gedeeltelijk">Gedeeltelijk betaald</SelectItem>
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
                <Button type="submit">Wijzigingen Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Verwijder bevestiging dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Betaling Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze betaling wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
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

      {/* Statistische overzichten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Totaal geïnd */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Totaal Geïnd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-green-100 p-2">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(statsData?.stats?.totalCollected || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  In dit academisch jaar
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Openstaand bedrag */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Openstaand Bedrag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-yellow-100 p-2">
                <CreditCard className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(statsData?.stats?.pendingAmount || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Nog te innen betalingen
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Studenten met openstaande betalingen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Studenten met Betalingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-blue-100 p-2">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsData?.stats?.totalStudents || 0}
                </div>
                <div className="text-xs text-gray-500">
                  Met actieve betalingsverplichtingen
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Afrondings percentage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Afrondings Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsData?.stats?.completionRate || 0}%
                </div>
                <div className="text-xs text-gray-500">
                  Van totale betalingsverplichtingen
                </div>
              </div>
            </div>
            <Progress className="mt-2" value={statsData?.stats?.completionRate || 0} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs voor betalingsrecords, programma's en beurzen */}
      <Tabs defaultValue="fee-records" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="fee-records">
            <CreditCard className="h-4 w-4 mr-2" />
            Betalingsrecords
          </TabsTrigger>
          <TabsTrigger value="payment-programs">
            <Filter className="h-4 w-4 mr-2" />
            Betalingsprogramma's
          </TabsTrigger>
          <TabsTrigger value="scholarships">
            <CheckCircle className="h-4 w-4 mr-2" />
            Beurzen
          </TabsTrigger>
        </TabsList>
        
        {/* Tab inhoud voor fee records */}
        <TabsContent value="fee-records" className="space-y-4">
          {/* Filter Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label htmlFor="program-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Programma Filter
                </label>
                <Select onValueChange={handleProgramChange} defaultValue={program}>
                  <SelectTrigger id="program-filter">
                    <SelectValue placeholder="Alle programma's" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle programma's</SelectItem>
                    {programs.map((program: any) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Filter
                </label>
                <Select onValueChange={handleStatusChange} defaultValue={status}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="betaald">Betaald</SelectItem>
                    <SelectItem value="in behandeling">In behandeling</SelectItem>
                    <SelectItem value="te laat">Te laat</SelectItem>
                    <SelectItem value="gedeeltelijk">Gedeeltelijk betaald</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-initial">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Acties
                </label>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
              </div>
            </div>
          </div>
          
          {/* Fee Records Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Laden...' : `Tonen van ${feeRecords.length} van ${totalRecords} betalingsrecords`}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factuurnr.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vervaldatum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isError ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-red-500">
                        Fout bij het laden van betalingsrecords. Probeer het opnieuw.
                      </td>
                    </tr>
                  ) : isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Betalingsrecords laden...
                      </td>
                    </tr>
                  ) : feeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Geen betalingsrecords gevonden met de huidige filters. Probeer je zoekopdracht of filters aan te passen.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {feeRecords.map((fee: any) => {
                        // Zoek de student op bij elke betaling
                        const student = Array.isArray(studentsData) ? 
                          studentsData.find((s: any) => s.id === fee.studentId) : null;
                          
                        // Bereken initialen voor avatar
                        const initials = student ? 
                          `${student.firstName.charAt(0)}${student.lastName.charAt(0)}` : 
                          'ST';
                          
                        // Format the date
                        const feeDate = new Date(fee.dueDate);
                        const formattedDate = format(feeDate, "d MMM yyyy", { locale: nl });
                        
                        // Create invoice number (format: FAC-YEAR-ID)
                        const invoiceNumber = `FAC-${new Date(fee.createdAt || Date.now()).getFullYear()}-${fee.id.toString().padStart(4, '0')}`;
                        
                        return (
                          <tr key={fee.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    {student ? `${student.firstName} ${student.lastName}` : "Onbekende student"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student ? student.studentNumber : "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{invoiceNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{fee.description}</div>
                              <div className="text-xs text-gray-500">
                                {programs.find((p: any) => p.id === (student?.programId || 0))?.name || "Programma onbekend"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(fee.amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formattedDate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(fee.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
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
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Pagina <span className="font-medium">{currentPage}</span> van{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-l-md"
                      >
                        Vorige
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-r-md ml-2"
                      >
                        Volgende
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Placeholder content voor de andere tabs */}
        <TabsContent value="payment-programs" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium">Betalingsprogramma's</h3>
            <p className="text-gray-500 mt-2">
              Hier kunt u betalingsprogramma's beheren voor verschillende studierichtingen en semesters.
              Deze functionaliteit komt binnenkort beschikbaar.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="scholarships" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium">Beurzen en Financiële Ondersteuning</h3>
            <p className="text-gray-500 mt-2">
              Beheer beurzen, subsidies en andere vormen van financiële ondersteuning voor studenten.
              Deze functionaliteit komt binnenkort beschikbaar.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}