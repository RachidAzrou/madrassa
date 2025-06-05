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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Calendar,
  Users
} from "lucide-react";

const RESOURCES = {
  PAYMENTS: 'payments'
} as const;

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category: string;
  description: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
}

const paymentFormSchema = z.object({
  studentId: z.string().min(1, "Student selecteren is verplicht"),
  amount: z.number().min(0.01, "Bedrag moet groter zijn dan 0"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  category: z.string().min(1, "Categorie is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = useRBAC();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: "",
      amount: 0,
      dueDate: "",
      category: "",
      description: "",
      notes: "",
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Betaling succesvol toegevoegd" });
      setShowDialog(false);
      form.reset();
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
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("PUT", `/api/payments/${selectedPayment?.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Betaling succesvol bijgewerkt" });
      setShowDialog(false);
      form.reset();
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
    mutationFn: async (paymentId: number) => {
      await apiRequest("DELETE", `/api/payments/${paymentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Betaling succesvol verwijderd" });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen betaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || payment.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
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

  const handleEditPayment = (payment: Payment) => {
    setDialogMode('edit');
    setSelectedPayment(payment);
    form.reset({
      studentId: payment.studentId.toString(),
      amount: payment.amount,
      dueDate: payment.dueDate,
      category: payment.category,
      description: payment.description,
      notes: payment.notes || "",
    });
    setShowDialog(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    if (window.confirm(`Weet je zeker dat je deze betaling van ${payment.studentName} wilt verwijderen?`)) {
      deletePaymentMutation.mutate(payment.id);
    }
  };

  const onSubmit = (data: PaymentFormData) => {
    if (dialogMode === 'create') {
      createPaymentMutation.mutate(data);
    } else if (dialogMode === 'edit') {
      updatePaymentMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3 mr-1" /> },
      paid: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      overdue: { className: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3 mr-1" /> },
      cancelled: { className: "bg-gray-100 text-gray-800", icon: <AlertCircle className="w-3 h-3 mr-1" /> }
    };
    
    const labels = {
      pending: "Openstaand",
      paid: "Betaald",
      overdue: "Verlopen",
      cancelled: "Geannuleerd"
    };
    
    const variant = variants[status as keyof typeof variants];
    
    return (
      <Badge className={variant.className}>
        <div className="flex items-center">
          {variant.icon}
          {labels[status as keyof typeof labels]}
        </div>
      </Badge>
    );
  };

  const getCategories = () => {
    const categories = Array.from(new Set(payments.map(p => p.category)));
    return categories.map(cat => ({ value: cat, label: cat }));
  };

  if (paymentsLoading || studentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Betalingsbeheer</h1>
          <p className="text-gray-600 mt-2">Beheer alle betalingen en schoolgelden</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
          <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Importeren
          </Button>
          {canCreate(RESOURCES.PAYMENTS) && (
            <Button 
              onClick={handleCreatePayment}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Betaling
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Betalingen</CardTitle>
              <CreditCard className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPayments}</div>
            <p className="text-xs text-gray-500">Alle betalingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Bedrag</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Alle betalingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Betaald</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidPayments}</div>
            <p className="text-xs text-gray-500">€{paidAmount.toFixed(2)} ontvangen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Verlopen</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overduePayments}</div>
            <p className="text-xs text-gray-500">Betalingen achterstallig</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Betalingspercentage</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500">Succesvol betaald</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
                  placeholder="Zoek op student, beschrijving of categorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="pending">Openstaand</SelectItem>
                <SelectItem value="paid">Betaald</SelectItem>
                <SelectItem value="overdue">Verlopen</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categorie filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {getCategories().map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Betalingen ({filteredPayments.length})</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Beheer alle betalingen en schoolgelden</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead>Status</TableHead>
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
                filteredPayments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.studentName}</div>
                          <div className="text-sm text-gray-500">ID: {payment.studentId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.description}</div>
                        {payment.notes && (
                          <div className="text-sm text-gray-500">{payment.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">€{payment.amount.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {new Date(payment.dueDate).toLocaleDateString('nl-NL')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPayment(payment)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate(RESOURCES.PAYMENTS) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete(RESOURCES.PAYMENTS) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuwe Betaling Toevoegen'}
              {dialogMode === 'edit' && 'Betaling Bewerken'}
              {dialogMode === 'view' && 'Betaling Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedPayment ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Student</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Bedrag</Label>
                  <p className="mt-1 text-sm text-gray-900">€{selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Categorie</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Vervaldatum</Label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedPayment.dueDate).toLocaleDateString('nl-NL')}</p>
                </div>
                {selectedPayment.paidDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Betaaldatum</Label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedPayment.paidDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                )}
                {selectedPayment.paymentMethod && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Betaalmethode</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPayment.paymentMethod}</p>
                  </div>
                )}
                {selectedPayment.transactionId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Transactie ID</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPayment.transactionId}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Beschrijving</Label>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.description}</p>
              </div>

              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notities</Label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                    <p className="text-sm text-gray-900">{selectedPayment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrag (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer categorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Schoolgeld">Schoolgeld</SelectItem>
                            <SelectItem value="Boeken">Boeken</SelectItem>
                            <SelectItem value="Excursie">Excursie</SelectItem>
                            <SelectItem value="Materialen">Materialen</SelectItem>
                            <SelectItem value="Overig">Overig</SelectItem>
                          </SelectContent>
                        </Select>
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
                </div>
                
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {dialogMode === 'create' ? 'Betaling Toevoegen' : 'Wijzigingen Opslaan'}
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