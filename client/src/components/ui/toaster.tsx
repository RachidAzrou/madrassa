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
        // Bepaal het icoon en styling op basis van de variant
        let Icon = Info
        let iconColorClass = "bg-blue-100 text-blue-600"
        
        if (variant === "destructive") {
          Icon = XCircle
          iconColorClass = "bg-red-100 text-red-600"
        } else if (variant === "success") {
          Icon = CheckCircle2
          iconColorClass = "bg-green-100 text-green-600"
        } else if (variant === "warning") {
          Icon = AlertTriangle
          iconColorClass = "bg-yellow-100 text-yellow-600"
        }

        return (
          <Toast key={id} variant={variant} {...props} className="py-3 px-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0 mr-3">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                {title && <ToastTitle className="text-sm font-semibold text-white leading-tight">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs text-white/90 mt-0.5">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute opacity-70 hover:opacity-100 right-2 top-2 rounded-full bg-white/20 hover:bg-white/30 p-1 transition-colors text-white" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
