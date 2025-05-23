import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { X } from 'lucide-react';

interface DetailDialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: {
    label: string;
    type?: 'default' | 'blue' | 'green' | 'red' | 'yellow';
  };
  onClose?: () => void;
}

export function DetailDialogHeader({ 
  title, 
  subtitle, 
  icon, 
  status, 
  onClose 
}: DetailDialogHeaderProps) {
  return (
    <div className="bg-[#1e3a8a] text-white px-6 py-5 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {subtitle && (
                <span className="text-sm text-blue-100 font-medium">
                  {subtitle}
                </span>
              )}
              {status && (
                <Badge className="bg-white/20 text-white border-transparent hover:bg-white/30">
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            className="text-white hover:bg-[#1e3a8a]/80 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Sluiten
          </Button>
        )}
      </div>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailSection({ title, icon, children }: DetailSectionProps) {
  return (
    <div>
      <div className="flex items-center mb-4">
        {icon && (
          <div className="text-blue-600 mr-2">
            {icon}
          </div>
        )}
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface DataCardProps {
  children: React.ReactNode;
}

export function DataCard({ children }: DataCardProps) {
  return (
    <div className="bg-gray-50 border rounded-md overflow-hidden">
      <div className="grid grid-cols-1 divide-y">
        {children}
      </div>
    </div>
  );
}

interface DataRowProps {
  label: string;
  children: React.ReactNode;
}

export function DataRow({ label, children }: DataRowProps) {
  return (
    <div className="p-4 flex">
      <div className="w-1/3">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      </div>
      <div className="w-2/3">
        {children}
      </div>
    </div>
  );
}

interface HoverCardItemProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function HoverCardItem({ children, actions }: HoverCardItemProps) {
  return (
    <div className="group hover:bg-blue-50/50 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between">
          {children}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FadeInButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={`invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 ${props.className || ''}`}
    >
      {children}
    </Button>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-8 px-4">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-blue-100/50 flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="text-gray-500 text-sm font-medium">
          {title}
        </p>
        {description && (
          <p className="text-gray-400 text-xs mt-1">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function DetailDialog({ open, onOpenChange, children }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[900px] max-h-[85vh] overflow-y-auto bg-white p-0">
        <div className="pb-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DetailDialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}