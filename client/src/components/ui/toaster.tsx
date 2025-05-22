import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Bepaal het icoon op basis van de variant
        let Icon = Info
        if (variant === "destructive") Icon = XCircle
        else if (variant === "success") Icon = CheckCircle2 
        else if (variant === "warning") Icon = AlertTriangle
        else if (variant === "info") Icon = Info

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="grid gap-1">
                {title && <ToastTitle className="text-base font-semibold leading-none tracking-tight">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90 mt-1">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute opacity-70 hover:opacity-100 right-2 top-2 rounded-full bg-white/40 p-1" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
