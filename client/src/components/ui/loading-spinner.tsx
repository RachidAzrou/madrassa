import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md",
  className = ""
}) => {
  const sizeClass = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`animate-spin rounded-full border-t-transparent border-primary ${sizeClass[size]} ${className}`}></div>
  );
};

export default LoadingSpinner;