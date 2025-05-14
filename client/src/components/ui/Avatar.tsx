import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ 
  src, 
  alt = "Avatar", 
  initials, 
  size = "md", 
  className 
}: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className
        )} 
      />
    );
  }

  return (
    <div className={cn(
      "rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold",
      sizeClasses[size],
      className
    )}>
      {initials || alt.charAt(0).toUpperCase()}
    </div>
  );
}
