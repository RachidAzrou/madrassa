import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminStatsGrid,
  AdminStatCard,
  AdminActionButton,
  AdminSearchBar,
  AdminTableCard,
  AdminFilterSelect,
  AdminAvatar
} from "@/components/ui/admin-layout";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

// Define RESOURCES locally
const RESOURCES = {
  PAYMENTS: 'payments',
  STUDENTS: 'students'
} as const;

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  description: string;
  paymentDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  category: string;
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
  description: z.string().min(1, "Beschrijving is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  category: z.string().min(1, "Categorie is verplicht"),
  paymentMethod: z.string().optional(),
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
      description: "",
      dueDate: "",
      category: "",
      paymentMethod: "",
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
      const response = await apiRequest("POST", "/api/payments", { body: data });
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
      const response = await apiRequest("PUT", `/api/payments/${selectedPayment?.id}`, { body: data });
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
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      description: payment.description,
      dueDate: payment.dueDate,
      category: payment.category,
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setShowDialog(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    if (window.confirm(`Weet je zeker dat je betaling ${payment.description} wilt verwijderen?`)) {
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
      overdue: { className: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3 mr-1" /> },
      cancelled: { className: "bg-gray-100 text-gray-800", icon: <XCircle className="w-3 h-3 mr-1" /> }
    };
    
    const labels = {
      pending: "In behandeling",
      paid: "Betaald",
      overdue: "Achterstallig",
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

  const getCategoryOptions = () => {
    const categories = [...new Set(payments.map(p => p.category))];
    return categories.map(cat => ({ value: cat, label: cat }));
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  if (paymentsLoading || studentsLoading) {
    return (
      <AdminPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader 
        title="Betalingen" 
        description="Beheer studentenbetalingen en facturatie"
      >
        <AdminActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporteren
        </AdminActionButton>
        <AdminActionButton variant="outline" icon={<Upload className="w-4 h-4" />}>
          Importeren
        </AdminActionButton>
        {canCreate(RESOURCES.PAYMENTS) && (
          <AdminActionButton 
            icon={<CreditCard className="w-4 h-4" />}
            onClick={handleCreatePayment}
          >
            Nieuwe Betaling
          </AdminActionButton>
        )}
      </AdminPageHeader>

      <AdminStatsGrid columns={4}>
        <AdminStatCard
          title="Totaal Bedrag"
          value={`€${totalAmount.toFixed(2)}`}
          subtitle="Alle betalingen"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Betaald"
          value={`€${paidAmount.toFixed(2)}`}
          subtitle="Ontvangen betalingen"
          valueColor="text-green-600"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Uitstaand"
          value={`€${pendingAmount.toFixed(2)}`}
          subtitle="Openstaande betalingen"
          valueColor="text-blue-600"
          icon={<Clock className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Achterstallig"
          value={overdueCount}
          subtitle="Verlopen betalingen"
          valueColor="text-red-600"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </AdminStatsGrid>

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoek op student, beschrijving of transactie ID..."
        filters={
          <>
            <AdminFilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Status filter"
              options={[
                { value: "all", label: "Alle statussen" },
                { value: "pending", label: "In behandeling" },
                { value: "paid", label: "Betaald" },
                { value: "overdue", label: "Achterstallig" },
                { value: "cancelled", label: "Geannuleerd" }
              ]}
            />
            <AdminFilterSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="Categorie filter"
              options={[
                { value: "all", label: "Alle categorieën" },
                ...getCategoryOptions()
              ]}
            />
          </>
        }
      />

      <AdminTableCard 
        title={`Betalingen (${filteredPayments.length})`}
        subtitle="Beheer alle studentenbetalingen"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Beschrijving</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Vervaldatum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Geen betalingen gevonden
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <AdminAvatar initials={payment.studentName.split(' ').map(n => n[0]).join('')} />
                      <div>
                        <div className="font-medium">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">ID: {payment.studentId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.description}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {payment.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-lg font-semibold text-blue-600">
                      €{payment.amount.toFixed(2)}
                    </div>
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
      </AdminTableCard>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <p className="mt-1 text-sm text-gray-900 font-mono">€{selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Beschrijving</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.description}</p>
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
              </div>
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
                                {student.firstName} {student.lastName} (ID: {student.studentId})
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
                            <SelectItem value="Collegegeld">Collegegeld</SelectItem>
                            <SelectItem value="Examengeld">Examengeld</SelectItem>
                            <SelectItem value="Boeken">Boeken</SelectItem>
                            <SelectItem value="Activiteiten">Activiteiten</SelectItem>
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
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betaalmethode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer betaalmethode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bankoverschrijving">Bankoverschrijving</SelectItem>
                            <SelectItem value="iDEAL">iDEAL</SelectItem>
                            <SelectItem value="Contant">Contant</SelectItem>
                            <SelectItem value="Creditcard">Creditcard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
    </AdminPageLayout>
  );
}