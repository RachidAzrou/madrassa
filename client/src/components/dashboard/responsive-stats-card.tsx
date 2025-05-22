import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMobile } from "@/hooks/useMobile";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

export function ResponsiveStatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend 
}: StatsCardProps) {
  const isMobile = useMobile();

  return (
    <Card className="overflow-hidden">
      <CardContent className={`flex ${isMobile ? 'flex-row items-center' : 'flex-col'} p-5`}>
        <div className={`${isMobile ? 'mr-4' : 'mb-4'} flex-shrink-0`}>
          <div className="bg-blue-900/10 rounded-full p-3 text-blue-900">
            {icon}
          </div>
        </div>
        
        <div className={`${isMobile ? 'flex-1' : 'w-full'}`}>
          <h3 className="font-medium text-sm text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {value}
            </p>
            {trend && (
              <p className={`ml-2 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}% <span className="text-gray-500">{trend.label}</span>
              </p>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}