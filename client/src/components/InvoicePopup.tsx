import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, QrCode, Calendar, Euro, User, FileText } from 'lucide-react';

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  amount: number;
  originalAmount?: number;
  dueDate: string;
  hasDiscount: boolean;
  discountInfo?: {
    name: string;
    discountType: string;
    discountValue: number;
  };
  qrCode: string;
  paymentUrl: string;
}

interface Student {
  firstName: string;
  lastName: string;
  studentId: string;
}

interface InvoicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetails;
  student: Student;
}

export function InvoicePopup({ isOpen, onClose, invoice, student }: InvoicePopupProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create PDF download functionality here
    console.log('Download PDF functionality to be implemented');
  };

  const copyPaymentUrl = async () => {
    try {
      await navigator.clipboard.writeText(invoice.paymentUrl);
      // Add toast notification here
    } catch (err) {
      console.error('Failed to copy payment URL:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1e40af]">
            <FileText className="w-5 h-5" />
            Factuur {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/assets/myMadrassa.png" alt="myMadrassa" className="h-8" />
                  <span>myMadrassa</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-[#1e40af] border-[#1e40af]">
                  Nieuw
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Factuurgegevens</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Nummer: {invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Vervaldatum: {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Student</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{student.firstName} {student.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">ID:</span>
                      <span>{student.studentId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5" />
                Bedragspecificatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Collegegeld 2024-2025</span>
                  <span>{formatCurrency(invoice.originalAmount || invoice.amount)}</span>
                </div>
                
                {invoice.hasDiscount && invoice.discountInfo && (
                  <>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Korting: {invoice.discountInfo.name}</span>
                      <span>-{formatCurrency((invoice.originalAmount || invoice.amount) - invoice.amount)}</span>
                    </div>
                    <Separator />
                  </>
                )}
                
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Totaal te betalen</span>
                  <span className="text-[#1e40af]">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Betaling via QR-code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={invoice.qrCode} 
                    alt="QR Code voor betaling" 
                    className="w-32 h-32 border rounded-lg"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    Scan deze QR-code met uw banking app om direct te betalen
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Betalingslink:</p>
                    <p className="text-sm font-mono break-all">{invoice.paymentUrl}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyPaymentUrl}
                    className="w-full md:w-auto"
                  >
                    Kopieer betalingslink
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Betalingsinstructies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Betaal voor de vervaldatum om extra kosten te voorkomen</p>
                <p>• Gebruik het factuurnummer als betalingskenmerk</p>
                <p>• Bij vragen kunt u contact opnemen via info@mymadrassa.nl</p>
                <p>• Na betaling ontvangt u automatisch een bevestiging</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Afdrukken
            </Button>
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={onClose} 
              className="flex-1 bg-[#1e40af] hover:bg-[#1e40af]/90"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}