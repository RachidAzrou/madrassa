import { Switch, Route, useLocation, useRouter } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "./contexts/NotificationContext";
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

// Authentication check route component
function AuthenticatedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);
  
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
        <Route path="/student-groups" component={() => <AuthenticatedRoute component={StudentGroups} />} />
        <Route path="/courses" component={() => <AuthenticatedRoute component={Courses} />} />
        <Route path="/programs" component={() => <AuthenticatedRoute component={Programs} />} />
        <Route path="/planning" component={() => <AuthenticatedRoute component={Planning} />} />
        <Route path="/rooms" component={() => <AuthenticatedRoute component={Rooms} />} />
        <Route path="/calendar" component={() => <AuthenticatedRoute component={Calendar} />} />
        <Route path="/attendance" component={() => <AuthenticatedRoute component={Attendance} />} />
        <Route path="/grading" component={() => <AuthenticatedRoute component={Cijfers} />} />
        <Route path="/fees" component={() => <AuthenticatedRoute component={Fees} />} />
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
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
