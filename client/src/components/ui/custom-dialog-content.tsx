import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CustomDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  withBlueHeader?: boolean;
}

export function CustomDialogContent({ children, className, title, withBlueHeader = false, ...props }: CustomDialogContentProps) {
  if (withBlueHeader && title) {
    return (
      <DialogContent 
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-y-auto",
          "bg-white border border-gray-200 shadow-2xl",
          "rounded-lg p-0", // Remove padding when using blue header
          className
        )}
        {...props}
      >
        <DialogHeader className="border-b pb-3 bg-[#1e40af] text-white rounded-t-lg p-6">
          <DialogTitle className="text-lg font-semibold text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {children}
        </div>
      </DialogContent>
    );
  }

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