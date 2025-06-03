import React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CustomDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  children: React.ReactNode;
  className?: string;
}

export function CustomDialogContent({ children, className, ...props }: CustomDialogContentProps) {
  return (
    <DialogContent 
      className={cn(
        "max-w-4xl max-h-[90vh] overflow-y-auto",
        "bg-white border border-gray-200 shadow-2xl",
        "rounded-lg p-6",
        className
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}