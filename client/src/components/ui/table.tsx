import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { 
    variant?: "default" | "compact" | "dense" | "bordered" | "striped",
    containerClassName?: string
  }
>(({ className, variant = "default", containerClassName, ...props }, ref) => {
  const variantClasses = {
    default: "w-full caption-bottom text-sm border border-border",
    compact: "w-full caption-bottom text-xs border border-border",
    dense: "w-full caption-bottom text-xs border border-border [&_td]:py-1 [&_th]:py-1 [&_td]:px-2 [&_th]:px-2",
    bordered: "w-full caption-bottom text-sm border border-border [&_td]:border [&_th]:border",
    striped: "w-full caption-bottom text-sm border border-border [&_tr:nth-child(even)]:bg-muted/40",
  };
  
  return (
    <div className={cn("relative w-full overflow-auto rounded", containerClassName)}>
      <table
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    </div>
  );
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky = false, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "[&_tr]:border-b bg-secondary/70",
      sticky && "sticky top-0 z-10",
      className
    )} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky = false, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-secondary/70 font-medium [&>tr]:last:border-b-0",
      sticky && "sticky bottom-0 z-10",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { active?: boolean }
>(({ className, active = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-secondary/30 data-[state=selected]:bg-secondary/50",
      active && "bg-secondary/40",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { nowrap?: boolean }
>(({ className, nowrap = false, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-3 text-left align-middle font-medium text-foreground/80 [&:has([role=checkbox])]:pr-0",
      nowrap && "whitespace-nowrap",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { 
    nowrap?: boolean, 
    truncate?: boolean, 
    monospace?: boolean
  }
>(({ className, nowrap = false, truncate = false, monospace = false, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle [&:has([role=checkbox])]:pr-0", 
      nowrap && "whitespace-nowrap",
      truncate && "max-w-[220px] truncate",
      monospace && "font-mono text-xs",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-3 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
