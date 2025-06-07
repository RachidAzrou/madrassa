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
  FileText, PlusCircle
} from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EmptyState from '@/components/ui/empty-state';

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

// Types
interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  type: string;
  paymentDate?: string;
  createdAt: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
}

interface DiscountType {
  id: number;
  name: string;
  percentage: number;
  description: string;
}

// Admin-style components
const DataTableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden">
    {children}
  </div>
);

const SearchActionBar = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
    {children}
  </div>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    {children}
  </div>
);

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function Payments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Data fetching
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payments'],
    staleTime: 60000,
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: discountTypes = [] } = useQuery<DiscountType[]>({
    queryKey: ['/api/discount-types'],
    staleTime: 60000,
  });

  // Forms
  const addPaymentForm = useForm({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      studentId: 0,
      description: '',
      amount: '',
      dueDate: '',
      type: '',
    },
  });

  const discountForm = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      studentId: 0,
      discountId: 0,
      reason: '',
    },
  });

  // Filter payments
  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = searchTerm === '' || 
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/payments', paymentData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setIsCreateDialogOpen(false);
      addPaymentForm.reset();
      toast({
        title: "Betaling toegevoegd",
        description: "De nieuwe betaling is succesvol toegevoegd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de betaling.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/payments/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setIsEditDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: "Betaling bijgewerkt",
        description: "De betaling is succesvol bijgewerkt.",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/payments/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: "Betaling verwijderd",
        description: "De betaling is succesvol verwijderd.",
      });
    },
  });

  // Handlers
  const handleCreatePayment = async (data: any) => {
    createPaymentMutation.mutate({
      ...data,
      amount: parseFloat(data.amount),
    });
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePayment = () => {
    if (selectedPayment) {
      deletePaymentMutation.mutate(selectedPayment.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'In behandeling', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Betaald', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'Achterstallig', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Geannuleerd', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Statistics
  const totalAmount = filteredPayments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
  const paidAmount = filteredPayments
    .filter((payment: Payment) => payment.status === 'paid')
    .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter((payment: Payment) => payment.status === 'pending')
    .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
  const overdueAmount = filteredPayments
    .filter((payment: Payment) => payment.status === 'overdue')
    .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Betalingen" 
        description="Beheer schoolgeld, boeten en overige betalingen van studenten"
        icon={Euro}
        breadcrumbs={{
          parent: "Secretariaat",
          current: "Betalingen"
        }}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Euro className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Totaal bedrag</p>
                <p className="text-2xl font-bold text-gray-900">€{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Betaald</p>
                <p className="text-2xl font-bold text-gray-900">€{paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Openstaand</p>
                <p className="text-2xl font-bold text-gray-900">€{pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Achterstallig</p>
                <p className="text-2xl font-bold text-gray-900">€{overdueAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DataTableContainer>
        <SearchActionBar>
          {/* Zoekbalk */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek betalingen..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Acties */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDiscountDialogOpen(true)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Korting toepassen"
            >
              <Percent className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Exporteer betalingen"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white ml-auto"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Nieuwe Betaling
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter opties */}
        {showFilterOptions && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle statussen</SelectItem>
                <SelectItem value="pending" className="text-xs focus:bg-blue-200 hover:bg-blue-100">In behandeling</SelectItem>
                <SelectItem value="paid" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Betaald</SelectItem>
                <SelectItem value="overdue" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Achterstallig</SelectItem>
                <SelectItem value="cancelled" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle types</SelectItem>
                <SelectItem value="tuition" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Schoolgeld</SelectItem>
                <SelectItem value="fine" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Boete</SelectItem>
                <SelectItem value="materials" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Materialen</SelectItem>
                <SelectItem value="activity" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Activiteit</SelectItem>
                <SelectItem value="other" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Overig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabel */}
        <TableContainer>
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Student</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Beschrijving</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Type</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Bedrag</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Vervaldatum</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Status</TableHead>
                <TableHead className="w-20 px-4 py-3 text-xs font-medium text-gray-700 text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-gray-600">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <EmptyState
                      icon={<Euro className="h-10 w-10 opacity-30" />}
                      title="Geen betalingen gevonden"
                      description="Er zijn geen betalingen die voldoen aan de huidige criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment: Payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-900">{payment.studentName}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {payment.description}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {payment.type === 'tuition' && 'Schoolgeld'}
                        {payment.type === 'fine' && 'Boete'}
                        {payment.type === 'materials' && 'Materialen'}
                        {payment.type === 'activity' && 'Activiteit'}
                        {payment.type === 'other' && 'Overig'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-medium">
                      €{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {new Date(payment.dueDate).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <QuickActions
                        onView={() => handleViewPayment(payment)}
                        onEdit={() => handleEditPayment(payment)}
                        onDelete={() => handleDeletePayment(payment)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-blue-600" />
              Nieuwe Betaling Toevoegen
            </DialogTitle>
            <DialogDescription>
              Voeg een nieuwe betaling toe voor een student
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addPaymentForm}>
            <form onSubmit={addPaymentForm.handleSubmit(handleCreatePayment)} className="space-y-4">
              <FormField
                control={addPaymentForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student: Student) => (
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
                    <FormLabel>Beschrijving *</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijvoorbeeld: Schoolgeld januari 2025" {...field} />
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
                      <FormLabel>Bedrag *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addPaymentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tuition">Schoolgeld</SelectItem>
                          <SelectItem value="fine">Boete</SelectItem>
                          <SelectItem value="materials">Materialen</SelectItem>
                          <SelectItem value="activity">Activiteit</SelectItem>
                          <SelectItem value="other">Overig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addPaymentForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vervaldatum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending ? 'Toevoegen...' : 'Betaling toevoegen'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Betaling verwijderen
            </DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze betaling wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePayment}
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}