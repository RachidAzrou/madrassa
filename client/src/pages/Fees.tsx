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
  TrendingUp,
  BarChart3,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

// Import custom components
import { PremiumHeader } from '@/components/layout/premium-header';
import { CustomDialog, DialogHeaderWithIcon } from '@/components/ui/custom-dialog';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { 
  StandardTable, 
  StandardTableHeader, 
  StandardTableBody, 
  StandardTableRow, 
  StandardTableCell, 
  StandardTableHeaderCell,
  TableCheckboxHeader,
  TableCheckboxCell,
  TableActionButtons,
  TableActionCell,
  EmptyActionHeader
} from '@/components/ui/standard-table';


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
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [selectedRates, setSelectedRates] = useState<number[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  
  // Dialog states for action buttons
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const [isViewRateDialogOpen, setIsViewRateDialogOpen] = useState(false);
  const [isEditRateDialogOpen, setIsEditRateDialogOpen] = useState(false);
  const [isDeleteRateDialogOpen, setIsDeleteRateDialogOpen] = useState(false);
  const [isViewDiscountDialogOpen, setIsViewDiscountDialogOpen] = useState(false);
  const [isEditDiscountDialogOpen, setIsEditDiscountDialogOpen] = useState(false);
  const [isDeleteDiscountDialogOpen, setIsDeleteDiscountDialogOpen] = useState(false);
  
  // Selected items for actions
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);

  // Handler functions for payment actions
  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditPaymentDialogOpen(true);
  };

  const handleDeletePayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeletePaymentDialogOpen(true);
  };

  // Handler functions for rate actions
  const handleViewRate = (rate: any) => {
    setSelectedRate(rate);
    setIsViewRateDialogOpen(true);
  };

  const handleEditRate = (rate: any) => {
    setSelectedRate(rate);
    setIsEditRateDialogOpen(true);
  };

  const handleDeleteRate = (rate: any) => {
    setSelectedRate(rate);
    setIsDeleteRateDialogOpen(true);
  };

  // Handler functions for discount actions
  const handleViewDiscount = (discount: any) => {
    setSelectedDiscount(discount);
    setIsViewDiscountDialogOpen(true);
  };

  const handleEditDiscount = (discount: any) => {
    setSelectedDiscount(discount);
    setIsEditDiscountDialogOpen(true);
  };

  const handleDeleteDiscount = (discount: any) => {
    setSelectedDiscount(discount);
    setIsDeleteDiscountDialogOpen(true);
  };
  
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

      {/* Statistics Widgets - Desktop Application Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Totaal Geïnd kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Euro className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Totaal Geïnd</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">€45,231</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Openstaand kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Clock className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Openstaand</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">€8,540</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Betalingspercentage kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <TrendingUp className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Slagingspercentage</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">84%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Aantal Studenten kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Users className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Betalende Studenten</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">156</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Betalingen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
          <TabsTrigger value="reports">Rapporten</TabsTrigger>
        </TabsList>

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
            <StandardTableHeader>
              <StandardTableRow>
                <TableCheckboxHeader
                  checked={filteredPayments.length > 0 && selectedPayments.length === filteredPayments.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPayments(filteredPayments.map((p: any) => p.id));
                    } else {
                      setSelectedPayments([]);
                    }
                  }}
                />
                <StandardTableHeaderCell>Student</StandardTableHeaderCell>
                <StandardTableHeaderCell>Factuur</StandardTableHeaderCell>
                <StandardTableHeaderCell>Bedrag</StandardTableHeaderCell>
                <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                <StandardTableHeaderCell>Datum</StandardTableHeaderCell>
                <EmptyActionHeader />
              </StandardTableRow>
            </StandardTableHeader>
            <StandardTableBody>
              {paymentsLoading ? (
                <StandardTableRow>
                  <StandardTableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Betalingen laden...</span>
                    </div>
                  </StandardTableCell>
                </StandardTableRow>
              ) : filteredPayments.length === 0 ? (
                <StandardTableRow>
                  <StandardTableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Geen betalingen gevonden
                  </StandardTableCell>
                </StandardTableRow>
              ) : (
                filteredPayments.map((payment: any) => (
                  <StandardTableRow key={payment.id} className="group">
                    <TableCheckboxCell
                      checked={selectedPayments.includes(payment.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPayments([...selectedPayments, payment.id]);
                        } else {
                          setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                        }
                      }}
                    />
                    <StandardTableCell>
                      <div className="font-medium">{payment.studentName || 'Onbekend'}</div>
                      <div className="text-muted-foreground">{payment.studentId || '-'}</div>
                    </StandardTableCell>
                    <StandardTableCell>{payment.invoiceNumber || '-'}</StandardTableCell>
                    <StandardTableCell>€{payment.amount || '0,00'}</StandardTableCell>
                    <StandardTableCell>
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
                    </StandardTableCell>
                    <StandardTableCell>{payment.date || '-'}</StandardTableCell>
                    <TableActionCell>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleViewPayment(payment)}
                          title="Bekijk betaling"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleEditPayment(payment)}
                          title="Bewerk betaling"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleDeletePayment(payment)}
                          title="Verwijder betaling"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableActionCell>
                  </StandardTableRow>
                ))
              )}
            </StandardTableBody>
          </StandardTable>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">

          {/* Bestaande Tarieven Tabel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Bestaande Tarieven
              </h3>
              <Button onClick={() => setShowTuitionRateDialog(true)} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                <Plus className="h-4 w-4 mr-2" />
                Nieuw Tarief
              </Button>
            </div>
            <StandardTable>
              <StandardTableHeader>
                <StandardTableRow>
                  <TableCheckboxHeader
                    checked={selectedRates.length === 3}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRates([1, 2, 3]);
                      } else {
                        setSelectedRates([]);
                      }
                    }}
                  />
                  <StandardTableHeaderCell>Type</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Bedrag</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Academisch Jaar</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                  <EmptyActionHeader />
                </StandardTableRow>
              </StandardTableHeader>
              <StandardTableBody>
                <StandardTableRow className="group">
                  <TableCheckboxCell
                    checked={selectedRates.includes(1)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRates([...selectedRates, 1]);
                      } else {
                        setSelectedRates(selectedRates.filter(id => id !== 1));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Collegegeld</StandardTableCell>
                  <StandardTableCell>€2.500,00</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionCell>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleViewRate({id: 1, name: 'Collegegeld', amount: 2500, year: '2024-2025', status: 'Actief'})}
                        title="Bekijk tarief"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditRate({id: 1, name: 'Collegegeld', amount: 2500, year: '2024-2025', status: 'Actief'})}
                        title="Bewerk tarief"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleDeleteRate({id: 1, name: 'Collegegeld', amount: 2500, year: '2024-2025', status: 'Actief'})}
                        title="Verwijder tarief"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableActionCell>
                </StandardTableRow>
                <StandardTableRow className="group">
                  <TableCheckboxCell
                    checked={selectedRates.includes(2)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRates([...selectedRates, 2]);
                      } else {
                        setSelectedRates(selectedRates.filter(id => id !== 2));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Inschrijfgeld</StandardTableCell>
                  <StandardTableCell>€150,00</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionCell>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleViewRate({id: 2, name: 'Inschrijfgeld', amount: 150, year: '2024-2025', status: 'Actief'})}
                        title="Bekijk tarief"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditRate({id: 2, name: 'Inschrijfgeld', amount: 150, year: '2024-2025', status: 'Actief'})}
                        title="Bewerk tarief"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleDeleteRate({id: 2, name: 'Inschrijfgeld', amount: 150, year: '2024-2025', status: 'Actief'})}
                        title="Verwijder tarief"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableActionCell>
                </StandardTableRow>
                <StandardTableRow className="group">
                  <TableCheckboxCell
                    checked={selectedRates.includes(3)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRates([...selectedRates, 3]);
                      } else {
                        setSelectedRates(selectedRates.filter(id => id !== 3));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Lesmateriaal</StandardTableCell>
                  <StandardTableCell>€85,00</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionCell>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => console.log('Bekijk tarief:', 3)}
                        title="Bekijk tarief"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => console.log('Bewerk tarief:', 3)}
                        title="Bewerk tarief"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => console.log('Verwijder tarief:', 3)}
                        title="Verwijder tarief"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableActionCell>
                </StandardTableRow>
              </StandardTableBody>
            </StandardTable>
          </div>

          {/* Bestaande Kortingen Tabel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Bestaande Kortingen
              </h3>
              <Button onClick={() => setShowDiscountDialog(true)} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Korting
              </Button>
            </div>
            <StandardTable>
              <StandardTableHeader>
                <StandardTableRow>
                  <TableCheckboxHeader
                    checked={selectedDiscounts.length === 2}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDiscounts([1, 2]);
                      } else {
                        setSelectedDiscounts([]);
                      }
                    }}
                  />
                  <StandardTableHeaderCell>Naam</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Type</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Korting</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Academisch Jaar</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                  <EmptyActionHeader />
                </StandardTableRow>
              </StandardTableHeader>
              <StandardTableBody>
                <StandardTableRow>
                  <TableCheckboxCell
                    checked={selectedDiscounts.includes(1)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDiscounts([...selectedDiscounts, 1]);
                      } else {
                        setSelectedDiscounts(selectedDiscounts.filter(id => id !== 1));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Meerkinderen Korting</StandardTableCell>
                  <StandardTableCell>Familie</StandardTableCell>
                  <StandardTableCell>15%</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionButtons
                    onView={() => handleViewDiscount({ id: 1, name: 'Meerkinderen Korting', type: 'Familie', percentage: '15%', year: '2024-2025', status: 'Actief' })}
                    onEdit={() => handleEditDiscount({ id: 1, name: 'Meerkinderen Korting', type: 'Familie', percentage: '15%', year: '2024-2025', status: 'Actief' })}
                    onDelete={() => handleDeleteDiscount({ id: 1, name: 'Meerkinderen Korting', type: 'Familie', percentage: '15%', year: '2024-2025', status: 'Actief' })}
                    viewTitle="Bekijk korting"
                    editTitle="Bewerk korting"
                    deleteTitle="Verwijder korting"
                  />
                </StandardTableRow>
                <StandardTableRow>
                  <TableCheckboxCell
                    checked={selectedDiscounts.includes(2)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDiscounts([...selectedDiscounts, 2]);
                      } else {
                        setSelectedDiscounts(selectedDiscounts.filter(id => id !== 2));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Vroegboek Korting</StandardTableCell>
                  <StandardTableCell>Tijdelijk</StandardTableCell>
                  <StandardTableCell>10%</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionButtons
                    onView={() => handleViewDiscount({ id: 2, name: 'Vroegboek Korting', type: 'Tijdelijk', percentage: '10%', year: '2024-2025', status: 'Actief' })}
                    onEdit={() => handleEditDiscount({ id: 2, name: 'Vroegboek Korting', type: 'Tijdelijk', percentage: '10%', year: '2024-2025', status: 'Actief' })}
                    onDelete={() => handleDeleteDiscount({ id: 2, name: 'Vroegboek Korting', type: 'Tijdelijk', percentage: '10%', year: '2024-2025', status: 'Actief' })}
                    viewTitle="Bekijk korting"
                    editTitle="Bewerk korting"
                    deleteTitle="Verwijder korting"
                  />
                </StandardTableRow>
                <StandardTableRow>
                  <TableCheckboxCell
                    checked={selectedDiscounts.includes(3)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDiscounts([...selectedDiscounts, 3]);
                      } else {
                        setSelectedDiscounts(selectedDiscounts.filter(id => id !== 3));
                      }
                    }}
                  />
                  <StandardTableCell className="font-medium">Sociaal Tarief</StandardTableCell>
                  <StandardTableCell>Inkomen</StandardTableCell>
                  <StandardTableCell>25%</StandardTableCell>
                  <StandardTableCell>2024-2025</StandardTableCell>
                  <StandardTableCell>
                    <Badge variant="secondary" className="text-xs">Actief</Badge>
                  </StandardTableCell>
                  <TableActionButtons
                    onView={() => handleViewDiscount({ id: 3, name: 'Sociaal Tarief', type: 'Inkomen', percentage: '25%', year: '2024-2025', status: 'Actief' })}
                    onEdit={() => handleEditDiscount({ id: 3, name: 'Sociaal Tarief', type: 'Inkomen', percentage: '25%', year: '2024-2025', status: 'Actief' })}
                    onDelete={() => handleDeleteDiscount({ id: 3, name: 'Sociaal Tarief', type: 'Inkomen', percentage: '25%', year: '2024-2025', status: 'Actief' })}
                    viewTitle="Bekijk korting"
                    editTitle="Bewerk korting"
                    deleteTitle="Verwijder korting"
                  />
                </StandardTableRow>
              </StandardTableBody>
            </StandardTable>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-500 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  PDF
                </span>
              </div>
              <h3 className="text-sm font-medium text-red-700 mb-1">Betalingsrapport</h3>
              <p className="text-xs text-red-600 mb-4">Volledig overzicht van alle betalingen</p>
              <Button 
                variant="outline" 
                className="w-full border-red-300 text-red-700 hover:bg-red-50" 
                onClick={() => {
                  toast({ 
                    title: "PDF wordt gegenereerd", 
                    description: "Het betalingsrapport wordt gedownload als PDF bestand." 
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-500 p-3 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  Excel
                </span>
              </div>
              <h3 className="text-sm font-medium text-emerald-700 mb-1">Openstaande Posten</h3>
              <p className="text-xs text-emerald-600 mb-4">Alle uitstaande betalingen en facturen</p>
              <Button 
                variant="outline" 
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50" 
                onClick={() => {
                  toast({ 
                    title: "Excel wordt gegenereerd", 
                    description: "Het rapport met openstaande posten wordt gedownload als Excel bestand." 
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-500 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                  CSV
                </span>
              </div>
              <h3 className="text-sm font-medium text-indigo-700 mb-1">Financieel Overzicht</h3>
              <p className="text-xs text-indigo-600 mb-4">Analyse van alle financiële gegevens</p>
              <Button 
                variant="outline" 
                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50" 
                onClick={() => {
                  toast({ 
                    title: "CSV wordt gegenereerd", 
                    description: "Het financiële overzicht wordt gedownload als CSV bestand." 
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Nieuwe Betaling Dialog */}
      <CustomDialog 
        open={showPaymentDialog} 
        onOpenChange={setShowPaymentDialog}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<CreditCard className="h-5 w-5" />}
          title="Nieuwe Betaling"
          description="Voeg een nieuwe betaling toe aan het systeem"
        />
        
        <Form {...paymentForm}>
          <form onSubmit={paymentForm.handleSubmit(handleCreatePayment)} className="flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
              
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
                            {type.label} - €{type.amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student/Class Selection */}
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
            </div>

            <DialogFooter className="border-t bg-gray-50 px-6 py-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)} 
                className="w-full sm:w-auto"
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={createPaymentMutation.isPending} 
                className="bg-[#1e40af] hover:bg-[#1e40af]/90 w-full sm:w-auto"
              >
                {createPaymentMutation.isPending ? 'Bezig...' : 'Betaling Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </CustomDialog>

      {/* Nieuw Tarief Dialog */}
      <Dialog open={showTuitionRateDialog} onOpenChange={setShowTuitionRateDialog}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <VisuallyHidden>
            <DialogTitle>Nieuw Tarief</DialogTitle>
            <DialogDescription>Voeg een nieuw tarief toe aan het systeem</DialogDescription>
          </VisuallyHidden>
          <div className="bg-[#1e40af] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full text-[#f5f6f7] bg-[#ffffff33]">
                <Euro className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold m-0">Nieuw Tarief</h2>
                <p className="text-white/70 text-sm m-0">Voeg een nieuw tarief toe aan het systeem</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
            <Form {...tuitionRateForm}>
              <form id="tuition-rate-form" onSubmit={tuitionRateForm.handleSubmit(handleCreateTuitionRate)} className="space-y-4">
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

              </form>
            </Form>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t">
            <Button type="button" variant="outline" onClick={() => setShowTuitionRateDialog(false)} className="w-full sm:w-auto mt-2 sm:mt-0">
              Annuleren
            </Button>
            <Button type="submit" disabled={createTuitionRateMutation.isPending} className="bg-[#1e40af] hover:bg-[#1e40af]/90 w-full sm:w-auto" form="tuition-rate-form">
              {createTuitionRateMutation.isPending ? 'Bezig...' : 'Tarief Toevoegen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nieuwe Korting Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <VisuallyHidden>
            <DialogTitle>Nieuwe Korting</DialogTitle>
            <DialogDescription>Voeg een nieuwe korting toe aan het systeem</DialogDescription>
          </VisuallyHidden>
          <div className="bg-[#1e40af] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full text-[#f5f6f7] bg-[#ffffff33]">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold m-0">Nieuwe Korting</h2>
                <p className="text-white/70 text-sm m-0">Voeg een nieuwe korting toe aan het systeem</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
            <Form {...discountForm}>
              <form id="discount-form" onSubmit={discountForm.handleSubmit(handleCreateDiscount)} className="space-y-4">
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

              </form>
            </Form>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t">
            <Button type="button" variant="outline" onClick={() => setShowDiscountDialog(false)} className="w-full sm:w-auto mt-2 sm:mt-0">
              Annuleren
            </Button>
            <Button type="submit" disabled={createDiscountMutation.isPending} className="bg-[#1e40af] hover:bg-[#1e40af]/90 w-full sm:w-auto" form="discount-form">
              {createDiscountMutation.isPending ? 'Bezig...' : 'Korting Toevoegen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <CustomDialog 
        open={isViewPaymentDialogOpen} 
        onOpenChange={setIsViewPaymentDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Eye className="h-5 w-5" />}
          title="Betaling Details"
          description="Bekijk de details van deze betaling"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedPayment && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Student</label>
                <p className="text-sm">{selectedPayment.studentName || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Bedrag</label>
                <p className="text-sm">€{selectedPayment.amount || '0,00'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="text-sm">{selectedPayment.type || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm">{selectedPayment.status || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Datum</label>
                <p className="text-sm">{selectedPayment.date || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Referentie</label>
                <p className="text-sm">{selectedPayment.reference || '-'}</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsViewPaymentDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Sluiten
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* View Rate Dialog */}
      <CustomDialog 
        open={isViewRateDialogOpen} 
        onOpenChange={setIsViewRateDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Euro className="h-5 w-5" />}
          title="Tarief Details"
          description="Bekijk de details van dit tarief"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedRate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Naam</label>
                <p className="text-sm">{selectedRate.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Bedrag</label>
                <p className="text-sm">€{selectedRate.amount || '0,00'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Academisch Jaar</label>
                <p className="text-sm">{selectedRate.year || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm">{selectedRate.status || '-'}</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsViewRateDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Sluiten
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* Edit Payment Dialog */}
      <CustomDialog 
        open={isEditPaymentDialogOpen} 
        onOpenChange={setIsEditPaymentDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Edit3 className="h-5 w-5" />}
          title="Betaling Bewerken"
          description="Wijzig de details van deze betaling"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedPayment && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Student</label>
                <input 
                  type="text" 
                  defaultValue={selectedPayment.studentName || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bedrag (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  defaultValue={selectedPayment.amount || '0.00'} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <select 
                  defaultValue={selectedPayment.type || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="inschrijvingsgeld">Inschrijvingsgeld</option>
                  <option value="activiteit">Activiteit</option>
                  <option value="lesmateriaal">Lesmateriaal</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select 
                  defaultValue={selectedPayment.status || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="betaald">Betaald</option>
                  <option value="openstaand">Openstaand</option>
                  <option value="verwerkt">Verwerkt</option>
                  <option value="gefaald">Gefaald</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Datum</label>
                <input 
                  type="date" 
                  defaultValue={selectedPayment.date || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Referentie</label>
                <input 
                  type="text" 
                  defaultValue={selectedPayment.reference || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsEditPaymentDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Annuleren
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Betaling bijgewerkt",
                description: "De betalingsgegevens zijn succesvol gewijzigd.",
              });
              setIsEditPaymentDialogOpen(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Opslaan
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* Edit Rate Dialog */}
      <CustomDialog 
        open={isEditRateDialogOpen} 
        onOpenChange={setIsEditRateDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Edit3 className="h-5 w-5" />}
          title="Tarief Bewerken"
          description="Wijzig de details van dit tarief"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedRate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Naam</label>
                <input 
                  type="text" 
                  defaultValue={selectedRate.name || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bedrag (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  defaultValue={selectedRate.amount || '0.00'} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Academisch Jaar</label>
                <input 
                  type="text" 
                  defaultValue={selectedRate.year || ''} 
                  placeholder="2024-2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select 
                  defaultValue={selectedRate.status || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Actief">Actief</option>
                  <option value="Inactief">Inactief</option>
                  <option value="Concept">Concept</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsEditRateDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Annuleren
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Tarief bijgewerkt",
                description: "Het tarief is succesvol gewijzigd.",
              });
              setIsEditRateDialogOpen(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Opslaan
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* Delete Payment Confirmation Dialog */}
      <DeleteDialog
        open={isDeletePaymentDialogOpen}
        onOpenChange={setIsDeletePaymentDialogOpen}
        title="Betaling verwijderen"
        description={`Weet je zeker dat je deze betaling wilt verwijderen?`}
        onConfirm={() => {
          console.log('Verwijder betaling:', selectedPayment?.id);
          toast({
            title: "Betaling verwijderd",
            description: `De betaling van ${selectedPayment?.studentName} is succesvol verwijderd.`,
          });
          setIsDeletePaymentDialogOpen(false);
          setSelectedPayment(null);
        }}
        item={selectedPayment ? {
          name: `${selectedPayment.studentName} - €${selectedPayment.amount}`,
          id: selectedPayment.reference || `Type: ${selectedPayment.type}`,
          initials: selectedPayment.studentName?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'BT'
        } : undefined}
        warningText="Deze actie kan niet ongedaan worden gemaakt. Alle betalingsgegevens worden permanent verwijderd."
        confirmButtonText="Verwijderen"
        cancelButtonText="Annuleren"
      />

      {/* Delete Rate Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteRateDialogOpen}
        onOpenChange={setIsDeleteRateDialogOpen}
        title="Tarief verwijderen"
        description={`Weet je zeker dat je dit tarief wilt verwijderen?`}
        onConfirm={() => {
          console.log('Verwijder tarief:', selectedRate?.id);
          toast({
            title: "Tarief verwijderd",
            description: `Het tarief "${selectedRate?.name}" is succesvol verwijderd.`,
          });
          setIsDeleteRateDialogOpen(false);
          setSelectedRate(null);
        }}
        item={selectedRate ? {
          name: `${selectedRate.name} - €${selectedRate.amount}`,
          id: selectedRate.year || 'Geen academisch jaar',
          initials: selectedRate.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'TR'
        } : undefined}
        warningText="Deze actie kan niet ongedaan worden gemaakt. Alle gerelateerde betalingen blijven behouden maar verwijzen naar een niet-bestaand tarief."
        confirmButtonText="Verwijderen"
        cancelButtonText="Annuleren"
      />

      {/* View Discount Dialog */}
      <CustomDialog 
        open={isViewDiscountDialogOpen} 
        onOpenChange={setIsViewDiscountDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Percent className="h-5 w-5" />}
          title="Korting Details"
          description="Bekijk de details van deze korting"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedDiscount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Naam</label>
                <p className="text-sm">{selectedDiscount.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="text-sm">{selectedDiscount.type || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Korting</label>
                <p className="text-sm">{selectedDiscount.percentage || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Academisch Jaar</label>
                <p className="text-sm">{selectedDiscount.year || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm">{selectedDiscount.status || '-'}</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsViewDiscountDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Sluiten
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* Edit Discount Dialog */}
      <CustomDialog 
        open={isEditDiscountDialogOpen} 
        onOpenChange={setIsEditDiscountDialogOpen}
        className="max-w-2xl"
      >
        <DialogHeaderWithIcon 
          icon={<Edit3 className="h-5 w-5" />}
          title="Korting Bewerken"
          description="Wijzig de details van deze korting"
        />
        <div className="flex-1 space-y-4 p-6">
          {selectedDiscount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Naam</label>
                <input 
                  type="text" 
                  defaultValue={selectedDiscount.name || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <select 
                  defaultValue={selectedDiscount.type || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Familie">Familie</option>
                  <option value="Tijdelijk">Tijdelijk</option>
                  <option value="Inkomen">Inkomen</option>
                  <option value="Student">Student</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Korting (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  defaultValue={selectedDiscount.percentage?.replace('%', '') || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Academisch Jaar</label>
                <select 
                  defaultValue={selectedDiscount.year || ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Beschrijving</label>
                <textarea 
                  rows={3}
                  placeholder="Optionele beschrijving van de korting..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="outline"
            onClick={() => setIsEditDiscountDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Annuleren
          </Button>
          <Button
            onClick={() => {
              console.log('Wijzig korting:', selectedDiscount?.id);
              toast({
                title: "Korting bijgewerkt",
                description: `De korting "${selectedDiscount?.name}" is succesvol bijgewerkt.`,
              });
              setIsEditDiscountDialogOpen(false);
            }}
            className="w-full sm:w-auto bg-[#1e40af] hover:bg-[#1e40af]/90"
          >
            Opslaan
          </Button>
        </DialogFooter>
      </CustomDialog>

      {/* Delete Discount Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDiscountDialogOpen}
        onOpenChange={setIsDeleteDiscountDialogOpen}
        title="Korting verwijderen"
        description={`Weet je zeker dat je deze korting wilt verwijderen?`}
        onConfirm={() => {
          console.log('Verwijder korting:', selectedDiscount?.id);
          toast({
            title: "Korting verwijderd",
            description: `De korting "${selectedDiscount?.name}" is succesvol verwijderd.`,
          });
          setIsDeleteDiscountDialogOpen(false);
          setSelectedDiscount(null);
        }}
        item={selectedDiscount ? {
          name: `${selectedDiscount.name} - ${selectedDiscount.percentage}`,
          id: selectedDiscount.type || 'Geen type',
          initials: selectedDiscount.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'KT'
        } : undefined}
        warningText="Deze actie kan niet ongedaan worden gemaakt. Alle gerelateerde betalingen blijven behouden maar verwijzen naar een niet-bestaande korting."
        confirmButtonText="Verwijderen"
        cancelButtonText="Annuleren"
      />

    </div>
  );
}