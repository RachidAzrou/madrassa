import React from 'react';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { XCircle } from 'lucide-react';

interface StandardTableProps {
  children: React.ReactNode;
  className?: string;
}

interface StandardTableHeaderProps {
  children: React.ReactNode;
}

interface StandardTableBodyProps {
  children: React.ReactNode;
}

interface StandardTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface StandardTableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

interface StandardTableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  scope?: string;
}

interface LoadingStateProps {
  colSpan: number;
  message?: string;
}

interface ErrorStateProps {
  colSpan: number;
  message?: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  colSpan: number;
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

interface CheckboxHeaderProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

interface ActionHeaderProps {
  className?: string;
}

// Main table container
export function StandardTable({ children, className = "" }: StandardTableProps) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          {children}
        </table>
      </div>
    </div>
  );
}

// Table header
export function StandardTableHeader({ children }: StandardTableHeaderProps) {
  return (
    <thead className="bg-[#f9fafc]">
      {children}
    </thead>
  );
}

// Table body
export function StandardTableBody({ children }: StandardTableBodyProps) {
  return (
    <tbody className="bg-white divide-y divide-[#e5e7eb]">
      {children}
    </tbody>
  );
}

// Table row
export function StandardTableRow({ children, className = "", onClick }: StandardTableRowProps) {
  return (
    <tr 
      className={`group hover:bg-gray-50 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// Table cell
export function StandardTableCell({ children, className = "", colSpan }: StandardTableCellProps) {
  return (
    <td className={`px-4 py-3 text-xs ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

// Table header cell
export function StandardTableHeaderCell({ children, className = "", scope = "col" }: StandardTableHeaderCellProps) {
  return (
    <th scope={scope} className={`px-4 py-3 text-left ${className}`}>
      <span className="text-xs font-medium text-gray-700">{children}</span>
    </th>
  );
}

// Loading state
export function TableLoadingState({ colSpan, message = "Laden..." }: LoadingStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 text-center">
        <div className="flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500">{message}</span>
        </div>
      </td>
    </tr>
  );
}

// Error state
export function TableErrorState({ colSpan, message = "Er is een fout opgetreden.", onRetry }: ErrorStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <XCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-red-500">{message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-2 h-7 text-xs rounded-sm"
            >
              Opnieuw proberen
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Empty state
export function TableEmptyState({ colSpan, icon, title, description, action }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 text-center">
        <div className="py-6">
          {icon && <div className="mb-2">{icon}</div>}
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

// Checkbox header for selection
export function TableCheckboxHeader({ checked, onCheckedChange }: CheckboxHeaderProps) {
  return (
    <StandardTableHeaderCell className="w-10">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
      />
    </StandardTableHeaderCell>
  );
}

// Empty action header
export function EmptyActionHeader({ className = "w-[120px]" }: ActionHeaderProps) {
  return (
    <StandardTableHeaderCell className={`text-right ${className}`}>
      <span className="sr-only">Acties</span>
    </StandardTableHeaderCell>
  );
}

// Cell for checkbox selection
export function TableCheckboxCell({ checked, onCheckedChange }: CheckboxHeaderProps) {
  return (
    <StandardTableCell>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
      />
    </StandardTableCell>
  );
}

// Cell for actions (right aligned)
export function TableActionCell({ children }: { children: React.ReactNode }) {
  return (
    <StandardTableCell className="text-right">
      {children}
    </StandardTableCell>
  );
}