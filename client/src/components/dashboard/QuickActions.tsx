import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  UserPlus,
  BookPlus,
  FileText,
  BarChart,
  FileBarChart,
  CalendarPlus,
} from "lucide-react";

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className }: QuickActionsProps) {
  const actions = [
    {
      icon: <UserPlus className="h-6 w-6 text-primary" />,
      title: "Add Student",
      href: "/students",
    },
    {
      icon: <BookPlus className="h-6 w-6 text-primary" />,
      title: "Add Course",
      href: "/courses",
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Take Attendance",
      href: "/attendance",
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary" />,
      title: "Enter Grades",
      href: "/grading",
    },
    {
      icon: <FileBarChart className="h-6 w-6 text-primary" />,
      title: "Generate Report",
      href: "/reports",
    },
    {
      icon: <CalendarPlus className="h-6 w-6 text-primary" />,
      title: "Schedule Event",
      href: "/calendar",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                {action.icon}
                <span className="text-sm mt-2">{action.title}</span>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
