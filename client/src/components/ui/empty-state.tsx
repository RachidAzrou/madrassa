import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  className = "",
  action
}) => {
  return (
    <div className={`h-48 flex flex-col items-center justify-center text-gray-500 ${className}`}>
      <div className="text-[#1e3a8a] mb-2">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;