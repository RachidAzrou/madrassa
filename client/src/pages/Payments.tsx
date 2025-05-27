import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { DialogHeaderWithIcon, DialogFormContainer, DialogFooterContainer, SectionContainer, FormLabel, StyledSelect, StyledSelectItem } from "@/components/ui/custom-dialog";
import { CreditCard, Euro, Users, TrendingUp, ExternalLink, RefreshCw, User, GraduationCap, Search, Filter, Download, Upload, PlusCircle } from "lucide-react";
import { PremiumHeader } from '@/components/layout/premium-header';
import { StandardTable, StandardTableHeader, StandardTableBody, StandardTableRow, StandardTableCell, StandardTableHeaderCell, TableLoadingState, TableEmptyState, EmptyActionHeader, TableActionCell } from "@/components/ui/standard-table";

import { queryClient } from "@/lib/queryClient";



interface Payment {
  id: number;
  studentId: number;
  feeId?: number;
  molliePaymentId?: string;
  amount: string;
  currency: string;
  description: string;
  status: string;
  mollieStatus?: string;
  paymentMethod?: string;
  checkoutUrl?: string;
  paidAt?: string;
  expiresAt?: string;
  failureReason?: string;
  academicYear?: string;
  semester?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  successRate: number;
}

export default function Payments() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"individual" | "class">("individual");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDescription, setPaymentDescription] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Fetch payment stats
  const { data: stats } = useQuery<PaymentStats>({
    queryKey: ["/api/payments/stats"],
  });

  // Fetch students voor dropdown - combineer API en localStorage
  const { data: apiStudents } = useQuery<any[]>({
    queryKey: ["/api/students"],
  });

  // Haal students uit localStorage als fallback
  const localStudents = JSON.parse(localStorage.getItem('students') || '[]');
  const students = apiStudents && apiStudents.length > 0 ? apiStudents : localStudents;

  // Fetch klassen voor dropdown - combineer API en localStorage
  const { data: apiClasses } = useQuery<any[]>({
    queryKey: ["/api/student-groups"],
  });

  const localClasses = JSON.parse(localStorage.getItem('studentGroups') || '[]');
  const classes = apiClasses && apiClasses.length > 0 ? apiClasses : localClasses;

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      console.log("Creating payment with data:", paymentData);
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Failed to create payment: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Payment created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      
      // Reset form
      setSelectedStudentId("");
      setSelectedClassId("");
      setPaymentAmount("");
      setPaymentDescription("");
      setPaymentNotes("");
      setPaymentMethod("individual");
      setIsCreateDialogOpen(false);
      
      // Show success message
      alert(paymentMethod === "class" ? 
        `Betalingen voor klas succesvol aangemaakt!` : 
        `Betaling succesvol aangemaakt!`);
      
      // Open Mollie checkout URL if available
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: (error) => {
      console.error("Payment creation error:", error);
      alert("Er ging iets mis bij het aanmaken van de betaling. Probeer het opnieuw.");
    },
  });

  // Refresh payment status mutation
  const refreshStatusMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await fetch(`/api/payments/${paymentId}/status`);
      if (!response.ok) throw new Error("Failed to refresh status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
    },
  });

  const handleCreatePayment = async () => {
    if (!paymentAmount || !paymentDescription) return;
    
    if (paymentMethod === "individual") {
      if (!selectedStudentId) return;
      
      createPaymentMutation.mutate({
        studentId: parseInt(selectedStudentId),
        amount: paymentAmount,
        currency: "EUR",
        description: paymentDescription,
        notes: paymentNotes || null,
        academicYear: "2024-2025",
        semester: "1"
      });
    } else if (paymentMethod === "class") {
      if (!selectedClassId) return;
      
      // Haal studenten van geselecteerde klas op
      const selectedClass = classes?.find((cls: any) => cls.id.toString() === selectedClassId);
      if (!selectedClass) return;
      
      // Filter studenten die in deze klas zitten
      const classStudents = students?.filter((student: any) => 
        student.studentGroupId === selectedClass.id || 
        student.classId === selectedClass.id ||
        student.klas === selectedClass.name ||
        student.studentGroup === selectedClass.name
      ) || [];
      
      if (classStudents.length === 0) {
        alert("Geen studenten gevonden in deze klas");
        return;
      }
      
      // Maak betalingen voor alle studenten in de klas
      for (const student of classStudents) {
        createPaymentMutation.mutate({
          studentId: student.id,
          amount: paymentAmount,
          currency: "EUR",
          description: `${paymentDescription} (Klas: ${selectedClass.name})`,
          notes: paymentNotes || null,
          academicYear: "2024-2025",
          semester: "1"
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Betaald';
      case 'pending': return 'In afwachting';
      case 'failed': return 'Mislukt';
      case 'canceled': return 'Geannuleerd';
      case 'expired': return 'Verlopen';
      default: return status;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (paymentsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PremiumHeader
        title="Betalingen"
        path="Financiën > Betalingen"
        icon={CreditCard}
        description="Beheer student betalingen via Mollie en bekijk betalingsstatistieken"
      />
      
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Zoek en acties */}
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoeken naar betalingen..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="flex gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="flex items-center bg-[#1e40af] hover:bg-blue-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal betaald</CardTitle>
              <Euro className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalPaid.toString())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In afwachting</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.totalPending.toString())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mislukt</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalFailed.toString())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Succesvol</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.successRate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Betalingen tabel */}
      <StandardTable>
        <StandardTableHeader>
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Betalingen</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-sm flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </StandardTableHeader>
        
        {paymentsLoading ? (
          <TableLoadingState />
        ) : payments && payments.length > 0 ? (
          <StandardTableBody>
            <StandardTableRow className="bg-gray-50">
              <StandardTableHeaderCell>STUDENT</StandardTableHeaderCell>
              <StandardTableHeaderCell>BESCHRIJVING</StandardTableHeaderCell>
              <StandardTableHeaderCell>BEDRAG</StandardTableHeaderCell>
              <StandardTableHeaderCell>STATUS</StandardTableHeaderCell>
              <StandardTableHeaderCell>DATUM</StandardTableHeaderCell>
              <StandardTableHeaderCell className="text-right">ACTIES</StandardTableHeaderCell>
            </StandardTableRow>
            
            {payments.map((payment: Payment) => (
              <StandardTableRow key={payment.id}>
                <StandardTableCell>
                  <div className="font-medium">Student #{payment.studentId}</div>
                </StandardTableCell>
                <StandardTableCell>
                  <div className="max-w-[200px] truncate" title={payment.description}>
                    {payment.description}
                  </div>
                </StandardTableCell>
                <StandardTableCell className="font-medium">
                  {formatCurrency(payment.amount)}
                </StandardTableCell>
                <StandardTableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </StandardTableCell>
                <StandardTableCell>
                  {formatDate(payment.createdAt)}
                </StandardTableCell>
                <TableActionCell>
                  {payment.checkoutUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(payment.checkoutUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refreshStatusMutation.mutate(payment.id)}
                    disabled={refreshStatusMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshStatusMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </TableActionCell>
              </StandardTableRow>
            ))}
          </StandardTableBody>
        ) : (
          <TableEmptyState 
            icon={<CreditCard className="w-12 h-12 text-gray-300" />}
            title="Geen betalingen gevonden"
            description="Er zijn nog geen betalingen aangemaakt."
            action={
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nieuwe betaling toevoegen</span>
              </Button>
            }
          />
        )}
      </StandardTable>

      {/* Dialog voor nieuwe betaling */}
      <CustomDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        maxWidth="600px"
      >
        <DialogHeaderWithIcon
          title="Nieuwe betaling aanmaken"
          description="Maak een nieuwe Mollie betaling aan voor een student"
          icon={<CreditCard className="h-5 w-5" />}
        />
        
        <DialogFormContainer>
          <SectionContainer title="Betalingsmethode" icon={<Users className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div 
                onClick={() => setPaymentMethod("individual")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "individual" 
                    ? "border-[#1e40af] bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#1e40af]" />
                  <div>
                    <h3 className="font-medium">Individuele student</h3>
                    <p className="text-sm text-gray-500">Selecteer één student</p>
                  </div>
                </div>
              </div>
              
              <div 
                onClick={() => setPaymentMethod("class")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "class" 
                    ? "border-[#1e40af] bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[#1e40af]" />
                  <div>
                    <h3 className="font-medium">Hele klas</h3>
                    <p className="text-sm text-gray-500">Alle studenten van een klas</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer title="Betalingsgegevens" icon={<CreditCard className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethod === "individual" ? (
                <div className="space-y-2">
                  <FormLabel htmlFor="student">Student</FormLabel>
                  <StyledSelect 
                    value={selectedStudentId} 
                    onValueChange={setSelectedStudentId}
                    placeholder="Selecteer een student..."
                  >
                    {students?.map((student: any) => (
                      <StyledSelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} ({student.studentId})
                      </StyledSelectItem>
                    ))}
                  </StyledSelect>
                </div>
              ) : (
                <div className="space-y-2">
                  <FormLabel htmlFor="class">Klas</FormLabel>
                  <StyledSelect 
                    value={selectedClassId} 
                    onValueChange={setSelectedClassId}
                    placeholder="Selecteer een klas..."
                  >
                    {classes?.map((cls: any) => (
                      <StyledSelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} ({cls.academicYear})
                      </StyledSelectItem>
                    ))}
                  </StyledSelect>
                  {selectedClassId && (
                    <p className="text-sm text-gray-500">
                      {students?.filter((s: any) => {
                        const selectedClass = classes?.find((cls: any) => cls.id.toString() === selectedClassId);
                        if (!selectedClass) return false;
                        return s.studentGroupId === selectedClass.id || 
                               s.classId === selectedClass.id ||
                               s.klas === selectedClass.name ||
                               s.studentGroup === selectedClass.name;
                      }).length || 0} studenten in deze klas
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="amount">Bedrag (EUR)</FormLabel>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="description">Beschrijving</FormLabel>
                  <Input
                    id="description"
                    placeholder="Bijv. Collegegeld semester 1"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="notes">Notities (optioneel)</FormLabel>
                <Textarea
                  id="notes"
                  placeholder="Extra informatie..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </SectionContainer>
        </DialogFormContainer>
        
        <DialogFooterContainer>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(false)}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleCreatePayment}
            disabled={
              createPaymentMutation.isPending || 
              !paymentAmount || 
              !paymentDescription ||
              (paymentMethod === "individual" && !selectedStudentId) ||
              (paymentMethod === "class" && !selectedClassId)
            }
            className="bg-[#1e40af] hover:bg-[#1e3a8a] w-full sm:w-auto"
          >
            {createPaymentMutation.isPending ? "Bezig..." : 
             paymentMethod === "class" ? "Betalingen aanmaken voor klas" : "Betaling aanmaken"}
          </Button>
        </DialogFooterContainer>
      </CustomDialog>
    </div>
  );
}