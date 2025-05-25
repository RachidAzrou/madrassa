import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export function CustomDialog({
  open,
  onOpenChange,
  children,
  maxWidth = "800px",
  className = "",
}: CustomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[${maxWidth}] p-0 overflow-hidden max-h-[90vh] ${className}`}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

interface DialogHeaderWithIconProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function DialogHeaderWithIcon({
  title,
  description,
  icon,
  className = "",
}: DialogHeaderWithIconProps) {
  return (
    <div className={`bg-[#1e40af] py-4 px-6 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="bg-white/20 p-2 rounded-full">
            {icon}
          </div>
        )}
        <div>
          <DialogTitle className="text-white text-lg font-semibold m-0">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-white/70 text-sm m-0">
              {description}
            </DialogDescription>
          )}
        </div>
      </div>
    </div>
  );
}

interface DialogFormContainerProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function DialogFormContainer({
  children,
  onSubmit,
  className = "",
}: DialogFormContainerProps) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`overflow-y-auto ${className}`} 
      style={{ maxHeight: 'calc(90vh - 150px)' }}
    >
      {children}
    </form>
  );
}

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  className?: string;
}

export function SectionContainer({
  children,
  title,
  icon,
  className = "",
}: SectionContainerProps) {
  return (
    <div className={`bg-[#f1f5f9] px-4 py-3 rounded-md ${className}`}>
      {(title || icon) && (
        <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

interface DialogFooterContainerProps {
  children?: ReactNode;
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  showCancelButton?: boolean;
  showSubmitButton?: boolean;
  className?: string;
}

export function DialogFooterContainer({
  children,
  onCancel,
  onSubmit,
  cancelText = "Annuleren",
  submitText = "Opslaan",
  showCancelButton = true,
  showSubmitButton = true,
  className = "",
}: DialogFooterContainerProps) {
  return (
    <div className={`bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t ${className}`}>
      {children ? (
        children
      ) : (
        <>
          {showCancelButton && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
          )}
          {showSubmitButton && (
            <Button 
              type={onSubmit ? "button" : "submit"}
              className="bg-[#1e40af] hover:bg-[#1e40af]/90"
              onClick={onSubmit}
            >
              {submitText}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon?: ReactNode;
  iconBackground?: string;
  iconColor?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  content?: ReactNode;
  maxWidth?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  iconBackground = "bg-red-100",
  iconColor = "text-red-600",
  onConfirm,
  onCancel,
  confirmText = "Bevestigen",
  cancelText = "Annuleren",
  confirmVariant = "destructive",
  content,
  maxWidth = "400px",
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[${maxWidth}] p-0 overflow-hidden`}>
        <div className="p-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            {icon && (
              <div className={`h-12 w-12 rounded-full ${iconBackground} flex items-center justify-center mb-2`}>
                <div className={iconColor}>{icon}</div>
              </div>
            )}
            <DialogTitle className="text-center">{title}</DialogTitle>
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          </div>
          
          {content && (
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              {content}
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  onCancel();
                  onOpenChange(false);
                }}
              >
                {cancelText}
              </Button>
            )}
            <Button 
              type="button"
              variant={confirmVariant}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}