import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "flat" | "outlined" }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "rounded border bg-card text-card-foreground shadow-sm",
    flat: "rounded bg-card text-card-foreground",
    outlined: "rounded border-2 bg-card text-card-foreground"
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1", 
      compact ? "p-3 border-b" : "p-4 md:p-5 border-b", 
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-base font-medium leading-tight tracking-tight",
    default: "text-lg font-medium leading-tight tracking-tight",
    lg: "text-xl font-medium leading-tight tracking-tight"
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean; padded?: boolean }
>(({ className, compact = false, padded = true, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      padded ? (compact ? "p-3 pt-3" : "p-4 md:p-5 pt-4 md:pt-5") : "p-0",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-t", 
      compact ? "p-3" : "p-4 md:p-5",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
