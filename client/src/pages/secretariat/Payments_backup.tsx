import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import {
  CreditCard,
  Euro,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Mail,
  Phone
} from "lucide-react";

const RESOURCES = {
  PAYMENTS: 'payments',
  STUDENTS: 'students'
} as const;

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  amount: number;
  description: string;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  feeType: 'tuition' | 'registration' | 'exam' | 'materials' | 'trip' | 'other';
  academicYear: string;
  createdAt: string;
}

interface PaymentStats {
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  averagePaymentTime: number;
  paymentSuccessRate: number;
}

const paymentFormSchema = z.object({
  studentId: z.number().min(1, "Student selecteren is verplicht"),
  amount: z.number().min(0.01, "Bedrag moet groter zijn dan 0"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  feeType: z.enum(['tuition', 'registration', 'exam', 'materials', 'trip', 'other']),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const { canCreate, canUpdate, canRead } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');

  if (!canRead(RESOURCES.PAYMENTS)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Je hebt geen toegang tot deze pagina.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: paymentsData, isLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ['/api/payments'],
    retry: false,
  });

  const { data: statsData } = useQuery<{ stats: PaymentStats }>({
    queryKey: ['/api/payments/stats'],
    retry: false,
  });

  const { data: studentsData } = useQuery<{ students: Array<{id: number, firstName: string, lastName: string, studentId: string}> }>({
    queryKey: ['/api/students/basic'],
    retry: false,
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: 0,
      amount: 0,
      description: "",
      dueDate: "",
      feeType: 'tuition',
      notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      return apiRequest('POST', '/api/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/stats'] });
      toast({ title: "Betaling aangemaakt", description: "De betaling is succesvol aangemaakt." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van de betaling.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/payments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/stats'] });
      toast({ title: "Status bijgewerkt", description: "De betalingsstatus is succesvol bijgewerkt." });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de status.",
        variant: "destructive",
      });
    },
  });

  const payments = paymentsData?.payments || [];
  const stats = statsData?.stats || {
    totalOutstanding: 0,
    totalPaid: 0,
    totalOverdue: 0,
    averagePaymentTime: 0,
    paymentSuccessRate: 0
  };
  const students = studentsData?.students || [];

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = searchTerm === "" || 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesFeeType = feeTypeFilter === "all" || payment.feeType === feeTypeFilter;
    
    return matchesSearch && matchesStatus && matchesFeeType;
  });

  const handleCreatePayment = () => {
    setDialogMode('create');
    setSelectedPayment(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setDialogMode('view');
    setSelectedPayment(payment);
    setShowDialog(true);
  };

  const handleMarkAsPaid = (payment: Payment) => {
    if (window.confirm(`Markeer betaling van €${payment.amount.toFixed(2)} als betaald?`)) {
      updatePaymentStatusMutation.mutate({ id: payment.id, status: 'paid' });
    }
  };

  const onSubmit = (data: PaymentFormData) => {
    if (dialogMode === 'create') {
      createPaymentMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />In behandeling</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Betaald</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Achterstallig</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Geannuleerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFeeTypeBadge = (feeType: string) => {
    const typeMap = {
      'tuition': { label: 'Schoolgeld', color: 'bg-blue-100 text-blue-800' },
      'registration': { label: 'Inschrijving', color: 'bg-purple-100 text-purple-800' },
      'exam': { label: 'Examens', color: 'bg-green-100 text-green-800' },
      'materials': { label: 'Materialen', color: 'bg-orange-100 text-orange-800' },
      'trip': { label: 'Uitstapjes', color: 'bg-pink-100 text-pink-800' },
      'other': { label: 'Overig', color: 'bg-gray-100 text-gray-800' }
    };
    
    const type = typeMap[feeType as keyof typeof typeMap] || typeMap.other;
    return <Badge variant="secondary" className={type.color}>{type.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Betalingen</h1>
          <p className="text-gray-600 mt-2">
            Beheer schoolgeld en overige betalingen
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
          {canCreate(RESOURCES.PAYMENTS) && (
            <Button onClick={handleCreatePayment} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Betaling
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Openstaand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">€{stats.totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Te ontvangen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Betaald</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{stats.totalPaid.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Ontvangen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Achterstallig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{stats.totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Te laat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Slagingspercentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.paymentSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Betaald op tijd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gem. Betaaltijd</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averagePaymentTime}</div>
            <p className="text-xs text-gray-500">Dagen</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Zoek op student, beschrijving of transactie ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="overdue">Achterstallig</SelectItem>
                  <SelectItem value="cancelled">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="tuition">Schoolgeld</SelectItem>
                  <SelectItem value="registration">Inschrijving</SelectItem>
                  <SelectItem value="exam">Examens</SelectItem>
                  <SelectItem value="materials">Materialen</SelectItem>
                  <SelectItem value="trip">Uitstapjes</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Betalingen ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Beschrijving</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
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
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-violet-700">
                              {payment.studentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{payment.studentName}</div>
                            <div className="text-sm text-gray-500">{payment.studentEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.description}</div>
                          <div className="text-sm text-gray-500">{payment.academicYear}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Euro className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="font-medium">€{payment.amount.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={new Date(payment.dueDate) < new Date() && payment.status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                            {new Date(payment.dueDate).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{getFeeTypeBadge(payment.feeType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canUpdate(RESOURCES.PAYMENTS) && payment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(payment)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
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
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuwe Betaling Aanmaken'}
              {dialogMode === 'view' && 'Betaling Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedPayment ? (
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Betaling Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Euro className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Bedrag:</span>
                      <span className="text-lg font-bold">€{selectedPayment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Beschrijving:</span>
                      <span>{selectedPayment.description}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Type:</span>
                      {getFeeTypeBadge(selectedPayment.feeType)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Schooljaar:</span>
                      <span>{selectedPayment.academicYear}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Student Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Naam:</span>
                      <span>{selectedPayment.studentName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedPayment.studentEmail}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datum Informatie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Aangemaakt:</span>
                    <span>{new Date(selectedPayment.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Vervaldatum:</span>
                    <span className={new Date(selectedPayment.dueDate) < new Date() && selectedPayment.status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                      {new Date(selectedPayment.dueDate).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  {selectedPayment.paymentDate && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="font-medium">Betaaldatum:</span>
                      <span>{new Date(selectedPayment.paymentDate).toLocaleDateString('nl-NL')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method and Transaction */}
              {(selectedPayment.paymentMethod || selectedPayment.transactionId) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transactie Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedPayment.paymentMethod && (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Betaalmethode:</span>
                        <span>{selectedPayment.paymentMethod}</span>
                      </div>
                    )}
                    {selectedPayment.transactionId && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Transactie ID:</span>
                        <span className="font-mono text-sm">{selectedPayment.transactionId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPayment.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
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
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrag (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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

                  <FormField
                    control={form.control}
                    name="feeType"
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
                            <SelectItem value="tuition">Schoolgeld</SelectItem>
                            <SelectItem value="registration">Inschrijving</SelectItem>
                            <SelectItem value="exam">Examens</SelectItem>
                            <SelectItem value="materials">Materialen</SelectItem>
                            <SelectItem value="trip">Uitstapjes</SelectItem>
                            <SelectItem value="other">Overig</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <textarea 
                          {...field}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={3}
                          placeholder="Aanvullende informatie over de betaling..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={createPaymentMutation.isPending}
                  >
                    Betaling Aanmaken
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}