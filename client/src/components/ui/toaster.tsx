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
          <Toast key={id} variant={variant} {...props} className="p-4">
            <div className="flex items-start w-full">
              <div className={`flex-shrink-0 p-1.5 mr-3 rounded-full ${iconColorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 pt-0.5">
                {title && <ToastTitle className="text-base font-semibold text-gray-800 leading-tight mb-1">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm text-gray-600">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute opacity-70 hover:opacity-100 right-3 top-3 rounded-full bg-gray-200/60 hover:bg-gray-200 p-1 transition-colors" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
