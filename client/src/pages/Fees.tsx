// Clean backup to restore from
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Euro, 
  Plus, 
  Search, 
  Download, 
  Filter,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
  Receipt,
  Calendar,
  Users,
  Target,
  TrendingUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

// Import custom components
import { PremiumHeader } from '@/components/layout/premium-header';
import { StandardTable } from '@/components/ui/standard-table';

// Payment types - these will be managed dynamically
const defaultPaymentTypes = [
  { id: 1, value: 'inschrijvingsgeld', label: 'Inschrijvingsgeld', prefix: 'INS', amount: 150.00 },
  { id: 2, value: 'activiteit', label: 'Activiteit', prefix: 'ACT', amount: 25.00 },
  { id: 3, value: 'lesmateriaal', label: 'Lesmateriaal', prefix: 'LES', amount: 45.00 },
  { id: 4, value: 'collegegeld', label: 'Collegegeld', prefix: 'COL', amount: 350.00 },
  { id: 5, value: 'examen', label: 'Examen', prefix: 'EXA', amount: 75.00 },
];

// Default discounts
const defaultDiscounts = [
  { id: 1, name: 'Familiekorting', percentage: 10, description: 'Korting voor families met meerdere kinderen', active: true },
  { id: 2, name: 'Vroegboeker', percentage: 5, description: 'Korting bij vroege inschrijving', active: true },
  { id: 3, name: 'Studentenkorting', percentage: 15, description: 'Korting voor studenten', active: false },
];

// Form schemas
const paymentFormSchema = z.object({
  paymentMode: z.enum(['single', 'multiple', 'bulk']),
  studentIds: z.array(z.string()).min(1, "Minimaal één student selecteren"),
  classId: z.string().optional(),
  type: z.string().min(1, "Type is verplicht"),
  amount: z.string().min(1, "Bedrag is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
});

const tuitionRateFormSchema = z.object({
  type: z.string().min(1, "Type is verplicht"),
  amount: z.string().min(1, "Bedrag is verplicht"),
  academicYear: z.string().min(1, "Academisch jaar is verplicht"),
  description: z.string().optional(),
});

const discountFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  type: z.enum(["percentage", "fixed"]),
  value: z.string().min(1, "Waarde is verplicht"),
  academicYear: z.string().min(1, "Academisch jaar is verplicht"),
});

