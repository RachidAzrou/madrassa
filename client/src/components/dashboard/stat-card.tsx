import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    label: string;
    isPositive: boolean | null;
  };
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-full text-primary">
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            <span 
              className={cn(
                "text-sm flex items-center",
                trend.isPositive === true && "text-green-600",
                trend.isPositive === false && "text-red-600",
                trend.isPositive === null && "text-muted-foreground"
              )}
            >
              {trend.isPositive === true && <ArrowUpIcon className="mr-1 h-4 w-4" />}
              {trend.isPositive === false && <ArrowDownIcon className="mr-1 h-4 w-4" />}
              {trend.isPositive === null && <ArrowRightIcon className="mr-1 h-4 w-4" />}
              {trend.value}
            </span>
            <span className="text-muted-foreground text-xs ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
