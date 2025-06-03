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
import { PageHeader } from '@/components/layout/page-header';
import { ExportButton } from '@/components/ui/export-button';
import { ExportDialog } from '@/components/ui/export-dialog';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
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
  const handleExport = (format: string) => {
    // Implementeer export functionaliteit
    console.log(`Exporteren naar ${format}`);
    toast({ title: "Export gestart", description: `Het ${format.toUpperCase()} bestand wordt gegenereerd...` });
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
    <div className="flex-1 flex flex-col h-full">
      <div className="fixed top-0 left-64 right-0 z-30">
        <PageHeader
          title="Betalingsbeheer"
          icon={<Euro className="h-5 w-5 text-white" />}
          parent="Beheer"
          current="Betalingsbeheer"
        />
      </div>
      <div className="mt-[91px] flex-1 overflow-auto bg-[#f7f9fc]">
      
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Quick Action Bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white border border-[#e5e7eb] rounded-sm p-4 mb-6">
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowPaymentDialog(true)}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Betaling
            </Button>
            <Button variant="outline" className="border-[#e5e7eb] hover:bg-[#f9fafc]">
              <Receipt className="h-4 w-4 mr-2" />
              Factuur Maken
            </Button>
          </div>
          <div className="flex gap-2">
            <ExportButton 
              onClick={() => setIsExportDialogOpen(true)}
              title="Exporteer betalingsgegevens"
            />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-[#e5e7eb] rounded-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Betalingen
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Instellingen
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="data-[state=active]:bg-[#1e40af] data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapporten
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Overview - Dashboard stijl */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Totaal Geïnd kaart */}
              <div className="bg-white border border-[#e5e7eb] rounded-sm">
                <div className="flex h-full">
                  <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
                    <Euro className="h-5 w-5 text-[#1e40af]" />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-medium text-gray-500">Totaal Geïnd</h3>
                      <p className="text-lg font-medium text-gray-800 mt-1">€{paymentStats.totalPaid?.toFixed(2) || '0.00'}</p>
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
                      <p className="text-lg font-medium text-gray-800 mt-1">€{paymentStats.totalPending?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actieve Studenten kaart */}
              <div className="bg-white border border-[#e5e7eb] rounded-sm">
                <div className="flex h-full">
                  <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
                    <Users className="h-5 w-5 text-[#1e40af]" />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-medium text-gray-500">Actieve Studenten</h3>
                      <p className="text-lg font-medium text-gray-800 mt-1">{studentsData.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content sections - Dashboard stijl */}
            <div className="space-y-4">
              {/* Recente Betalingen - Dashboard application styling */}
              <div className="bg-white border border-[#e5e7eb] rounded-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Recente Betalingen
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {filteredPayments.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f9fafc]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#f5f7fc] border border-[#e5e7eb] rounded-sm flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-[#1e40af]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {payment.studentName || 'Onbekende student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.description || 'Geen beschrijving'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800">
                            €{payment.amount?.toFixed(2) || '0.00'}
                          </div>
                          {getPaymentStatusBadge(payment.status || 'unknown')}
                        </div>
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">Geen betalingsgegevens beschikbaar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Betalingsstatus overzicht */}
              <div className="bg-white border border-[#e5e7eb] rounded-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Betalingsstatus Overzicht
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border border-[#e5e7eb] rounded-sm">
                      <div className="text-lg font-medium text-gray-800">
                        {filteredPayments.filter((p: any) => p.status === 'paid').length}
                      </div>
                      <div className="text-xs text-gray-500">Betaald</div>
                    </div>
                    <div className="text-center p-3 border border-[#e5e7eb] rounded-sm">
                      <div className="text-lg font-medium text-gray-800">
                        {filteredPayments.filter((p: any) => p.status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-500">Wachtend</div>
                    </div>
                    <div className="text-center p-3 border border-[#e5e7eb] rounded-sm">
                      <div className="text-lg font-medium text-gray-800">
                        {filteredPayments.filter((p: any) => p.status === 'overdue').length}
                      </div>
                      <div className="text-xs text-gray-500">Achterstallig</div>
                    </div>
                  </div>
                </div>
              </div>
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
            
            <div className="bg-white border border-[#e5e7eb] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
                <h3 className="text-sm font-medium text-gray-700">Alle Betalingen</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#e5e7eb]">
                      <TableHead className="text-xs text-gray-500 font-medium">Student</TableHead>
                      <TableHead className="text-xs text-gray-500 font-medium">Factuur</TableHead>
                      <TableHead className="text-xs text-gray-500 font-medium">Bedrag</TableHead>
                      <TableHead className="text-xs text-gray-500 font-medium">Status</TableHead>
                      <TableHead className="text-xs text-gray-500 font-medium">Vervaldatum</TableHead>
                      <TableHead className="text-xs text-gray-500 font-medium">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id} className="border-b border-[#e5e7eb] hover:bg-[#f9fafc]">
                          <TableCell className="text-sm text-gray-800">{payment.studentName || 'Onbekende student'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{payment.invoiceNumber || '-'}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-800">€{payment.amount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status || 'unknown')}</TableCell>
                          <TableCell className="text-sm text-gray-600">{payment.dueDate || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewPayment(payment)}
                                className="h-8 w-8 p-0 hover:bg-[#f5f7fc]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditPayment(payment)}
                                className="h-8 w-8 p-0 hover:bg-[#f5f7fc]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeletePayment(payment)}
                                className="h-8 w-8 p-0 hover:bg-[#f5f7fc]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">
                          Geen betalingsgegevens beschikbaar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
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
                <ExportButton 
                  onClick={() => setIsExportDialogOpen(true)}
                  title="Exporteer betalingsgegevens"
                />
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

        {/* Export Dialog */}
        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          title="Betalingsgegevens Exporteren"
          description="Kies een formaat om de betalingsgegevens te exporteren"
          selectedCount={0}
          totalCount={paymentsData.length}
          entityName="betalingen"
          onExport={handleExport}
        />
      </div>
    </div>
  );
}