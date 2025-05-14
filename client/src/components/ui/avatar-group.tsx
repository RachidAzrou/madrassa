import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    image?: string;
    fallback: string;
    alt?: string;
  }>;
  limit?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({
  items,
  limit = 3,
  size = "md",
  className,
  ...props
}: AvatarGroupProps) {
  const displayedItems = items.slice(0, limit);
  const extraItems = Math.max(items.length - limit, 0);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8 text-xs";
      case "lg":
        return "h-12 w-12 text-base";
      case "md":
      default:
        return "h-10 w-10 text-sm";
    }
  };

  const getGroupClasses = () => {
    switch (size) {
      case "sm":
        return "-space-x-3";
      case "lg":
        return "-space-x-5";
      case "md":
      default:
        return "-space-x-4";
    }
  };

  return (
    <div
      className={cn("flex items-center", getGroupClasses(), className)}
      {...props}
    >
      {displayedItems.map((item, index) => (
        <Avatar
          key={index}
          className={cn(
            getSizeClasses(),
            "border-2 border-background",
            index > 0 ? "ring-0" : ""
          )}
        >
          {item.image && <AvatarImage src={item.image} alt={item.alt || ""} />}
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            {item.fallback}
          </AvatarFallback>
        </Avatar>
      ))}

      {extraItems > 0 && (
        <div
          className={cn(
            getSizeClasses(),
            "bg-muted flex items-center justify-center rounded-full border-2 border-background text-muted-foreground font-medium"
          )}
        >
          +{extraItems}
        </div>
      )}
    </div>
  );
}
