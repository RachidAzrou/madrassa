import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Download, Filter, Eye, Edit, Trash2,
  Euro, Clock, AlertCircle, Calendar, CreditCard,
  Users, User, Gift, Shield, Activity, Receipt,
  Tag, Settings, History, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumHeader } from '@/components/layout/premium-header';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form schemas
const addPaymentSchema = z.object({
  studentId: z.number().min(1, 'Selecteer een student'),
  description: z.string().min(1, 'Omschrijving is verplicht'),
  amount: z.string().min(1, 'Bedrag is verplicht'),
  dueDate: z.string().min(1, 'Vervaldatum is verplicht'),
  type: z.string().min(1, 'Type is verplicht'),
});

const discountSchema = z.object({
  studentId: z.number().min(1, 'Selecteer een student'),
  discountId: z.number().min(1, 'Selecteer een kortingstype'),
  reason: z.string().optional(),
});

const tuitionFeeSchema = z.object({
  academicYearId: z.number().min(1, 'Selecteer een schooljaar'),
  amount: z.string().min(1, 'Bedrag is verplicht'),
  description: z.string().min(1, 'Omschrijving is verplicht'),
});

const createDiscountSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  type: z.enum(['percentage', 'amount']),
  value: z.number().min(0.01, 'Waarde moet groter zijn dan 0'),
  isAutomatic: z.boolean(),
  rule: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function Fees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [yearFilter, setYearFilter] = useState('alle');
  const [classFilter, setClassFilter] = useState('alle');
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showTuitionFeeDialog, setShowTuitionFeeDialog] = useState(false);
  const [showCreateDiscountDialog, setShowCreateDiscountDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showEditTuitionFeeDialog, setShowEditTuitionFeeDialog] = useState(false);
  const [showEditDiscountDialog, setShowEditDiscountDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingTuitionFee, setEditingTuitionFee] = useState<any>(null);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: number, name: string} | null>(null);

  // Check if user is parent
  const isParent = user?.role === 'ouder' as any;

  // Data fetching
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['/api/payments'],
  });

  const { data: studentsData = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: studentGroupsData = [] } = useQuery<any[]>({
    queryKey: ['/api/student-groups'],
  });

  const { data: academicYearsData = [] } = useQuery<any[]>({
    queryKey: ['/api/academic-years'],
  });

  const { data: discounts = [] } = useQuery<any[]>({
    queryKey: ['/api/discounts'],
  });

  const { data: discountApplicationsData = [] } = useQuery<any[]>({
    queryKey: ['/api/discount-applications'],
  });

  const { data: tuitionFeesData = [] } = useQuery<any[]>({
    queryKey: ['/api/tuition-fees'],
  });

  // Forms
  const addPaymentForm = useForm<z.infer<typeof addPaymentSchema>>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      studentId: 0,
      description: '',
      amount: '',
      dueDate: '',
      type: '',
    },
  });

  const discountForm = useForm<z.infer<typeof discountSchema>>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      studentId: 0,
      discountId: 0,
      reason: '',
    },
  });

  const tuitionFeeForm = useForm<z.infer<typeof tuitionFeeSchema>>({
    resolver: zodResolver(tuitionFeeSchema),
    defaultValues: {
      academicYearId: 0,
      amount: '',
      description: '',
    },
  });

  const createDiscountForm = useForm<z.infer<typeof createDiscountSchema>>({
    resolver: zodResolver(createDiscountSchema),
    defaultValues: {
      name: '',
      type: 'percentage' as const,
      value: 0,
      isAutomatic: false,
      rule: '',
      isActive: true,
    },
  });

  // Edit forms
  const editPaymentForm = useForm<z.infer<typeof addPaymentSchema> & { status: string }>({
    resolver: zodResolver(addPaymentSchema.extend({ status: z.string() })),
    defaultValues: {
      studentId: 0,
      description: '',
      amount: '',
      dueDate: '',
      type: '',
      status: '',
    },
  });

  const editTuitionFeeForm = useForm<z.infer<typeof tuitionFeeSchema> & { isActive: boolean }>({
    resolver: zodResolver(tuitionFeeSchema.extend({ isActive: z.boolean() })),
    defaultValues: {
      academicYearId: 0,
      amount: '',
      description: '',
      isActive: true,
    },
  });

  const editDiscountForm = useForm<z.infer<typeof createDiscountSchema>>({
    resolver: zodResolver(createDiscountSchema),
    defaultValues: {
      name: '',
      type: 'percentage' as const,
      value: 0,
      isAutomatic: false,
      rule: '',
      isActive: true,
    },
  });

  // Mutations
  const addPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addPaymentSchema>) => {
      return await apiRequest('POST', '/api/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setShowAddPaymentDialog(false);
      addPaymentForm.reset();
      toast({
        title: 'Betaling toegevoegd',
        description: 'De nieuwe betaling is succesvol toegevoegd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het toevoegen van de betaling.',
        variant: 'destructive',
      });
    },
  });

  const discountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/discount-applications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discount-applications'] });
      setShowDiscountDialog(false);
      discountForm.reset();
      toast({
        title: 'Korting toegekend',
        description: 'De korting is succesvol toegekend.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het toekennen van de korting.',
        variant: 'destructive',
      });
    },
  });

  const tuitionFeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tuitionFeeSchema>) => {
      const response = await apiRequest('POST', '/api/tuition-fees', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tuition-fees'] });
      setShowTuitionFeeDialog(false);
      tuitionFeeForm.reset();
      toast({
        title: 'Collegegeld ingesteld',
        description: 'Het collegegeld is succesvol ingesteld.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het instellen van het collegegeld.',
        variant: 'destructive',
      });
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createDiscountSchema>) => {
      return await apiRequest('POST', '/api/discounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      setShowCreateDiscountDialog(false);
      createDiscountForm.reset();
      toast({
        title: 'Korting aangemaakt',
        description: 'De nieuwe korting is succesvol aangemaakt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het aanmaken van de korting.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutations
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: 'Betaling verwijderd',
        description: 'De betaling is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen van de betaling.',
        variant: 'destructive',
      });
    },
  });

  const deleteTuitionFeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/tuition-fees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tuition-fees'] });
      toast({
        title: 'Collegegeld verwijderd',
        description: 'Het collegegeld is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen van het collegegeld.',
        variant: 'destructive',
      });
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      toast({
        title: 'Korting verwijderd',
        description: 'De korting is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen van de korting.',
        variant: 'destructive',
      });
    },
  });

  const deleteDiscountApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/discount-applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discount-applications'] });
      toast({
        title: 'Kortingtoekenning verwijderd',
        description: 'De kortingtoekenning is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen van de kortingtoekenning.',
        variant: 'destructive',
      });
    },
  });

  // Edit mutations
  const editPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/payments/${editingPayment?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setShowEditPaymentDialog(false);
      setEditingPayment(null);
      toast({
        title: 'Betaling bijgewerkt',
        description: 'De betaling is succesvol bijgewerkt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van de betaling.',
        variant: 'destructive',
      });
    },
  });

  const editTuitionFeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/tuition-fees/${editingTuitionFee?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tuition-fees'] });
      setShowEditTuitionFeeDialog(false);
      setEditingTuitionFee(null);
      toast({
        title: 'Collegegeld bijgewerkt',
        description: 'Het collegegeld is succesvol bijgewerkt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van het collegegeld.',
        variant: 'destructive',
      });
    },
  });

  const editDiscountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/discounts/${editingDiscount?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      setShowEditDiscountDialog(false);
      setEditingDiscount(null);
      toast({
        title: 'Korting bijgewerkt',
        description: 'De korting is succesvol bijgewerkt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van de korting.',
        variant: 'destructive',
      });
    },
  });

  // Delete confirmation handler
  const handleDeleteConfirm = () => {
    if (!deleteItem) return;
    
    switch (deleteItem.type) {
      case 'payment':
        deletePaymentMutation.mutate(deleteItem.id);
        break;
      case 'tuition-fee':
        deleteTuitionFeeMutation.mutate(deleteItem.id);
        break;
      case 'discount':
        deleteDiscountMutation.mutate(deleteItem.id);
        break;
    }
    
    setDeleteItem(null);
    setShowDeleteConfirmDialog(false);
  };

  // Event handlers
  const handleNewPayment = () => {
    setShowAddPaymentDialog(true);
  };

  const handleAddPayment = async (data: z.infer<typeof addPaymentSchema>) => {
    addPaymentMutation.mutate(data);
  };

  const handleAddDiscount = async (data: any) => {
    discountMutation.mutate(data);
  };

  const handleAddTuitionFee = async (data: z.infer<typeof tuitionFeeSchema>) => {
    tuitionFeeMutation.mutate(data);
  };

  const handleCreateDiscount = async (data: z.infer<typeof createDiscountSchema>) => {
    createDiscountMutation.mutate(data);
  };

  // Delete handlers
  const handleDeletePayment = (id: number) => {
    if (window.confirm('Weet je zeker dat je deze betaling wilt verwijderen?')) {
      deletePaymentMutation.mutate(id);
    }
  };

  const handleDeleteTuitionFee = (fee: any) => {
    setDeleteItem({ type: 'tuition-fee', id: fee.id, name: fee.description });
    setShowDeleteConfirmDialog(true);
  };

  const handleDeleteDiscount = (discount: any) => {
    setDeleteItem({ type: 'discount', id: discount.id, name: discount.name });
    setShowDeleteConfirmDialog(true);
  };

  const handleDeleteDiscountApplication = (id: number) => {
    deleteDiscountApplicationMutation.mutate(id);
  };

  // Edit handlers
  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    editPaymentForm.reset({
      studentId: payment.studentId,
      description: payment.description,
      amount: payment.amount,
      dueDate: payment.dueDate.split('T')[0],
      type: payment.type,
      status: payment.status
    });
    setShowEditPaymentDialog(true);
  };

  const handleEditTuitionFee = (fee: any) => {
    setEditingTuitionFee(fee);
    editTuitionFeeForm.reset({
      academicYearId: fee.academicYearId,
      amount: fee.amount,
      description: fee.description,
      isActive: fee.isActive
    });
    setShowEditTuitionFeeDialog(true);
  };

  const handleEditDiscount = (discount: any) => {
    setEditingDiscount(discount);
    editDiscountForm.reset({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      isAutomatic: discount.isAutomatic,
      rule: discount.rule || '',
      isActive: discount.isActive
    });
    setShowEditDiscountDialog(true);
  };

  const handlePayOnline = (payment: any) => {
    window.location.href = `/api/payments/${payment.id}/pay`;
  };

  // Edit form submit handlers
  const onSubmitEditPayment = (data: any) => {
    editPaymentMutation.mutate(data);
  };

  const onSubmitEditTuitionFee = (data: any) => {
    editTuitionFeeMutation.mutate(data);
  };

  const onSubmitEditDiscount = (data: any) => {
    editDiscountMutation.mutate(data);
  };

  const handleDownloadInvoice = (payment: any) => {
    window.open(`/api/payments/${payment.id}/invoice.pdf`, '_blank');
  };

  const handleExportData = () => {
    const params = new URLSearchParams({
      status: statusFilter,
      year: yearFilter,
      class: classFilter,
      search: searchQuery
    });
    window.open(`/api/payments/export?${params}`, '_blank');
  };

  // Utility functions
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'betaald':
        return <Badge className="w-20 justify-center bg-green-100 text-green-800 border-green-200">Betaald</Badge>;
      case 'openstaand':
        return <Badge className="w-20 justify-center bg-orange-100 text-orange-800 border-orange-200">Openstaand</Badge>;
      case 'achterstallig':
        return <Badge className="w-20 justify-center bg-red-100 text-red-800 border-red-200">Achterstallig</Badge>;
      case 'geannuleerd':
        return <Badge className="w-20 justify-center bg-gray-100 text-gray-800 border-gray-200">Geannuleerd</Badge>;
      default:
        return <Badge className="w-20 justify-center bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  // Filter payments
  const filteredPayments = paymentsData.filter((payment: any) => {
    const matchesSearch = !searchQuery || 
      payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.amount?.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'alle' || payment.status === statusFilter;
    const matchesYear = yearFilter === 'alle' || payment.academicYear === yearFilter;
    const matchesClass = classFilter === 'alle' || payment.className === classFilter;
    
    return matchesSearch && matchesStatus && matchesYear && matchesClass;
  });

  // Calculate statistics
  const totalRevenue = paymentsData
    .filter((p: any) => p.status === 'betaald')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

  const pendingCount = paymentsData.filter((p: any) => p.status === 'openstaand').length;

  const outstandingAmount = paymentsData
    .filter((p: any) => p.status === 'openstaand')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = paymentsData
    .filter((p: any) => {
      const paymentDate = new Date(p.createdAt);
      return p.status === 'betaald' && 
        paymentDate.getMonth() === currentMonth && 
        paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

  if (isParent) {
    // Parent view
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Betalingen</h1>
            <p className="text-gray-600">Overzicht van alle betalingen voor uw kinderen</p>
          </div>

          <Tabs defaultValue="current" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Huidige Betalingen</TabsTrigger>
              <TabsTrigger value="history">Betalingsgeschiedenis</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              <Card className="bg-white rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-blue-700">Openstaande Betalingen</CardTitle>
                  <CardDescription>
                    Betalingen die nog voldaan moeten worden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kind</TableHead>
                        <TableHead>Omschrijving</TableHead>
                        <TableHead>Bedrag</TableHead>
                        <TableHead>Vervaldatum</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments
                        .filter((payment: any) => payment.status === 'openstaand')
                        .map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handlePayOnline(payment)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Betalen
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="bg-white rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle>Betalingsgeschiedenis</CardTitle>
                  <CardDescription>
                    Overzicht van alle betalingen en transacties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-4">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Schooljaar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle jaren</SelectItem>
                        {academicYearsData.map((year: any) => (
                          <SelectItem key={year.id} value={year.name}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle statussen</SelectItem>
                        <SelectItem value="betaald">Betaald</SelectItem>
                        <SelectItem value="openstaand">Openstaand</SelectItem>
                        <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>Omschrijving</TableHead>
                        <TableHead>Bedrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.status === 'betaald' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(payment)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Factuur
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Staff/Admin view - Students page styling
  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Betalingsbeheer" 
        description="Beheer betalingen, collegegeld en kortingen"
        icon={Euro}
        breadcrumbs={{
          parent: "Beheer",
          current: "Betalingen"
        }}
      />
      
        <div className="container mx-auto p-4 max-w-7xl">

        {/* Stats Grid - Dashboard Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Totaal Inkomsten kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Euro className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Totaal Inkomsten</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">€{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Openstaande Betalingen kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Clock className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Openstaand</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Openstaand Bedrag kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <AlertCircle className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Te Innen</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">€{outstandingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deze Maand kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Calendar className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Deze Maand</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">€{monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-3">
          <Button onClick={handleNewPayment} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Betaling
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

        {/* Tabs Layout */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Betalingen
            </TabsTrigger>
            <TabsTrigger value="tuition" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Collegegeld
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Kortingen
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Geschiedenis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Zoek op student, omschrijving of bedrag..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-initial w-full md:w-auto flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="betaald">Betaald</SelectItem>
                    <SelectItem value="openstaand">Openstaand</SelectItem>
                    <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Klas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle klassen</SelectItem>
                    {studentGroupsData.map((group: any) => (
                      <SelectItem key={group.id} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Schooljaar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle jaren</SelectItem>
                    {academicYearsData.map((year: any) => (
                      <SelectItem key={year.id} value={year.name}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Student ID</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Bedrag</TableHead>
                    <TableHead>Vervaldatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Betalingen laden...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Geen betalingen gevonden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.studentId}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditPayment(payment)}
                              title="Bewerken"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePayment(payment.id)}
                              title="Verwijderen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {payment.status === 'betaald' && (
                              <Button
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownloadInvoice(payment)}
                                title="Download factuur"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {payment.status === 'openstaand' && (
                              <Button
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                onClick={() => handlePayOnline(payment)}
                                title="Online betalen"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white rounded-md border shadow-sm">
              <CardHeader>
                <CardTitle>Betalingsgeschiedenis</CardTitle>
                <CardDescription>
                  Overzicht van alle betalingen en transacties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Schooljaar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle jaren</SelectItem>
                      {academicYearsData.map((year: any) => (
                        <SelectItem key={year.id} value={year.name}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle statussen</SelectItem>
                      <SelectItem value="betaald">Betaald</SelectItem>
                      <SelectItem value="openstaand">Openstaand</SelectItem>
                      <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Datum</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Omschrijving</TableHead>
                        <TableHead>Bedrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {payment.status === 'betaald' && (
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDownloadInvoice(payment)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tuition" className="space-y-6">
            {/* Tuition Fee Management */}
            <Card className="bg-white rounded-md border shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Collegegeld Beheer</CardTitle>
                    <CardDescription className="text-gray-600">
                      Stel standaard collegegeldbedragen in per schooljaar
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowTuitionFeeDialog(true)} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Collegegeld Instellen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Schooljaar
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Bedrag
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Omschrijving
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-right">
                        Acties
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tuitionFeesData?.map((fee: any) => (
                      <TableRow key={fee.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{fee.academicYear?.name}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm text-gray-900">€{parseFloat(fee.amount).toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm text-gray-900">{fee.description}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={fee.isActive ? "default" : "secondary"} className="w-16 justify-center">
                            {fee.isActive ? 'Actief' : 'Inactief'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditTuitionFee(fee)}
                              title="Bewerken"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTuitionFee(fee.id)}
                              title="Verwijderen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts" className="space-y-6">
            {/* Enhanced Discount Management */}
            <Card className="bg-white rounded-md border shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Kortingen Beheer</CardTitle>
                    <CardDescription className="text-gray-600">
                      Maak nieuwe kortingen aan en beheer bestaande kortingen
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowCreateDiscountDialog(true)} className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Nieuwe Korting Aanmaken
                    </Button>
                    <Button variant="outline" onClick={() => setShowDiscountDialog(true)}>
                      <Tag className="h-4 w-4 mr-2" />
                      Korting Toekennen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Naam
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Waarde
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Automatisch
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-right">
                        Acties
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(discounts as any[])?.map((discount: any) => (
                      <TableRow key={discount.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {discount.type === 'percentage' ? 'Percentage' : 'Vast bedrag'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {discount.type === 'percentage' 
                              ? `${discount.value}%` 
                              : `€${parseFloat(discount.value).toFixed(2)}`
                            }
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={discount.isAutomatic ? "default" : "secondary"} className="w-16 justify-center">
                            {discount.isAutomatic ? 'Ja' : 'Nee'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={discount.isActive ? "default" : "secondary"} className="w-16 justify-center">
                            {discount.isActive ? 'Actief' : 'Inactief'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditDiscount(discount)}
                              title="Bewerken"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDiscount(discount.id)}
                              title="Verwijderen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applied Discounts */}
              <Card className="bg-white rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Automatische Kortingen
                  </CardTitle>
                  <CardDescription>
                    Familiereductie voor families met meerdere kinderen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-800">Familiekorting</h4>
                          <p className="text-sm text-blue-600">10% korting voor families met 2+ kinderen</p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Automatisch
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Show families with automatic discounts */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Actieve Familiekortingen:</h5>
                      {discountApplicationsData
                        .filter((app: any) => app.isAutomatic && app.isActive)
                        .map((app: any) => (
                          <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{app.studentName}</p>
                              <p className="text-sm text-gray-600">Familie: {app.familyName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">-10%</p>
                              <p className="text-sm text-gray-500">Auto toegepast</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Discounts */}
              <Card className="bg-white rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    Handmatige Kortingen
                  </CardTitle>
                  <CardDescription>
                    Specifieke kortingen toegekend door administratie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => setShowDiscountDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Korting Toekennen
                    </Button>
                    
                    <div className="space-y-2">
                      {discountApplicationsData
                        .filter((app: any) => !app.isAutomatic && app.isActive)
                        .map((app: any) => (
                          <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{app.studentName}</p>
                              <p className="text-sm text-gray-600">{app.discountName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600">-{app.discountPercentage}%</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-1 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDiscountApplication(app.id)}
                                title="Verwijderen"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Payment Dialog */}
        <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nieuwe Betaling Toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een nieuwe betaling toe voor een student
              </DialogDescription>
            </DialogHeader>
            <Form {...addPaymentForm}>
              <form onSubmit={addPaymentForm.handleSubmit(handleAddPayment)} className="space-y-4">
                <FormField
                  control={addPaymentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentsData.map((student: any) => (
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
                  control={addPaymentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Omschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Schoolgeld 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addPaymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrag (€)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="450.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addPaymentForm.control}
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
                  control={addPaymentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer betalingstype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="schoolgeld">Schoolgeld</SelectItem>
                          <SelectItem value="materialen">Materialen</SelectItem>
                          <SelectItem value="excursie">Excursie</SelectItem>
                          <SelectItem value="examengeld">Examengeld</SelectItem>
                          <SelectItem value="overig">Overig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={addPaymentMutation.isPending}>
                    {addPaymentMutation.isPending ? 'Toevoegen...' : 'Betaling Toevoegen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Discount Dialog */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Korting Toekennen</DialogTitle>
              <DialogDescription>
                Ken een speciale korting toe aan een student
              </DialogDescription>
            </DialogHeader>
            <Form {...discountForm}>
              <form onSubmit={discountForm.handleSubmit(handleAddDiscount)} className="space-y-4">
                <FormField
                  control={discountForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentsData.map((student: any) => (
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
                  control={discountForm.control}
                  name="discountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kortingstype</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer kortingstype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {discounts
                            .filter((discount: any) => !discount.isAutomatic)
                            .map((discount: any) => (
                              <SelectItem key={discount.id} value={discount.id.toString()}>
                                {discount.name} (-{discount.percentage}%)
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reden (optioneel)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Reden voor korting..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDiscountDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={discountMutation.isPending}>
                    {discountMutation.isPending ? 'Toekennen...' : 'Korting Toekennen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Tuition Fee Dialog */}
        <Dialog open={showTuitionFeeDialog} onOpenChange={setShowTuitionFeeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Collegegeld Instellen</DialogTitle>
              <DialogDescription>
                Stel het standaard collegegeld in voor een schooljaar
              </DialogDescription>
            </DialogHeader>
            <Form {...tuitionFeeForm}>
              <form onSubmit={tuitionFeeForm.handleSubmit(handleAddTuitionFee)} className="space-y-4">
                <FormField
                  control={tuitionFeeForm.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schooljaar</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer schooljaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYearsData.map((year: any) => (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tuitionFeeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="450.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tuitionFeeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Omschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Schoolgeld 2024-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowTuitionFeeDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={tuitionFeeMutation.isPending}>
                    {tuitionFeeMutation.isPending ? 'Opslaan...' : 'Collegegeld Instellen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Discount Dialog */}
        <Dialog open={showCreateDiscountDialog} onOpenChange={setShowCreateDiscountDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nieuwe Korting Aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuwe korting aan die toegepast kan worden
              </DialogDescription>
            </DialogHeader>
            <Form {...createDiscountForm}>
              <form onSubmit={createDiscountForm.handleSubmit(handleCreateDiscount)} className="space-y-4">
                <FormField
                  control={createDiscountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Sociale korting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createDiscountForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type korting" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="amount">Vast bedrag</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createDiscountForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waarde</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={createDiscountForm.watch('type') === 'percentage' ? '25' : '50.00'}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-3">
                  <FormField
                    control={createDiscountForm.control}
                    name="isAutomatic"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="mb-0">Automatische korting</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  {createDiscountForm.watch('isAutomatic') && (
                    <FormField
                      control={createDiscountForm.control}
                      name="rule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regel</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Beschrijf wanneer deze korting automatisch wordt toegepast..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDiscountDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createDiscountMutation.isPending}>
                    {createDiscountMutation.isPending ? 'Aanmaken...' : 'Korting Aanmaken'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Dialog */}
        <Dialog open={showEditPaymentDialog} onOpenChange={setShowEditPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Betaling Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de gegevens van de betaling.
              </DialogDescription>
            </DialogHeader>
            <Form {...editPaymentForm}>
              <form onSubmit={editPaymentForm.handleSubmit(onSubmitEditPayment)} className="space-y-4">
                <FormField
                  control={editPaymentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentsData.map((student: any) => (
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
                  control={editPaymentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Omschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Collegegeld januari 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editPaymentForm.control}
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
                    control={editPaymentForm.control}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editPaymentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="collegegeld">Collegegeld</SelectItem>
                            <SelectItem value="inschrijfgeld">Inschrijfgeld</SelectItem>
                            <SelectItem value="examengeld">Examengeld</SelectItem>
                            <SelectItem value="administratiekosten">Administratiekosten</SelectItem>
                            <SelectItem value="overig">Overig</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editPaymentForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="openstaand">Openstaand</SelectItem>
                            <SelectItem value="betaald">Betaald</SelectItem>
                            <SelectItem value="achterstallig">Achterstallig</SelectItem>
                            <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditPaymentDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={editPaymentMutation.isPending}>
                    {editPaymentMutation.isPending ? 'Bijwerken...' : 'Betaling Bijwerken'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Tuition Fee Dialog */}
        <Dialog open={showEditTuitionFeeDialog} onOpenChange={setShowEditTuitionFeeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Collegegeld Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de gegevens van het collegegeld.
              </DialogDescription>
            </DialogHeader>
            <Form {...editTuitionFeeForm}>
              <form onSubmit={editTuitionFeeForm.handleSubmit(onSubmitEditTuitionFee)} className="space-y-4">
                <FormField
                  control={editTuitionFeeForm.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schooljaar</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer schooljaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYearsData.map((year: any) => (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editTuitionFeeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Omschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Collegegeld per maand" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editTuitionFeeForm.control}
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
                  control={editTuitionFeeForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Status</FormLabel>
                        <FormDescription>
                          Collegegeld actief maken
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditTuitionFeeDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={editTuitionFeeMutation.isPending}>
                    {editTuitionFeeMutation.isPending ? 'Bijwerken...' : 'Collegegeld Bijwerken'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Discount Dialog */}
        <Dialog open={showEditDiscountDialog} onOpenChange={setShowEditDiscountDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Korting Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de gegevens van de korting.
              </DialogDescription>
            </DialogHeader>
            <Form {...editDiscountForm}>
              <form onSubmit={editDiscountForm.handleSubmit(onSubmitEditDiscount)} className="space-y-4">
                <FormField
                  control={editDiscountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: Sociale korting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editDiscountForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="amount">Vast bedrag</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editDiscountForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waarde</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                  control={editDiscountForm.control}
                  name="rule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Automatische regel (optioneel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijvoorbeeld: siblings > 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editDiscountForm.control}
                    name="isAutomatic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Automatisch</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editDiscountForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Actief</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDiscountDialog(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={editDiscountMutation.isPending}>
                    {editDiscountMutation.isPending ? 'Bijwerken...' : 'Korting Bijwerken'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze actie kan niet ongedaan worden gemaakt. Dit zal permanent{' '}
                <strong>{deleteItem?.name}</strong> verwijderen uit het systeem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}