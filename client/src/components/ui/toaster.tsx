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
        let iconColor = "text-[#1e3a8a]"
        
        if (variant === "destructive") {
          Icon = XCircle
          iconColor = "text-red-600"
        } else if (variant === "success") {
          Icon = CheckCircle2
          iconColor = "text-green-600"
        } else if (variant === "warning") {
          Icon = AlertTriangle
          iconColor = "text-amber-500"
        } else if (variant === "info") {
          Icon = Info
          iconColor = "text-[#1e3a8a]"
        }

        return (
          <Toast key={id} variant={variant} {...props} className="py-3 px-4">
            <div className="flex items-start w-full">
              <div className="flex-shrink-0 mr-3">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 pt-0.5">
                {title && <ToastTitle className="text-sm font-medium text-gray-900 leading-tight">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs text-gray-600 mt-0.5">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute opacity-70 hover:opacity-100 right-2 top-2 rounded-full bg-gray-200 hover:bg-gray-300 p-1 transition-colors" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
