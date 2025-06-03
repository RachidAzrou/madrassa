import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Target,
  Eye,
  Edit3,
  Trash2,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Receipt,
  PieChart,
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { PremiumHeader } from '@/components/layout/premium-header';

// Form schemas
const paymentFormSchema = z.object({
  studentId: z.number().min(1, "Student is verplicht"),
  amount: z.string().min(1, "Bedrag is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
});

export default function Fees() {
  // State management
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  // Echte data queries - alleen authentieke database informatie
  const { data: studentsData = [] } = useQuery({ 
    queryKey: ['/api/students'],
    select: (data: any) => Array.isArray(data) ? data : []
  });
  
  const { data: paymentsData = [] } = useQuery({ 
    queryKey: ['/api/payments'],
    select: (data: any) => Array.isArray(data) ? data : []
  });
  
  const { data: paymentStats = { totalPaid: 0, totalPending: 0, successRate: 0 } } = useQuery({ 
    queryKey: ['/api/payment-stats'],
    select: (data: any) => data || { totalPaid: 0, totalPending: 0, successRate: 0 }
  });

  // Form instance
  const paymentForm = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: 0,
      amount: '',
      description: '',
      dueDate: '',
    },
  });

  // Handler functions
  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
  };

  const handleDeletePayment = (payment: any) => {
    setSelectedPayment(payment);
  };

  // Export handlers
  const handleExportExcel = () => {
    toast({ title: "Export gestart", description: "Het Excel bestand wordt gegenereerd..." });
  };

  const handleExportCSV = () => {
    toast({ title: "Export gestart", description: "Het CSV bestand wordt gegenereerd..." });
  };

  // Filter payments based on search - alleen echte data
  const filteredPayments = paymentsData.filter((payment: any) =>
    payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      'paid': { label: 'Betaald', variant: 'default' as const },
      'pending': { label: 'Wachtend', variant: 'secondary' as const },
      'overdue': { label: 'Achterstallig', variant: 'destructive' as const },
      'cancelled': { label: 'Geannuleerd', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        <PremiumHeader 
          title="Betalingsbeheer" 
          icon={Euro}
          description="Beheer alle betalingen, facturen en tarieven van uw onderwijsinstelling"
        />

        {/* Quick Action Bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowPaymentDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Betaling
            </Button>
            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
              <Receipt className="h-4 w-4 mr-2" />
              Factuur Maken
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Betalingen
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Instellingen
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapporten
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Premium Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Totaal Geïnd</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Euro className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    €{paymentStats.totalPaid?.toFixed(2) || '0.00'}
                  </div>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <p className="text-sm text-green-600 font-medium">
                      Totaal betaalde bedragen
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700">Openstaand</CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-800">
                    €{paymentStats.totalPending?.toFixed(2) || '0.00'}
                  </div>
                  <div className="flex items-center mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-1" />
                    <p className="text-sm text-amber-600 font-medium">
                      {filteredPayments.filter((p: any) => p.status === 'pending').length} openstaande betalingen
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Slagingspercentage</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">
                    {paymentStats.successRate?.toFixed(1) || '0'}%
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mr-1" />
                    <p className="text-sm text-blue-600 font-medium">
                      Succesvol afgeronde betalingen
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Actieve Studenten</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800">{studentsData.length}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                    <p className="text-sm text-purple-600 font-medium">
                      Geregistreerde studenten
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Premium Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Receipt className="h-5 w-5" />
                    Recente Betalingen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {filteredPayments.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-lg border border-slate-200/40 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-800">
                              {payment.studentName || 'Onbekende student'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {payment.description || 'Geen beschrijving'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-800">
                            €{payment.amount?.toFixed(2) || '0.00'}
                          </div>
                          {getPaymentStatusBadge(payment.status || 'unknown')}
                        </div>
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="text-center py-12">
                        <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Receipt className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">Geen betalingsgegevens beschikbaar</p>
                        <p className="text-sm text-slate-400 mt-1">Voeg uw eerste betaling toe om aan de slag te gaan</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <PieChart className="h-5 w-5" />
                    Betalingsstatus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Betaald</span>
                      </div>
                      <span className="text-sm font-bold text-green-800">
                        {filteredPayments.filter((p: any) => p.status === 'paid').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-sm font-medium text-amber-800">Wachtend</span>
                      </div>
                      <span className="text-sm font-bold text-amber-800">
                        {filteredPayments.filter((p: any) => p.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-800">Achterstallig</span>
                      </div>
                      <span className="text-sm font-bold text-red-800">
                        {filteredPayments.filter((p: any) => p.status === 'overdue').length}
                      </span>
                    </div>
                  </div>
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
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Factuur</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vervaldatum</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.studentName || 'Onbekende student'}</TableCell>
                          <TableCell>{payment.invoiceNumber || '-'}</TableCell>
                          <TableCell>€{payment.amount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status || 'unknown')}</TableCell>
                          <TableCell>{payment.dueDate || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewPayment(payment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditPayment(payment)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeletePayment(payment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Geen betalingsgegevens beschikbaar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Collegegeld Tarieven</CardTitle>
                  <CardDescription>
                    Beheer de tarieven voor verschillende programma's
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Geen tarifering instellingen beschikbaar
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Kortingsregelingen</CardTitle>
                  <CardDescription>
                    Beheer kortingen en speciale aanbiedingen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Geen kortingsregelingen beschikbaar
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Betalingsrapporten</h3>
                <p className="text-sm text-muted-foreground">
                  Exporteer betalingsgegevens voor analyse
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV Export
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel Export
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Rapportage functionaliteit wordt binnenkort toegevoegd
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Betaling</DialogTitle>
              <DialogDescription>
                Voeg een nieuwe betaling toe aan het systeem
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
              <form className="space-y-4">
                <FormField
                  control={paymentForm.control}
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
                              {student.firstName} {student.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </form>
            </Form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Annuleren
              </Button>
              <Button onClick={() => setShowPaymentDialog(false)}>
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}