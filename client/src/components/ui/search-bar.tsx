import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outlined" | "filled";
  showClearButton?: boolean;
  disabled?: boolean;
  onClear?: () => void;
  icon?: React.ReactNode;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({
    value,
    onChange,
    placeholder = "Zoeken...",
    className,
    size = "default",
    variant = "default",
    showClearButton = true,
    disabled = false,
    onClear,
    icon,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: "h-8 text-sm",
      default: "h-10 text-sm",
      lg: "h-12 text-base"
    };

    const iconSizes = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5"
    };

    const paddingClasses = {
      sm: showClearButton && value ? "pl-8 pr-8" : "pl-8 pr-3",
      default: showClearButton && value ? "pl-10 pr-10" : "pl-10 pr-4",
      lg: showClearButton && value ? "pl-12 pr-12" : "pl-12 pr-4"
    };

    const variantClasses = {
      default: "border-gray-300 focus:border-blue-500 focus:ring-blue-200",
      outlined: "border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200",
      filled: "bg-gray-100 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-200"
    };

    const handleClear = () => {
      onChange("");
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={cn("relative", className)}>
        {/* Search Icon */}
        <div className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
          size === "sm" && "left-2",
          size === "lg" && "left-4"
        )}>
          {icon || <Search className={iconSizes[size]} />}
        </div>

        {/* Input Field */}
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            paddingClasses[size],
            variantClasses[variant],
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...props}
        />

        {/* Clear Button */}
        {showClearButton && value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full",
              size === "lg" && "right-3 h-8 w-8"
            )}
          >
            <X className={cn(
              "text-gray-400 hover:text-gray-600",
              size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

// Advanced Search Bar with filters
interface AdvancedSearchBarProps extends SearchBarProps {
  filters?: Array<{
    label: string;
    value: string;
    active: boolean;
    onClick: () => void;
  }>;
  resultCount?: number;
  showResultCount?: boolean;
}

export const AdvancedSearchBar = React.forwardRef<HTMLInputElement, AdvancedSearchBarProps>(
  ({
    filters = [],
    resultCount,
    showResultCount = false,
    className,
    ...searchProps
  }, ref) => {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Search Input */}
        <SearchBar ref={ref} {...searchProps} />
        
        {/* Filters and Result Count */}
        {(filters.length > 0 || showResultCount) && (
          <div className="flex items-center justify-between">
            {/* Filter Tags */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter, index) => (
                  <Button
                    key={index}
                    variant={filter.active ? "default" : "outline"}
                    size="sm"
                    onClick={filter.onClick}
                    className={cn(
                      "h-7 px-3 text-xs transition-all",
                      filter.active 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "text-gray-600 hover:text-blue-600 hover:border-blue-300"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Result Count */}
            {showResultCount && typeof resultCount === 'number' && (
              <div className="text-sm text-gray-500">
                {resultCount} {resultCount === 1 ? 'resultaat' : 'resultaten'} gevonden
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

AdvancedSearchBar.displayName = "AdvancedSearchBar";