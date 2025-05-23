import React from 'react';
import { DialogContent } from './dialog';
import { cn } from '@/lib/utils';

interface CustomDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  maxHeight?: boolean;
}

const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  CustomDialogContentProps
>(({ className, maxHeight = false, ...props }, ref) => {
  return (
    <DialogContent
      ref={ref}
      className={cn(
        className,
        maxHeight && "h-[calc(100vh-100px)] max-h-[900px] overflow-hidden"
      )}
      {...props}
    />
  );
});

CustomDialogContent.displayName = 'CustomDialogContent';

export { CustomDialogContent };