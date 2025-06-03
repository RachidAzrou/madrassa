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
  Trash2
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
    <div className="space-y-6 p-6">
      <PremiumHeader 
        title="Betalingsbeheer" 
        icon={Euro}
        description="Beheer alle betalingen, facturen en tarieven van uw onderwijsinstelling"
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="payments">Betalingen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
          <TabsTrigger value="reports">Rapporten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Geïnd</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{paymentStats.totalPaid?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Totaal betaalde bedragen
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{paymentStats.totalPending?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredPayments.filter((p: any) => p.status === 'pending').length} openstaande betalingen
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slagingspercentage</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paymentStats.successRate?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Succesvol afgeronde betalingen
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actieve Studenten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentsData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Geregistreerde studenten
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recente Betalingen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {filteredPayments.slice(0, 5).map((payment: any) => (
                    <div key={payment.id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {payment.studentName || 'Onbekende student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.description || 'Geen beschrijving'}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        €{payment.amount?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  ))}
                  {filteredPayments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Geen betalingsgegevens beschikbaar
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Betalingsstatus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Betaald</span>
                    <span className="ml-auto text-sm font-medium">
                      {filteredPayments.filter((p: any) => p.status === 'paid').length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm">Wachtend</span>
                    <span className="ml-auto text-sm font-medium">
                      {filteredPayments.filter((p: any) => p.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">Achterstallig</span>
                    <span className="ml-auto text-sm font-medium">
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
  );
}