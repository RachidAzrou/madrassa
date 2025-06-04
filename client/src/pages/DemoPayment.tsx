import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DemoPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<{
    id: string;
    amount: string;
    description: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const amount = urlParams.get('amount');
    const description = urlParams.get('description');

    if (id && amount && description) {
      setPaymentData({
        id,
        amount,
        description: decodeURIComponent(description)
      });
    }
  }, []);

  const handlePayment = async () => {
    if (!paymentData) return;

    setIsProcessing(true);
    
    // Simuleer betaalproces (2 seconden)
    setTimeout(async () => {
      try {
        // Simuleer succesvolle betaling door status te updaten
        await apiRequest("PUT", `/api/payments/${paymentData.id}`, {
          status: "betaald",
          paidAt: new Date().toISOString(),
          mollieStatus: "paid"
        });

        setIsCompleted(true);
        setIsProcessing(false);
        
        toast({
          title: "Betaling geslaagd",
          description: "Uw betaling is succesvol verwerkt",
          variant: "default",
        });
      } catch (error) {
        setIsProcessing(false);
        toast({
          title: "Betaling mislukt",
          description: "Er is een fout opgetreden bij het verwerken van de betaling",
          variant: "destructive",
        });
      }
    }, 2000);
  };

  const handleCancel = () => {
    setLocation("/fees");
  };

  const handleBackToFees = () => {
    setLocation("/fees");
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Ongeldige betaallink</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Betaling geslaagd!</CardTitle>
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
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Betaald
                </Badge>
              </div>
            </div>
            
            <Button onClick={handleBackToFees} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar betalingen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Demo Betaling</CardTitle>
          <p className="text-gray-600">Klik op 'Betalen' om de demo betaling te voltooien</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Beschrijving:</span>
              <span>{paymentData.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Bedrag:</span>
              <span className="font-bold text-xl">€{paymentData.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Openstaand
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verwerken...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Betalen €{paymentData.amount}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full"
            >
              Annuleren
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Dit is een demo omgeving. Geen echte betaling wordt verwerkt.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}