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

  // Check if user is parent
  const isParent = user?.role === 'ouder';

  // Data fetching
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  const { data: studentsData = [] } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: studentGroupsData = [] } = useQuery({
    queryKey: ['/api/student-groups'],
  });

  const { data: academicYearsData = [] } = useQuery({
    queryKey: ['/api/academic-years'],
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ['/api/discounts'],
  });

  const { data: discountApplicationsData = [] } = useQuery({
    queryKey: ['/api/discount-applications'],
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
      isActive: true,
    },
  });

  // Mutations
  const addPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addPaymentSchema>) => {
      const response = await apiRequest('POST', '/api/payments', data);
      return response.json();
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
    mutationFn: async (data: z.infer<typeof discountSchema>) => {
      const response = await apiRequest('POST', '/api/discount-applications', data);
      return response.json();
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

  // Event handlers
  const handleNewPayment = () => {
    setShowAddPaymentDialog(true);
  };

  const handleAddPayment = async (data: z.infer<typeof addPaymentSchema>) => {
    addPaymentMutation.mutate(data);
  };

  const handleAddDiscount = async (data: z.infer<typeof discountSchema>) => {
    discountMutation.mutate(data);
  };

  const handlePayOnline = (payment: any) => {
    window.location.href = `/api/payments/${payment.id}/pay`;
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

  // Staff/Admin view - Dashboard UI styling
  return (
    <div className="p-6">
      {/* Header - Dashboard Style */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Betalingsbeheer
        </h1>
        <p className="text-gray-600 mt-2">
          Overzicht van alle betalingen, kortingen en financiële rapportages
        </p>
      </div>

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
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Betalingen</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
            <TabsTrigger value="discounts">Kortingen</TabsTrigger>
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
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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

          <TabsContent value="discounts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automatic Discounts */}
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
                              <Button size="sm" variant="outline" className="mt-1">
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
    </div>
  );
}