export default function Fees() {
  // State management
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTuitionRateDialog, setShowTuitionRateDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic data state
  const [paymentTypes, setPaymentTypes] = useState(defaultPaymentTypes);
  const [discounts, setDiscounts] = useState(defaultDiscounts);
  
  // Form instances
  const paymentForm = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMode: 'single' as const,
      studentIds: [],
      classId: '',
      type: '',
      amount: '',
      description: '',
      dueDate: '',
    },
  });

  // Watch payment mode and type to generate payment reference
  const paymentMode = paymentForm.watch('paymentMode');
  const selectedType = paymentForm.watch('type');
  const selectedStudentIds = paymentForm.watch('studentIds');

  // Generate unique payment reference
  const generatePaymentReference = (type: string, studentId: string) => {
    const typeData = paymentTypes.find(t => t.value === type);
    const prefix = typeData?.prefix || 'PAY';
    return `${prefix}-${studentId}-${Date.now().toString().slice(-6)}`;
  };

  // Get default amount for selected payment type
  const getDefaultAmountForType = (type: string) => {
    const paymentType = paymentTypes.find(pt => pt.value === type);
    return paymentType ? paymentType.amount.toString() : '';
  };

  // Check for applicable discounts
  const getApplicableDiscounts = (studentId: string) => {
    // Mock discount logic - in real app this would check database
    const discounts = [
      { name: 'Familiekorting', percentage: 10, applicable: true },
      { name: 'Vroegboeker', percentage: 5, applicable: false },
    ];
    return discounts.filter(d => d.applicable);
  };

  // Auto-fill amount when type changes
  React.useEffect(() => {
    if (selectedType) {
      const defaultAmount = getDefaultAmountForType(selectedType);
      if (defaultAmount) {
        paymentForm.setValue('amount', defaultAmount);
      }
    }
  }, [selectedType, paymentForm]);

  const tuitionRateForm = useForm({
    resolver: zodResolver(tuitionRateFormSchema),
    defaultValues: {
      type: '',
      amount: '',
      academicYear: '',
      description: '',
    },
  });

  const discountForm = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: '',
      type: 'percentage' as const,
      value: '',
      academicYear: '',
    },
  });

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // API queries
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/fees/stats'],
  });

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/stats'] });
      toast({ title: "Betaling aangemaakt", description: "De betaling is succesvol aangemaakt." });
      setShowPaymentDialog(false);
      paymentForm.reset();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden bij het aanmaken van de betaling.", variant: "destructive" });
    },
  });

  const createTuitionRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/tuition-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create tuition rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tuition-rates'] });
      toast({ title: "Tarief toegevoegd", description: "Het nieuwe tarief is succesvol toegevoegd." });
      setShowTuitionRateDialog(false);
      tuitionRateForm.reset();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden bij het toevoegen van het tarief.", variant: "destructive" });
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create discount');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      toast({ title: "Korting toegevoegd", description: "De nieuwe korting is succesvol toegevoegd." });
      setShowDiscountDialog(false);
      discountForm.reset();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden bij het toevoegen van de korting.", variant: "destructive" });
    },
  });

  // Form handlers
  const handleCreatePayment = (data: any) => {
    createPaymentMutation.mutate(data);
  };

  const handleCreateTuitionRate = (data: any) => {
    // Handle locally instead of API call
    if (data.type && data.description && data.amount) {
      const newType = {
        id: Date.now(),
        value: data.type.toLowerCase().replace(/\s+/g, '_'),
        label: data.type,
        prefix: data.description.substring(0, 3).toUpperCase(),
        amount: parseFloat(data.amount)
      };
      setPaymentTypes([...paymentTypes, newType]);
      tuitionRateForm.reset();
      setShowTuitionRateDialog(false);
      toast({ 
        title: "Betalingstype toegevoegd", 
        description: `${newType.label} is succesvol toegevoegd.` 
      });
    }
  };

  const handleCreateDiscount = (data: any) => {
    // Handle locally instead of API call
    if (data.name && data.value) {
      const newDiscount = {
        id: Date.now(),
        name: data.name,
        percentage: parseInt(data.value),
        description: data.academicYear || 'Geen beschrijving',
        active: data.type === 'percentage'
      };
      setDiscounts([...discounts, newDiscount]);
      discountForm.reset();
      setShowDiscountDialog(false);
      toast({ 
        title: "Korting toegevoegd", 
        description: `${newDiscount.name} is succesvol toegevoegd.` 
      });
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    toast({ title: "Export gestart", description: "Het PDF rapport wordt gegenereerd..." });
    // Implement PDF export logic
  };

  const handleExportExcel = () => {
    toast({ title: "Export gestart", description: "Het Excel bestand wordt gegenereerd..." });
    // Implement Excel export logic
  };

  const handleExportCSV = () => {
    toast({ title: "Export gestart", description: "Het CSV bestand wordt gegenereerd..." });
    // Implement CSV export logic
  };

  // Filter payments based on search
  const filteredPayments = Array.isArray(paymentsData) ? paymentsData.filter((payment: any) =>
    payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  return (
    <div className="space-y-6 p-6">
      <PremiumHeader
        title="Betalingsbeheer"
        description="Beheer alle betalingen, facturen en tarieven van uw onderwijsinstelling"
        icon={Euro}
        breadcrumbs={[{ label: "Financiën", href: "/fees" }]}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="payments">Betalingen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
          <TabsTrigger value="reports">Rapporten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Geïnd</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{statsData?.totalCollected?.toLocaleString() || '0,00'}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% van vorige maand
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{statsData?.pendingAmount?.toLocaleString() || '0,00'}</div>
                <p className="text-xs text-muted-foreground">
                  {statsData?.pendingInvoices || 0} openstaande facturen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Betalingspercentage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.completionRate?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% van vorige maand
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actieve Studenten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +12 nieuwe inschrijvingen
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Zoek betalingen..." 
                className="w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Betaling
            </Button>
          </div>
          
          <StandardTable>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Factuur</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Betalingen laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Geen betalingen gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment: any) => (
                  <TableRow key={payment.id} className="group">
                    <TableCell className="text-xs">
                      <div className="font-medium">{payment.studentName || 'Onbekend'}</div>
                      <div className="text-muted-foreground">{payment.studentId || '-'}</div>
                    </TableCell>
                    <TableCell className="text-xs">{payment.invoiceNumber || '-'}</TableCell>
                    <TableCell className="text-xs">€{payment.amount || '0,00'}</TableCell>
                    <TableCell className="text-xs">
                      <Badge 
                        variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                        className={
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {payment.status === 'paid' ? 'Betaald' : 
                         payment.status === 'pending' ? 'In behandeling' : 
                         'Gefaald'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{payment.date || '-'}</TableCell>
                    <TableCell className="text-xs">
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                        <Button variant="ghost" size="sm">Bekijken</Button>
                        <Button variant="ghost" size="sm">Bewerken</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </StandardTable>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Tarieven Beheer
                </CardTitle>
                <CardDescription>
                  Beheer de verschillende tarieven voor uw onderwijsinstelling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => setShowTuitionRateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Tarief Toevoegen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Kortingen Beheer
                </CardTitle>
                <CardDescription>
                  Configureer kortingen en speciale tarieven
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => setShowDiscountDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Korting Toevoegen
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Betalingsrapport</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Openstaande Posten</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Financieel Overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Nieuwe Betaling Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>Nieuwe Betaling</DialogTitle>
            <DialogDescription>Voeg een nieuwe betaling toe aan het systeem</DialogDescription>
          </VisuallyHidden>
          
          <div className="bg-blue-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Nieuwe Betaling</h2>
                <p className="text-blue-100 text-sm">Voeg een nieuwe betaling toe aan het systeem</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleCreatePayment)} className="space-y-4">
                
                {/* Payment Mode Selection */}
                <FormField
                  control={paymentForm.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betalingsmodus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer betalingsmodus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Enkele Student</SelectItem>
                          <SelectItem value="multiple">Meerdere Studenten</SelectItem>
                          <SelectItem value="bulk">Hele Klas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Type Selection */}
                <FormField
                  control={paymentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betalingstype</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type betaling" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.prefix})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional Student/Class Selection */}
                {paymentMode === 'bulk' ? (
                  <FormField
                    control={paymentForm.control}
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
                            <SelectItem value="klas-1">Arabisch Beginners (2024-2025)</SelectItem>
                            <SelectItem value="klas-2">Quran Memorisatie (2024-2025)</SelectItem>
                            <SelectItem value="klas-3">Islamitische Studies (2024-2025)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={paymentForm.control}
                    name="studentIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {paymentMode === 'single' ? 'Student' : 'Studenten'}
                        </FormLabel>
                        {paymentMode === 'single' ? (
                          <Select 
                            onValueChange={(value) => field.onChange([value])} 
                            defaultValue={field.value?.[0]}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="STU-001">Ahmed Hassan (STU-001)</SelectItem>
                              <SelectItem value="STU-002">Fatima Al-Zahra (STU-002)</SelectItem>
                              <SelectItem value="STU-003">Omar Ibn Khattab (STU-003)</SelectItem>
                              <SelectItem value="STU-004">Yusuf Ibrahim (STU-004)</SelectItem>
                              <SelectItem value="STU-005">Aisha Mohammed (STU-005)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Selecteer meerdere studenten voor deze betaling
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                              {[
                                { id: 'STU-001', name: 'Ahmed Hassan' },
                                { id: 'STU-002', name: 'Fatima Al-Zahra' },
                                { id: 'STU-003', name: 'Omar Ibn Khattab' },
                                { id: 'STU-004', name: 'Yusuf Ibrahim' },
                                { id: 'STU-005', name: 'Aisha Mohammed' },
                              ].map((student) => (
                                <div key={student.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={student.id}
                                    checked={field.value?.includes(student.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentValue, student.id]);
                                      } else {
                                        field.onChange(currentValue.filter(id => id !== student.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={student.id} className="text-sm">
                                    {student.name} ({student.id})
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={paymentForm.control}
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

                  <FormField
                    control={paymentForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vervaldatum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={paymentForm.control}
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

                {/* Applicable Discounts Preview */}
                {selectedStudentIds.length > 0 && (
                  <div className="space-y-3">
                    {selectedStudentIds.map(studentId => {
                      const discounts = getApplicableDiscounts(studentId);
                      if (discounts.length > 0) {
                        return (
                          <div key={studentId} className="bg-green-50 p-3 rounded border border-green-200">
                            <div className="text-sm font-medium text-green-800 mb-2">
                              Kortingen voor {studentId}:
                            </div>
                            <div className="space-y-1">
                              {discounts.map(discount => (
                                <div key={discount.name} className="text-sm text-green-700">
                                  • {discount.name}: {discount.percentage}% korting
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Payment Reference Preview */}
                {selectedType && selectedStudentIds.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="text-sm font-medium mb-2">Betalingskenmerk(en):</div>
                    <div className="space-y-1">
                      {selectedStudentIds.map(studentId => (
                        <div key={studentId} className="text-sm text-blue-600 font-mono">
                          {generatePaymentReference(selectedType, studentId)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? 'Bezig...' : 'Betaling Aanmaken'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nieuw Tarief Dialog */}
      <Dialog open={showTuitionRateDialog} onOpenChange={setShowTuitionRateDialog}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <VisuallyHidden>
            <DialogTitle>Nieuw Tarief</DialogTitle>
            <DialogDescription>Voeg een nieuw tarief toe aan het systeem</DialogDescription>
          </VisuallyHidden>
          <div className="bg-green-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Euro className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Nieuw Tarief</h2>
                <p className="text-green-100 text-sm">Voeg een nieuw tarief toe aan het systeem</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Form {...tuitionRateForm}>
              <form onSubmit={tuitionRateForm.handleSubmit(handleCreateTuitionRate)} className="space-y-4">
                <FormField
                  control={tuitionRateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Collegegeld, Inschrijving, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={tuitionRateForm.control}
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

                  <FormField
                    control={tuitionRateForm.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <FormControl>
                          <Input placeholder="2024-2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={tuitionRateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving (optioneel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Beschrijving van het tarief" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowTuitionRateDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createTuitionRateMutation.isPending}>
                    {createTuitionRateMutation.isPending ? 'Bezig...' : 'Tarief Toevoegen'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nieuwe Korting Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <div className="bg-purple-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Percent className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Nieuwe Korting</h2>
                <p className="text-purple-100 text-sm">Voeg een nieuwe korting toe aan het systeem</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Form {...discountForm}>
              <form onSubmit={discountForm.handleSubmit(handleCreateDiscount)} className="space-y-4">
                <FormField
                  control={discountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input placeholder="Naam van de korting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={discountForm.control}
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
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waarde</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <FormControl>
                        <Input placeholder="2024-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowDiscountDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createDiscountMutation.isPending}>
                    {createDiscountMutation.isPending ? 'Bezig...' : 'Korting Toevoegen'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}