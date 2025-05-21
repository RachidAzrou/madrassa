import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  changeValue?: number;
  changeText?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  changeValue = 0, 
  changeText = "from last semester", 
  className 
}: StatCardProps) {
  // Determine trend icon and color
  const getTrendDetails = () => {
    if (changeValue > 0) {
      return {
        icon: <ArrowUpIcon className="mr-1 h-3 w-3" />,
        color: 'text-green-500'
      };
    } else if (changeValue < 0) {
      return {
        icon: <ArrowDownIcon className="mr-1 h-3 w-3" />,
        color: 'text-red-500'
      };
    } else {
      return {
        icon: <MinusIcon className="mr-1 h-3 w-3" />,
        color: 'text-gray-400'
      };
    }
  };

  const { icon: trendIcon, color: trendColor } = getTrendDetails();

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={cn("text-sm flex items-center", trendColor)}>
          {trendIcon}
          {Math.abs(changeValue)}%
        </span>
        <span className="text-gray-500 text-xs ml-2">{changeText}</span>
      </div>
    </div>
  );
}
