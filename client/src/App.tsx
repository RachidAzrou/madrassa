import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Courses from "@/pages/Courses";
import Programs from "@/pages/Programs";
import Calendar from "@/pages/Calendar";
import Attendance from "@/pages/Attendance";
import Grading from "@/pages/Grading";
import Reports from "@/pages/Reports";
import Guardians from "@/pages/Guardians";
import Admissions from "@/pages/Admissions";
import StudentGroups from "@/pages/StudentGroups";
import Enrollments from "@/pages/Enrollments";
import Scheduling from "@/pages/Scheduling";
import Fees from "@/pages/Fees";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/guardians" component={Guardians} />
        <Route path="/admissions" component={Admissions} />
        <Route path="/student-groups" component={StudentGroups} />
        <Route path="/courses" component={Courses} />
        <Route path="/programs" component={Programs} />
        <Route path="/enrollments" component={Enrollments} />
        <Route path="/scheduling" component={Scheduling} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/grading" component={Grading} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
