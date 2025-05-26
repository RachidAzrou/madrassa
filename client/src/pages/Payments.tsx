import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CustomDialog, 
  DialogHeaderWithIcon, 
  DialogFormContainer, 
  SectionContainer, 
  DialogFooterContainer,
  FormLabel,
  StyledSelect,
  StyledSelectItem 
} from "@/components/ui/custom-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Euro, Users, TrendingUp, ExternalLink, RefreshCw, User, GraduationCap } from "lucide-react";
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
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error("Failed to create payment");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      setIsCreateDialogOpen(false);
      
      // Open Mollie checkout URL if available
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      }
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
      const selectedClass = classes?.find(cls => cls.id.toString() === selectedClassId);
      if (!selectedClass) return;
      
      // Filter studenten die in deze klas zitten
      // Controleer verschillende mogelijke veldnamen voor klasassociatie
      const classStudents = students?.filter(student => 
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Betalingen</h1>
          <p className="text-gray-500">Beheer student betalingen via Mollie</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#1e40af] hover:bg-[#1e3a8a]"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Nieuwe betaling
        </Button>
        
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
                      {students?.map((student) => (
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
                      {classes?.map((cls) => (
                        <StyledSelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} ({cls.academicYear})
                        </StyledSelectItem>
                      ))}
                    </StyledSelect>
                    {selectedClassId && (
                      <p className="text-sm text-gray-500">
                        {students?.filter(s => {
                          const selectedClass = classes?.find(cls => cls.id.toString() === selectedClassId);
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
              <Euro className="h-4 w-4 text-yellow-600" />
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
              <Euro className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalFailed.toString())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slagingspercentage</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Betalingen overzicht</CardTitle>
          <CardDescription>
            Alle student betalingen en hun status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen betalingen aangemaakt</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const student = students?.find(s => s.id === payment.studentId);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {student ? `${student.firstName} ${student.lastName}` : `Student ID: ${payment.studentId}`}
                        </h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusText(payment.status)}
                        </Badge>
                        {payment.paymentMethod && (
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentMethod}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{payment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Bedrag: {formatCurrency(payment.amount)}</span>
                        <span>Aangemaakt: {formatDate(payment.createdAt)}</span>
                        {payment.paidAt && (
                          <span>Betaald: {formatDate(payment.paidAt)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {payment.checkoutUrl && payment.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(payment.checkoutUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Betalen
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshStatusMutation.mutate(payment.id)}
                        disabled={refreshStatusMutation.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshStatusMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}