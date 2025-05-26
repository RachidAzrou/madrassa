import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileEdit, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: { label: string; required?: boolean }[];
  apiEndpoint: string;
  queryKey: string[];
  acceptedFileTypes?: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  apiEndpoint,
  queryKey,
  acceptedFileTypes = ".csv,.xlsx,.xls"
}: ImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "Geen bestand geselecteerd",
        description: "Selecteer een CSV of Excel bestand om te importeren.",
        variant: "destructive",
      });
      return;
    }

    // Simuleer het verwerken van het bestand
    toast({
      title: "Verwerken",
      description: "Bestand wordt verwerkt...",
    });

    // Hier zou echte import logica komen om het bestand te verwerken
    setTimeout(() => {
      // Vernieuw de lijst na het importeren
      queryClient.invalidateQueries({ queryKey });
      
      toast({
        title: "Import voltooid",
        description: "De gegevens zijn succesvol geïmporteerd.",
      });
      
      onOpenChange(false);
      setImportFile(null);
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setImportFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] p-0 overflow-hidden">
        <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-semibold m-0">{title}</DialogTitle>
              <DialogDescription className="text-white/70 text-sm m-0">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="bg-[#f1f5f9] p-4 rounded-md">
            <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
              <FileEdit className="h-4 w-4 mr-2" />
              Velden voor importeren
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs text-gray-600">
                <ul className="space-y-1">
                  {fields.slice(0, Math.ceil(fields.length / 2)).map((field, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-[#1e40af] rounded-full mr-2 flex-shrink-0"></span>
                      {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-xs text-gray-600">
                <ul className="space-y-1">
                  {fields.slice(Math.ceil(fields.length / 2)).map((field, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-[#1e40af] rounded-full mr-2 flex-shrink-0"></span>
                      {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="importFile" className="text-sm font-medium text-gray-700">
              Selecteer bestand
            </Label>
            <Input
              id="importFile"
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {importFile && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {importFile.name} geselecteerd
              </p>
            )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800">
              <strong>Let op:</strong> Zorg ervoor dat uw bestand de juiste kolomnamen bevat zoals hierboven aangegeven. 
              Velden gemarkeerd met een rode asterisk (*) zijn verplicht.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-8 text-xs rounded-sm border-[#e5e7eb]"
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleImport}
            className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            disabled={!importFile}
          >
            Importeren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}