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
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Receipt,
  Filter,
  FileText,
  Mail,
  DollarSign,
  Percent,
  Gift,
  Shield,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDialogContent } from '@/components/ui/custom-dialog-content';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form schemas
const paymentSchema = z.object({
  studentId: z.number().min(1, "Student is verplicht"),
  description: z.string().min(1, "Omschrijving is verplicht"),
  amount: z.string().min(1, "Bedrag is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  type: z.string().min(1, "Type is verplicht"),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  notes: z.string().optional(),
});

const markPaidSchema = z.object({
  paymentMethod: z.string().min(1, "Betaalmethode is verplicht"),
  notes: z.string().optional(),
});

const discountSchema = z.object({
  discountType: z.string().min(1, "Kortingstype is verplicht"),
  discountPercentage: z.string().min(1, "Kortingspercentage is verplicht"),
  description: z.string().min(1, "Omschrijving is verplicht"),
  academicYear: z.string().min(1, "Academisch jaar is verplicht"),
  proofDocument: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export default function Fees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Rolgebaseerde toegang - alleen admin, secretariat en guardian
  const allowedRoles = ['admin', 'secretariat', 'guardian'];
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Toegang Geweigerd</h2>
            <p className="text-muted-foreground">
              U heeft geen toegang tot deze pagina. Alleen ouders, secretariaat en beheerders kunnen betalingen bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [yearFilter, setYearFilter] = useState('alle');
  const [classFilter, setClassFilter] = useState('alle');
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('current');
  
  // Bepaal weergave gebaseerd op rol
  const isParent = user.role === 'guardian';
  const isStaffOrAdmin = user.role === 'admin' || user.role === 'secretariat';

  // Data queries gebaseerd op rol
  const { data: paymentsData = [] } = useQuery({ 
    queryKey: isParent ? ['/api/payments/my-children'] : ['/api/payments'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: studentsData = [] } = useQuery({ 
    queryKey: ['/api/students'],
    select: (data: any) => Array.isArray(data) ? data : [],
    enabled: isStaffOrAdmin
  });

  const { data: classesData = [] } = useQuery({ 
    queryKey: ['/api/student-groups'],
    select: (data: any) => Array.isArray(data) ? data : [],
    enabled: isStaffOrAdmin
  });

  const { data: academicYearsData = [] } = useQuery({ 
    queryKey: ['/api/academic-years'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: paymentHistoryData = [] } = useQuery({ 
    queryKey: ['/api/payments/history'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Discount queries
  const { data: discountsData = [] } = useQuery({ 
    queryKey: ['/api/discounts'],
    select: (data: any) => Array.isArray(data) ? data : [],
    enabled: isStaffOrAdmin
  });

  const { data: discountApplicationsData = [] } = useQuery({ 
    queryKey: ['/api/discount-applications'],
    select: (data: any) => Array.isArray(data) ? data : [],
    enabled: isStaffOrAdmin
  });

  // Forms
  const addPaymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: 0,
      description: '',
      amount: '',
      dueDate: '',
      type: '',
      academicYear: '',
      semester: '',
      notes: '',
    }
  });

  const markPaidForm = useForm({
    resolver: zodResolver(markPaidSchema),
    defaultValues: {
      paymentMethod: '',
      notes: '',
    }
  });

  // Mutations
  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/payments', data),
    onSuccess: () => {
      toast({ title: "Betaling toegevoegd", description: "De betaling is succesvol toegevoegd." });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setShowAddPaymentDialog(false);
      addPaymentForm.reset();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden bij het toevoegen van de betaling.", variant: "destructive" });
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest('PATCH', `/api/payments/${id}/mark-paid`, data),
    onSuccess: () => {
      toast({ title: "Betaling gemarkeerd", description: "De betaling is gemarkeerd als betaald." });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setShowMarkPaidDialog(false);
      markPaidForm.reset();
      setSelectedPayment(null);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden bij het markeren van de betaling.", variant: "destructive" });
    }
  });

  // Handlers
  const handleAddPayment = (data: any) => {
    addPaymentMutation.mutate({
      ...data,
      studentId: Number(data.studentId),
      amount: data.amount.toString(),
    });
  };

  const handleMarkPaid = (data: any) => {
    if (selectedPayment) {
      markPaidMutation.mutate({
        id: selectedPayment.id,
        data
      });
    }
  };

  const handlePayOnline = (payment: any) => {
    // Redirect to Mollie payment
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

  // Filter payments
  const filteredPayments = paymentsData.filter((payment: any) => {
    const matchesSearch = !searchQuery || 
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.guardianEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'alle' || payment.status === statusFilter;
    const matchesYear = yearFilter === 'alle' || payment.academicYear === yearFilter;
    const matchesClass = classFilter === 'alle' || payment.className === classFilter;
    
    return matchesSearch && matchesStatus && matchesYear && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'openstaand':
        return <Badge variant="destructive">Openstaand</Badge>;
      case 'betaald':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Betaald</Badge>;
      case 'verwerking':
        return <Badge variant="secondary">In verwerking</Badge>;
      case 'mislukt':
        return <Badge variant="destructive">Mislukt</Badge>;
      case 'geannuleerd':
        return <Badge variant="outline">Geannuleerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

  if (isParent) {
    // Ouderweergave: "Mijn Betalingen"
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mijn Betalingen</h1>
            <p className="text-muted-foreground">
              Overzicht van alle betalingen voor uw kinderen
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Huidige Betalingen</TabsTrigger>
            <TabsTrigger value="history">Betalingsgeschiedenis</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <Card>
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handlePayOnline(payment)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Betalen
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Recente Betalingen</CardTitle>
                <CardDescription>
                  Onlangs voltooide betalingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Betaald op</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments
                      .filter((payment: any) => payment.status === 'betaald')
                      .slice(0, 5)
                      .map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.studentName}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatDate(payment.paidAt || payment.updatedAt)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(payment)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Factuur
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Betalingsgeschiedenis</CardTitle>
                <CardDescription>
                  Volledige geschiedenis van alle betalingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
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
    );
  }

  // Staff/Admin weergave: "Betalingsbeheer"
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Betalingsbeheer</h1>
          <p className="text-muted-foreground">
            Beheer alle betalingen van studenten en ouders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
          <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Betaling Toevoegen
              </Button>
            </DialogTrigger>
            <CustomDialogContent>
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
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="schoolgeld">Schoolgeld</SelectItem>
                            <SelectItem value="boekenpakket">Boekenpakket</SelectItem>
                            <SelectItem value="uitstap">Klasuitstap</SelectItem>
                            <SelectItem value="examen">Examenkosten</SelectItem>
                            <SelectItem value="overig">Overig</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addPaymentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opmerkingen (optioneel)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Aanvullende informatie..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddPaymentDialog(false)}
                    >
                      Annuleren
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addPaymentMutation.isPending}
                    >
                      {addPaymentMutation.isPending ? "Toevoegen..." : "Betaling Toevoegen"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CustomDialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Huidige Betalingen</TabsTrigger>
          <TabsTrigger value="history">Betalingsgeschiedenis</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Betalingsoverzicht</CardTitle>
              <CardDescription>
                Beheer alle openstaande en recente betalingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Zoek op student, ouder of omschrijving..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="openstaand">Openstaand</SelectItem>
                    <SelectItem value="betaald">Betaald</SelectItem>
                    <SelectItem value="verwerking">In verwerking</SelectItem>
                    <SelectItem value="mislukt">Mislukt</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Klas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle klassen</SelectItem>
                    {classesData.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Ouder</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Bedrag</TableHead>
                    <TableHead>Vervaldatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.guardianEmail}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === 'openstaand' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowMarkPaidDialog(true);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Markeren als betaald
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(payment)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Factuur
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Betalingsgeschiedenis</CardTitle>
              <CardDescription>
                Volledige geschiedenis met filteropties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Zoek in geschiedenis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
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
                
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Klas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle klassen</SelectItem>
                    {classesData.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Ouder</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistoryData.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.guardianEmail}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(payment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Factuur
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark as Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <CustomDialogContent>
          <DialogHeader>
            <DialogTitle>Betaling Markeren als Betaald</DialogTitle>
            <DialogDescription>
              Markeer deze betaling als handmatig betaald (bijvoorbeeld contant geld)
            </DialogDescription>
          </DialogHeader>
          <Form {...markPaidForm}>
            <form onSubmit={markPaidForm.handleSubmit(handleMarkPaid)} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Student:</strong> {selectedPayment?.studentName}</p>
                <p><strong>Omschrijving:</strong> {selectedPayment?.description}</p>
                <p><strong>Bedrag:</strong> {selectedPayment ? formatCurrency(selectedPayment.amount) : ''}</p>
              </div>
              
              <FormField
                control={markPaidForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Betaalmethode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer betaalmethode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Contant geld</SelectItem>
                        <SelectItem value="bank_transfer">Bankoverschrijving</SelectItem>
                        <SelectItem value="pin">PIN/Debit</SelectItem>
                        <SelectItem value="other">Overig</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={markPaidForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opmerkingen (optioneel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Aanvullende informatie over de betaling..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowMarkPaidDialog(false)}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  disabled={markPaidMutation.isPending}
                >
                  {markPaidMutation.isPending ? "Markeren..." : "Markeren als Betaald"}
                </Button>
              </div>
            </form>
          </Form>
        </CustomDialogContent>
      </Dialog>
    </div>
  );
}