import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";

interface DataTableContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * A reusable container component for data tables with consistent styling
 * This maintains the standard style from the Guardians page
 */
export function DataTableContainer({ children, className = "" }: DataTableContainerProps) {
  return (
    <div className={`px-6 py-6 flex-1 overflow-visible ${className}`}>
      {children}
    </div>
  );
}

/**
 * Styled form label with consistent styling for use in tables and filters
 */
export function FilterLabel({ children, htmlFor, className = "" }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <Label htmlFor={htmlFor} className={`text-xs font-medium text-gray-700 ${className}`}>
      {children}
    </Label>
  );
}

/**
 * Styled select with consistent styling for use in tables and filters
 */
export function FilterSelect({ 
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
      <SelectTrigger className={`h-8 text-sm border-gray-300 ${triggerClassName}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={`bg-white ${className}`}>
        {children}
      </SelectContent>
    </Select>
  );
}

/**
 * Styled select item with consistent styling for use in tables and filters
 */
export function FilterSelectItem({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
  return (
    <SelectItem value={value} className={`text-black hover:bg-blue-100 focus:bg-blue-200 ${className}`}>
      {children}
    </SelectItem>
  );
}

/**
 * Styled action buttons container with consistent styling
 * Buttons inside this container will only be visible on row hover
 */
export function ActionButtonsContainer({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string 
}) {
  return (
    <div className={`flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}>
      {children}
    </div>
  );
}

/**
 * Table header without text for action columns
 */
export function EmptyActionHeader({ 
  className = "",
  width = "120px" 
}: { 
  className?: string;
  width?: string;
}) {
  return (
    <th scope="col" className={`px-4 py-3 text-right w-[120px] ${className}`}>
      <span className="text-xs font-medium text-gray-700"></span>
    </th>
  );
}

/**
 * Standard action buttons with consistent styling from the Guardians page
 */
interface ActionButtonProps {
  onClick: () => void;
  icon: 'view' | 'edit' | 'delete' | 'more';
  className?: string;
  disabled?: boolean;
}

export function ActionButton({ onClick, icon, className = "", disabled = false }: ActionButtonProps) {
  const getIcon = () => {
    switch (icon) {
      case 'view':
        return <Eye className="h-3.5 w-3.5" />;
      case 'edit':
        return <Pencil className="h-3.5 w-3.5" />;
      case 'delete':
        return <Trash2 className="h-3.5 w-3.5" />;
      case 'more':
        return <MoreHorizontal className="h-3.5 w-3.5" />;
      default:
        return <Eye className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${className}`}
    >
      {getIcon()}
    </Button>
  );
}

/**
 * Quick action buttons for common table actions (view, edit, delete)
 */
interface QuickActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function QuickActions({ onView, onEdit, onDelete, className = "" }: QuickActionsProps) {
  return (
    <ActionButtonsContainer className={className}>
      {onView && <ActionButton onClick={onView} icon="view" />}
      {onEdit && <ActionButton onClick={onEdit} icon="edit" />}
      {onDelete && <ActionButton onClick={onDelete} icon="delete" />}
    </ActionButtonsContainer>
  );
}

interface SearchActionBarProps {
  children: ReactNode;
  className?: string;
}

interface SearchActionLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * A reusable responsive flex layout for search and action content
 * This div provides the core responsive layout structure used across all search/action bars
 */
export function SearchActionLayout({ children, className = "" }: SearchActionLayoutProps) {
  return (
    <div className={`px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * A reusable search and action bar component with consistent styling
 */
export function SearchActionBar({ children, className = "" }: SearchActionBarProps) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-sm mb-4 shadow-sm ${className}`}>
      <SearchActionLayout>
        {children}
      </SearchActionLayout>
    </div>
  );
}

interface TableContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * A reusable table container with consistent styling
 */
export function TableContainer({ children, className = "" }: TableContainerProps) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-sm overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto md:overflow-x-visible">
        {children}
      </div>
    </div>
  );
}

interface DataTableHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * A reusable table header with consistent styling
 */
export function DataTableHeader({ children, className = "" }: DataTableHeaderProps) {
  return (
    <thead className={`bg-[#f9fafc] ${className}`}>
      {children}
    </thead>
  );
}

/**
 * A loading state component for tables
 */
export function TableLoadingState() {
  return (
    <tr>
      <td colSpan={99} className="px-6 py-4 text-center">
        <div className="flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500">Laden...</span>
        </div>
      </td>
    </tr>
  );
}

interface TableErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * An error state component for tables
 */
export function TableErrorState({ 
  message = "Fout bij het laden van gegevens.", 
  onRetry 
}: TableErrorStateProps) {
  return (
    <tr>
      <td colSpan={99} className="px-6 py-4 text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-8 w-8 text-red-500 mb-2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-sm text-red-500">{message}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 h-7 text-xs rounded-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3"
            >
              Opnieuw proberen
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

interface EmptyTableStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * An empty state component for tables
 */
export function EmptyTableState({ 
  icon, 
  title = "Geen resultaten gevonden", 
  description = "Er zijn geen items om weer te geven.", 
  action 
}: EmptyTableStateProps) {
  return (
    <tr>
      <td colSpan={99} className="px-6 py-4 text-center">
        <div className="h-48 flex flex-col items-center justify-center text-gray-500">
          <div className="text-[#1e3a8a] mb-2">
            {icon}
          </div>
          <p className="text-sm font-medium">{title}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}