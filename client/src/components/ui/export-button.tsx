import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

export function ExportButton({ onClick, title = "Exporteren", disabled = false }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
      title={title}
      disabled={disabled}
    >
      <Upload className="h-3.5 w-3.5" />
    </Button>
  );
}