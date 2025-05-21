import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    image?: string
    fallback: string
  }[]
  limit?: number
}

export function AvatarGroup({
  items,
  limit = 4,
  className,
  ...props
}: AvatarGroupProps) {
  const itemsToShow = items.slice(0, limit)
  const overflowCount = items.length - limit
  
  return (
    <div
      className={cn("flex flex-row-reverse items-center justify-end -space-x-2", className)}
      {...props}
    >
      {overflowCount > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background">
          +{overflowCount}
        </div>
      )}
      
      {itemsToShow.map((item, index) => (
        <Avatar
          key={index}
          className="ring-2 ring-background"
        >
          {item.image && <AvatarImage src={item.image} alt="" />}
          <AvatarFallback>{item.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
