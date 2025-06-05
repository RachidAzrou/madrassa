import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Upload, Plus } from "lucide-react";

interface AdminPageLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main admin page layout container with consistent padding and background
 */
export function AdminPageLayout({ children, className = "" }: AdminPageLayoutProps) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Admin page header with title, description and action buttons
 */
export function AdminPageHeader({ title, description, children, className = "" }: AdminPageHeaderProps) {
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-2">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}

interface AdminStatsGridProps {
  children: ReactNode;
  columns?: number;
  className?: string;
}

/**
 * Admin stats cards grid layout
 */
export function AdminStatsGrid({ children, columns = 4, className = "" }: AdminStatsGridProps) {
  const gridClass: Record<number, string> = {
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
    7: "grid-cols-1 md:grid-cols-3 lg:grid-cols-7"
  };

  return (
    <div className={`grid ${gridClass[columns] || gridClass[4]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  valueColor?: string;
  className?: string;
}

/**
 * Admin stats card component
 */
export function AdminStatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  valueColor = "text-gray-900",
  className = "" 
}: AdminStatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface AdminActionButtonProps {
  variant?: 'primary' | 'outline';
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Admin action button with consistent styling
 */
export function AdminActionButton({ 
  variant = 'primary', 
  icon, 
  children, 
  onClick, 
  className = "",
  disabled = false
}: AdminActionButtonProps) {
  const baseClasses = variant === 'primary' 
    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
    : "border-gray-300 bg-white hover:bg-gray-50";

  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      variant={variant === 'outline' ? 'outline' : 'default'}
    >
      {icon && <span className="w-4 h-4 mr-2">{icon}</span>}
      {children}
    </Button>
  );
}

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  className?: string;
}

/**
 * Admin search and filter bar
 */
export function AdminSearchBar({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Zoeken...", 
  filters,
  className = ""
}: AdminSearchBarProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filters}
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminTableCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Admin table card wrapper
 */
export function AdminTableCard({ title, subtitle, children, className = "" }: AdminTableCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

/**
 * Admin filter select component
 */
export function AdminFilterSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  options,
  className = ""
}: AdminFilterSelectProps) {
  return (
    <div className={`w-full sm:w-48 ${className}`}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Admin avatar component with blue gradient
 */
export function AdminAvatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <div className={`w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-sm font-medium text-white">
        {initials}
      </span>
    </div>
  );
}

/**
 * Admin action button group for table rows
 */
interface AdminActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function AdminActionButtons({ 
  onView, 
  onEdit, 
  onDelete, 
  canEdit = true, 
  canDelete = true,
  className = ""
}: AdminActionButtonsProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {onView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
      {onEdit && canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
        >
          <Filter className="h-4 w-4" />
        </Button>
      )}
      {onDelete && canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}