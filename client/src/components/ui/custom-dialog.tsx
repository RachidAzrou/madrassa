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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
      <DialogContent className={`p-0 overflow-hidden max-h-[90vh] w-[95vw] sm:max-w-[${maxWidth}] ${className}`}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Styled form label with consistent styling
 */
export function FormLabel({ children, htmlFor, className = "" }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <Label htmlFor={htmlFor} className={`text-xs font-medium text-gray-700 ${className}`}>
      {children}
    </Label>
  );
}

/**
 * Styled select with consistent styling matching the filter dropdowns
 */
export function StyledSelect({ 
  value, 
  onValueChange, 
  placeholder = "Selecteer...", 
  children, 
  className = "",
  triggerClassName = ""
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  placeholder?: string;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id="relationship" className={`h-8 text-sm border-gray-300 ${triggerClassName}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={`bg-white ${className}`}>
        {children}
      </SelectContent>
    </Select>
  );
}

/**
 * Styled select item with consistent styling
 */
export function StyledSelectItem({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
  return (
    <SelectItem value={value} className={`text-black hover:bg-blue-100 focus:bg-blue-200 ${className}`}>
      {children}
    </SelectItem>
  );
}

/**
 * Styled checkbox with consistent styling
 */
export function StyledCheckbox({
  id,
  checked,
  onCheckedChange,
  className = ""
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`peer shrink-0 border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-primary-foreground h-4 w-4 rounded-sm border-gray-300 data-[state=checked]:bg-[#1e40af] bg-[#fff] ${className}`}
    />
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