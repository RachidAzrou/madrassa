import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface CustomDialogContentProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

export function CustomDialogContent({
  title,
  description,
  icon,
  children,
  footer,
  onClose
}: CustomDialogContentProps) {
  return (
    <DialogContent className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] sm:h-[85vh] p-0 gap-0 bg-white overflow-hidden">
      <DialogHeader className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-[#1e3a8a]">{icon}</div>}
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full p-0 text-gray-400 hover:text-gray-500"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Sluiten</span>
            </Button>
          )}
        </div>
        {description && (
          <DialogDescription className="text-gray-500 mt-2">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
        {children}
      </div>
      {footer && (
        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  );
}