import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Download, Filter, Eye, Edit, Trash2,
  Euro, Clock, AlertCircle, Calendar, CreditCard,
  Users, User, Gift, Shield, Activity, Receipt,
  Tag, Settings, History, GraduationCap, Pencil, Percent,
  FileText
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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog-content';
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
  ruleCondition: z.string().optional(),
  ruleOperator: z.string().optional(),
  ruleValue: z.string().optional(),
  ruleDescription: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function Payments() {
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
  const [showPaymentDetailDialog, setShowPaymentDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  // Check if user is parent
  const isParent = user?.role === 'ouder' as any;

  // Data fetching
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['/api/payments'],
    staleTime: 60000,
  });

  const { data: studentsData = [], isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: academicYearsData = [], isLoading: academicYearsLoading } = useQuery<any[]>({
    queryKey: ['/api/academic-years'],
    staleTime: 60000,
  });

  const { data: discountsData = [], isLoading: discountsLoading } = useQuery<any[]>({
    queryKey: ['/api/discounts'],
    staleTime: 60000,
  });

  const { data: tuitionFeesData = [], isLoading: tuitionFeesLoading } = useQuery<any[]>({
    queryKey: ['/api/tuition-fees'],
    staleTime: 60000,
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
      type: 'percentage',
      value: 0,
      isAutomatic: false,
      rule: '',
      ruleCondition: '',
      ruleOperator: '',
      ruleValue: '',
      ruleDescription: '',
      isActive: true,
    },
  });

  // Mutations
  const addPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addPaymentSchema>) => {
      const response = await apiRequest('POST', '/api/payments', { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({ title: "Betaling succesvol toegevoegd" });
      setShowAddPaymentDialog(false);
      addPaymentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen betaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/payments/${id}`, { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({ title: "Betaling succesvol bijgewerkt" });
      setShowEditPaymentDialog(false);
      setEditingPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken betaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/payments/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({ title: "Betaling succesvol verwijderd" });
      setShowDeleteConfirmDialog(false);
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen betaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Betaald', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Openstaand', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Achterstallig', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Geannuleerd', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      tuition: { label: 'Schoolgeld', className: 'bg-blue-100 text-blue-800' },
      materials: { label: 'Materialen', className: 'bg-purple-100 text-purple-800' },
      excursion: { label: 'Excursie', className: 'bg-orange-100 text-orange-800' },
      other: { label: 'Overig', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Filter payments
  const filteredPayments = paymentsData.filter((payment: any) => {
    const matchesSearch = searchQuery === '' || 
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'alle' || payment.status === statusFilter;
    const matchesYear = yearFilter === 'alle' || payment.academicYearId?.toString() === yearFilter;
    const matchesClass = classFilter === 'alle' || payment.classId?.toString() === classFilter;
    
    return matchesSearch && matchesStatus && matchesYear && matchesClass;
  });

  // Calculate statistics
  const totalAmount = paymentsData.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
  const paidAmount = paymentsData
    .filter((payment: any) => payment.status === 'paid')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
  const pendingAmount = paymentsData
    .filter((payment: any) => payment.status === 'pending')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
  const overdueAmount = paymentsData
    .filter((payment: any) => payment.status === 'overdue')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);

  const handleAddPayment = (data: z.infer<typeof addPaymentSchema>) => {
    addPaymentMutation.mutate(data);
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setShowEditPaymentDialog(true);
  };

  const handleUpdatePayment = (data: any) => {
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data });
    }
  };

  const handleDeletePayment = (payment: any) => {
    setDeleteItem({
      type: 'payment',
      id: payment.id,
      name: payment.description
    });
    setShowDeleteConfirmDialog(true);
  };

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentDetailDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteItem?.type === 'payment') {
      deletePaymentMutation.mutate(deleteItem.id);
    }
  };

  // Export functionality
  const handleExport = () => {
    const headers = ['Student', 'Beschrijving', 'Bedrag', 'Type', 'Status', 'Vervaldatum'];
    const csvData = filteredPayments.map((payment: any) => [
      payment.studentName,
      payment.description,
      `€${parseFloat(payment.amount).toFixed(2)}`,
      payment.type,
      payment.status,
      new Date(payment.dueDate).toLocaleDateString('nl-NL')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `betalingen_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export voltooid",
      description: "Betalingen zijn geëxporteerd naar CSV bestand.",
    });
  };

  if (paymentsLoading || studentsLoading || academicYearsLoading) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={<CreditCard className="h-5 w-5 text-white" />}
          title="Betalingsbeheer"
          subtitle="Beheer alle betalingen en schoolgelden"
          parentLabel="Secretariaat"
          currentLabel="Betalingen"
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header */}
      <PremiumHeader
        icon={<CreditCard className="h-5 w-5 text-white" />}
        title="Betalingsbeheer"
        subtitle="Beheer alle betalingen en schoolgelden"
        parentLabel="Secretariaat"
        currentLabel="Betalingen"
      />

      {/* Main Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Bedrag</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Alle betalingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Betaald</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{paidAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Ontvangen betalingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uitstaand</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">€{pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Openstaande betalingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achterstallig</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">€{overdueAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Verlopen betalingen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Search and Filters */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Zoek betalingen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
                <Button
                  onClick={() => setShowAddPaymentDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Betaling
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="paid">Betaald</SelectItem>
                    <SelectItem value="pending">Openstaand</SelectItem>
                    <SelectItem value="overdue">Achterstallig</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Academisch Jaar</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle jaren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle jaren</SelectItem>
                    {academicYearsData.map((year: any) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Klas</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle klassen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle klassen</SelectItem>
                    {/* Add class options here based on available data */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments">Betalingen</TabsTrigger>
            <TabsTrigger value="tuition">Schoolgeld</TabsTrigger>
            <TabsTrigger value="discounts">Kortingen</TabsTrigger>
            <TabsTrigger value="reports">Rapporten</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Betalingen ({filteredPayments.length})</CardTitle>
                    <CardDescription>
                      Overzicht van alle betalingen en hun status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Beschrijving</TableHead>
                        <TableHead>Bedrag</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vervaldatum</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            Geen betalingen gevonden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment: any) => (
                          <TableRow 
                            key={payment.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onMouseEnter={() => setHoveredRowId(payment.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                            onClick={() => handleViewPayment(payment)}
                          >
                            <TableCell>
                              <div className="font-medium">{payment.studentName}</div>
                              <div className="text-sm text-gray-500">{payment.studentId}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{payment.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">€{parseFloat(payment.amount).toFixed(2)}</div>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(payment.type)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {new Date(payment.dueDate).toLocaleDateString('nl-NL')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPayment(payment);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPayment(payment);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePayment(payment);
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="tuition">
            <Card>
              <CardHeader>
                <CardTitle>Schoolgeld Beheer</CardTitle>
                <CardDescription>
                  Beheer schoolgeld tarieven per academisch jaar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Schoolgeld functionaliteit komt binnenkort beschikbaar.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts">
            <Card>
              <CardHeader>
                <CardTitle>Kortingen</CardTitle>
                <CardDescription>
                  Beheer kortingsregelingen en -toekenningen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Kortingen functionaliteit komt binnenkort beschikbaar.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Betalingsrapporten</CardTitle>
                <CardDescription>
                  Genereer rapporten en analyses over betalingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Rapporten functionaliteit komt binnenkort beschikbaar.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe Betaling Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe betaling toe voor een student
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addPaymentForm}>
            <form onSubmit={addPaymentForm.handleSubmit(handleAddPayment)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addPaymentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer student" />
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
                          <SelectItem value="tuition">Schoolgeld</SelectItem>
                          <SelectItem value="materials">Materialen</SelectItem>
                          <SelectItem value="excursion">Excursie</SelectItem>
                          <SelectItem value="other">Overig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addPaymentForm.control}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Beschrijf de betaling..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={addPaymentMutation.isPending}>
                  {addPaymentMutation.isPending ? 'Bezig...' : 'Betaling Toevoegen'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={showPaymentDetailDialog} onOpenChange={setShowPaymentDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Betaling Details</DialogTitle>
            <DialogDescription>
              {selectedPayment && `Details van betaling voor ${selectedPayment.studentName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Student</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Bedrag</Label>
                  <p className="text-sm text-gray-900 mt-1">€{parseFloat(selectedPayment.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedPayment.type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Vervaldatum</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedPayment.dueDate).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                {selectedPayment.paidDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Betaaldatum</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedPayment.paidDate).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Beschrijving</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedPayment.description}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDetailDialog(false)}>
              Sluiten
            </Button>
            {selectedPayment && (
              <Button onClick={() => {
                setShowPaymentDetailDialog(false);
                handleEditPayment(selectedPayment);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
        onConfirm={handleConfirmDelete}
        title={`${deleteItem?.type === 'payment' ? 'Betaling' : 'Item'} Verwijderen`}
        description={
          deleteItem 
            ? `Weet je zeker dat je "${deleteItem.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
            : ""
        }
      />
    </div>
  );
}