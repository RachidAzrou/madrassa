import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DataTableContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataTableContainer.displayName = "DataTableContainer";

export const TableContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
TableContainer.displayName = "TableContainer";

export const CardContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardContainer.displayName = "CardContainer";

export const ContentContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ContentContainer.displayName = "ContentContainer";