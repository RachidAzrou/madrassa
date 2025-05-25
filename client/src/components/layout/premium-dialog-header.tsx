import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReactNode } from "react";

interface PremiumDialogHeaderProps {
  title: string;
  description?: string;
  icon: ReactNode;
}

export function PremiumDialogHeader({ 
  title, 
  description, 
  icon 
}: PremiumDialogHeaderProps) {
  return (
    <DialogHeader variant="premium">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <DialogTitle className="text-white">
            {title}
          </DialogTitle>
        </div>
      </div>
      {description && (
        <DialogDescription className="text-white opacity-70 mt-1">
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  );
}