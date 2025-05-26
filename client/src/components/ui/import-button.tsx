import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportButtonProps {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

export function ImportButton({ 
  onClick, 
  title = "Importeren", 
  disabled = false 
}: ImportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
      title={title}
    >
      <Upload className="h-3.5 w-3.5" />
    </Button>
  );
}