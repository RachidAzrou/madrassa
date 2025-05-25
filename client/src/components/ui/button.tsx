import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium tracking-tight ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/95 shadow-sm",
        outline:
          "border border-input bg-background hover:bg-secondary hover:border-secondary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        ghost: "hover:bg-secondary",
        link: "text-[#1e3a8a] underline-offset-4 hover:underline",
        action: "text-[#1e3a8a] hover:bg-secondary hover:text-[#1e3a8a]/90 font-medium",
        success: "bg-success text-success-foreground hover:bg-success/95 shadow-sm",
        warning: "bg-warning text-warning-foreground hover:bg-warning/95 shadow-sm",
        info: "bg-info text-info-foreground hover:bg-info/95 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-10 rounded px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
