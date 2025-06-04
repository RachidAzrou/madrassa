import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('checking');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('id');

    if (paymentId) {
      checkPaymentStatus(paymentId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      // Get payment details
      const payment = await apiRequest(`/api/payments/${paymentId}`);
      setPaymentData(payment);

      // Check status with Mollie
      const statusResponse = await apiRequest(`/api/payments/${paymentId}/status`);
      setPaymentStatus(statusResponse.status);
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Fout",
        description: "Kon betalingsstatus niet ophalen",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleBackToFees = () => {
    setLocation("/fees");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Betalingsstatus controleren...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Betaling niet gevonden</p>
            <Button onClick={handleBackToFees} className="w-full mt-4">
              Terug naar betalingen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'paid' || paymentStatus === 'betaald';
  const isPending = paymentStatus === 'pending' || paymentStatus === 'open';
  const isFailed = paymentStatus === 'failed' || paymentStatus === 'canceled' || paymentStatus === 'expired';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSuccess ? 'bg-green-100' : 
            isPending ? 'bg-orange-100' : 
            'bg-red-100'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : isPending ? (
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            ) : (
              <div className="w-8 h-8 text-red-600">✕</div>
            )}
          </div>
          <CardTitle className={`text-2xl ${
            isSuccess ? 'text-green-600' : 
            isPending ? 'text-orange-600' : 
            'text-red-600'
          }`}>
            {isSuccess ? 'Betaling geslaagd!' : 
             isPending ? 'Betaling wordt verwerkt...' : 
             'Betaling mislukt'}
          </CardTitle>
          <p className="text-gray-600">
            {isSuccess ? 'Uw betaling is succesvol verwerkt' : 
             isPending ? 'Even geduld, uw betaling wordt nog verwerkt' : 
             'Er is een probleem opgetreden met uw betaling'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Beschrijving:</span>
              <span>{paymentData.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Bedrag:</span>
              <span className="font-bold">€{paymentData.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={isSuccess ? "default" : isPending ? "secondary" : "destructive"} 
                     className={
                       isSuccess ? "bg-green-100 text-green-800" : 
                       isPending ? "bg-orange-100 text-orange-800" : 
                       "bg-red-100 text-red-800"
                     }>
                {isSuccess ? 'Betaald' : 
                 isPending ? 'In behandeling' : 
                 'Mislukt'}
              </Badge>
            </div>
            {paymentData.molliePaymentId && (
              <div className="flex justify-between">
                <span className="font-medium">Referentie:</span>
                <span className="text-xs text-gray-500">{paymentData.molliePaymentId}</span>
              </div>
            )}
          </div>
          
          {isPending && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                Uw betaling wordt nog verwerkt. Dit kan enkele minuten duren. 
                U ontvangt een bevestiging zodra de betaling is voltooid.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                De betaling kon niet worden voltooid. U kunt het opnieuw proberen 
                of contact opnemen met de administratie voor hulp.
              </p>
            </div>
          )}
          
          <Button onClick={handleBackToFees} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar betalingen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}