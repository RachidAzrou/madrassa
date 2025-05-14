import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, ListTodo, FileText, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatsProps {
  className?: string;
}

interface StatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  loading?: boolean;
}

const Stat = ({ title, value, icon, change, loading = false }: StatProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-semibold mt-1">{value}</p>
            )}
          </div>
          <div className="bg-primary/10 p-3 rounded-full text-primary">
            {icon}
          </div>
        </div>
        {change && !loading && (
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm flex items-center ${
                change.trend === "up"
                  ? "text-green-600"
                  : change.trend === "down"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {change.trend === "up" ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : change.trend === "down" ? (
                <TrendingDown className="mr-1 h-4 w-4" />
              ) : null}
              {change.value}
            </span>
            <span className="text-muted-foreground text-xs ml-2">
              from last semester
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardStats({ className }: DashboardStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <Stat
        title="Total Students"
        value={data?.totalStudents || 0}
        icon={<Users className="h-5 w-5" />}
        change={{ value: "5.2%", trend: "up" }}
        loading={isLoading}
      />
      <Stat
        title="Active Courses"
        value={data?.activeCourses || 0}
        icon={<BookOpen className="h-5 w-5" />}
        change={{ value: "3.1%", trend: "up" }}
        loading={isLoading}
      />
      <Stat
        title="Programs"
        value={data?.totalPrograms || 0}
        icon={<ListTodo className="h-5 w-5" />}
        change={{ value: "0%", trend: "neutral" }}
        loading={isLoading}
      />
      <Stat
        title="Attendance Rate"
        value={`${data?.attendanceRate || 0}%`}
        icon={<FileText className="h-5 w-5" />}
        change={{ value: "1.3%", trend: "down" }}
        loading={isLoading}
      />
    </div>
  );
}
