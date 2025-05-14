import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, BookOpen, CalendarPlus, FileBarChart, FileCheck, FileSpreadsheet } from "lucide-react";

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/students">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <UserPlus className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Add Student</span>
            </a>
          </Link>
          
          <Link href="/courses">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Add Course</span>
            </a>
          </Link>
          
          <Link href="/attendance">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <FileCheck className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Take Attendance</span>
            </a>
          </Link>
          
          <Link href="/grading">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <FileBarChart className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Enter Grades</span>
            </a>
          </Link>
          
          <Link href="/reports">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <FileSpreadsheet className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Generate Report</span>
            </a>
          </Link>
          
          <Link href="/calendar">
            <a className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              <CalendarPlus className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Schedule Event</span>
            </a>
          </Link>
        </div>
        
        <div className="mt-6">
          <h2 className="font-semibold text-sm mb-3">Campus Highlights</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted h-24 flex items-center justify-center text-muted-foreground text-xs">
              Campus Image 1
            </div>
            <div className="rounded-lg bg-muted h-24 flex items-center justify-center text-muted-foreground text-xs">
              Campus Image 2
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
