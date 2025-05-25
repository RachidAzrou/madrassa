"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-100",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "default" | "lg" | "xl" | "full";
    position?: "center" | "top";
    noPadding?: boolean;
  }
>(({ className, children, size = "default", position = "center", noPadding = false, ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw] max-h-[95vh]"
  };
  
  const positionClasses = {
    center: "top-[50%] translate-y-[-50%]",
    top: "top-[5%] translate-y-0"
  };
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] z-50 w-full translate-x-[-50%] gap-0 border border-gray-200 bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98",
          "rounded-sm overflow-hidden flex flex-col",
          noPadding ? "p-0" : "p-0",
          sizeClasses[size],
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "branded" | "subtle" | "premium" }) => {
  const { variant = "default", ...rest } = props;
  
  const variantClasses = {
    default: "bg-background border-b border-border p-4",
    branded: "bg-gradient-to-r from-primary/90 to-primary text-white p-4",
    subtle: "bg-secondary/50 border-b border-border p-4",
    premium: "bg-[#1e40af] text-white p-4"
  };
  
  return (
    <div
      className={cn(
        "flex flex-col space-y-1 mb-0",
        variantClasses[variant as "default" | "branded" | "subtle" | "premium"],
        className
      )}
      {...rest}
    />
  );
}
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 p-4 border-t border-border mt-auto",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-base font-medium leading-tight tracking-tight",
    default: "text-lg font-medium leading-tight tracking-tight",
    lg: "text-xl font-medium leading-tight tracking-tight"
  };
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
