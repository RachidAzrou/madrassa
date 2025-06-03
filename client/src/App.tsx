import { Switch, Route, useLocation, useRouter } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Courses from "@/pages/Courses";
import Programs from "@/pages/Programs";
import Calendar from "@/pages/Calendar";
import Attendance from "@/pages/Attendance";
import Cijfers from "@/pages/Cijfers";
import Reports from "@/pages/Reports";
import Guardians from "@/pages/Guardians";
import Teachers from "@/pages/Teachers";
import Admissions from "@/pages/Admissions";
import Rooms from "@/pages/Rooms";
import StudentGroups from "@/pages/StudentGroups";
import Notifications from "@/pages/Notifications";
import MyAccount from "@/pages/MyAccount";
import Login from "@/pages/Login";
import Messages from "@/pages/Messages";


import Planning from "@/pages/Planning";
import Fees from "@/pages/Fees";
import StudentDossier from "@/pages/StudentDossier";
import Profile from "@/pages/Profile";
import ReEnrollment from "@/pages/ReEnrollment";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import Accounts from "@/pages/Accounts";

// Authentication wrapper with RBAC
function AuthenticatedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Component {...rest} /> : null;
}

// Authenticated Routes
function AuthenticatedRouter() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <AuthenticatedRoute component={Dashboard} />} />
        <Route path="/dashboard" component={() => <AuthenticatedRoute component={Dashboard} />} />
        <Route path="/students" component={() => <AuthenticatedRoute component={Students} />} />
        <Route path="/guardians" component={() => <AuthenticatedRoute component={Guardians} />} />
        <Route path="/teachers" component={() => <AuthenticatedRoute component={Teachers} />} />
        <Route path="/admissions" component={() => <AuthenticatedRoute component={Admissions} />} />
        <Route path="/academic-year-management" component={() => <AuthenticatedRoute component={AcademicYearManagement} />} />
        <Route path="/accounts" component={() => <AuthenticatedRoute component={Accounts} />} />
        <Route path="/student-groups" component={() => <AuthenticatedRoute component={StudentGroups} />} />
        <Route path="/courses" component={() => <AuthenticatedRoute component={Courses} />} />
        <Route path="/programs" component={() => <AuthenticatedRoute component={Programs} />} />
        <Route path="/planning" component={() => <AuthenticatedRoute component={Planning} />} />
        <Route path="/rooms" component={() => <AuthenticatedRoute component={Rooms} />} />
        <Route path="/calendar" component={() => <AuthenticatedRoute component={Calendar} />} />
        <Route path="/attendance" component={() => <AuthenticatedRoute component={Attendance} />} />
        <Route path="/grading" component={() => <AuthenticatedRoute component={Cijfers} />} />
        <Route path="/fees" component={() => <AuthenticatedRoute component={Fees} />} />
        <Route path="/re-enrollment" component={() => <AuthenticatedRoute component={ReEnrollment} />} />
        <Route path="/student-dossier" component={() => <AuthenticatedRoute component={StudentDossier} />} />

        <Route path="/reports" component={() => <AuthenticatedRoute component={Reports} />} />
        <Route path="/profiel" component={() => <AuthenticatedRoute component={Profile} />} />
        <Route path="/notifications" component={() => <AuthenticatedRoute component={Notifications} />} />
        <Route path="/messages" component={() => <AuthenticatedRoute component={Messages} />} />
        <Route path="/mijn-account" component={() => <AuthenticatedRoute component={MyAccount} />} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AuthenticatedRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
