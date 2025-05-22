import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  className = "" 
}) => {
  return (
    <div className={`h-48 flex flex-col items-center justify-center text-gray-500 ${className}`}>
      <div className="text-[#1e3a8a] mb-2">
        <Icon className="h-12 w-12 mx-auto opacity-30" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
          {description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;