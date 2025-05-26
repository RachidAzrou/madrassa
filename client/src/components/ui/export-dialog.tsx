import { Upload, FileDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  selectedCount: number;
  totalCount: number;
  entityName: string; // bijv. "studenten", "docenten", "voogden"
  onExport: (format: string) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  title,
  description,
  selectedCount,
  totalCount,
  entityName,
  onExport
}: ExportDialogProps) {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    // Toon een toast-bericht dat het exporteren is gestart
    toast({
      title: "Exporteren",
      description: `${entityName} worden geëxporteerd naar ${format.toUpperCase()}...`,
    });
    
    // Simuleer het exporteren
    setTimeout(() => {
      toast({
        title: "Export voltooid",
        description: `De ${entityName} zijn succesvol geëxporteerd naar ${format.toUpperCase()}.`,
      });
      
      // Sluit het dialoogvenster
      onOpenChange(false);
    }, 1500);

    // Roep de externe handler aan voor daadwerkelijke export
    onExport(format);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-semibold m-0">{title}</DialogTitle>
              <DialogDescription className="text-white/70 text-sm m-0">
                {description || "Kies een formaat om te exporteren"}
              </DialogDescription>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="bg-[#f1f5f9] p-4 rounded-md">
            <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
              <FileDown className="h-4 w-4 mr-2" />
              Selecteer exportformaat
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button 
                variant="outline"
                className="h-24 rounded-md border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => handleExport('excel')}
              >
                <Upload className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium">Excel</span>
              </Button>
              <Button 
                variant="outline"
                className="h-24 rounded-md border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => handleExport('pdf')}
              >
                <Upload className="h-8 w-8 text-red-600" />
                <span className="text-sm font-medium">PDF</span>
              </Button>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-800 flex items-start">
              <GraduationCap className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                {selectedCount > 0
                  ? `Je hebt ${selectedCount} ${entityName} geselecteerd om te exporteren.`
                  : `Je hebt geen ${entityName} geselecteerd. Alle ${totalCount} ${entityName} worden geëxporteerd.`}
              </span>
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs rounded-sm border-[#e5e7eb]"
          >
            Annuleren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}