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
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="h-48 w-48 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Icon className="h-24 w-24 text-blue-300 opacity-30" />
      </div>
      <h3 className="text-xl font-medium text-gray-700">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
          {description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;