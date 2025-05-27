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
import SuperAdmin from "@/pages/SuperAdmin";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import Scholen from "@/pages/Scholen";

import Settings from "@/pages/Settings";

// Get user role from localStorage
function getUserRole() {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.role || 'directeur'; // Default to directeur for backward compatibility
    } catch {
      return 'directeur';
    }
  }
  return 'directeur';
}

// Role-based route component
function RoleBasedRoute({ component: Component, allowedRoles, ...rest }: any) {
  const [, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = getUserRole();
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    
    // Check if user has permission for this route
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'superadmin':
          setLocation("/superadmin");
          break;
        case 'docent':
          setLocation("/teacher-dashboard");
          break;
        case 'student':
          setLocation("/student-dashboard");
          break;
        case 'ouder':
          setLocation("/parent-dashboard");
          break;
        default:
          setLocation("/"); // Default dashboard for directeur
      }
    }
  }, [isAuthenticated, userRole, allowedRoles, setLocation]);
  
  return isAuthenticated && (!allowedRoles || allowedRoles.includes(userRole)) ? 
    <Component {...rest} /> : null;
}

// Authentication check route component (for backward compatibility)
function AuthenticatedRoute({ component: Component, ...rest }: any) {
  return <RoleBasedRoute component={Component} allowedRoles={['superadmin', 'directeur', 'docent', 'student', 'ouder']} {...rest} />;
}

// Authenticated Routes
function AuthenticatedRouter() {
  return (
    <MainLayout>
      <Switch>
        {/* Role-specific dashboards */}
        <Route path="/superadmin" component={() => <RoleBasedRoute component={SuperAdmin} allowedRoles={['superadmin']} />} />
        <Route path="/teacher-dashboard" component={() => <RoleBasedRoute component={TeacherDashboard} allowedRoles={['docent']} />} />
        <Route path="/student-dashboard" component={() => <RoleBasedRoute component={StudentDashboard} allowedRoles={['student']} />} />
        <Route path="/parent-dashboard" component={() => <RoleBasedRoute component={ParentDashboard} allowedRoles={['ouder']} />} />
        
        {/* Default dashboard (directeur gets the main dashboard) */}
        <Route path="/" component={() => <RoleBasedRoute component={Dashboard} allowedRoles={['directeur']} />} />
        <Route path="/dashboard" component={() => <RoleBasedRoute component={Dashboard} allowedRoles={['directeur']} />} />
        
        {/* Directeur and admin only routes */}
        <Route path="/students" component={() => <RoleBasedRoute component={Students} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/guardians" component={() => <RoleBasedRoute component={Guardians} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/teachers" component={() => <RoleBasedRoute component={Teachers} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/admissions" component={() => <RoleBasedRoute component={Admissions} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/student-groups" component={() => <RoleBasedRoute component={StudentGroups} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/courses" component={() => <RoleBasedRoute component={Courses} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/programs" component={() => <RoleBasedRoute component={Programs} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/planning" component={() => <RoleBasedRoute component={Planning} allowedRoles={['superadmin', 'directeur']} />} />
        <Route path="/rooms" component={() => <RoleBasedRoute component={Rooms} allowedRoles={['superadmin', 'directeur']} />} />
        
        {/* Calendar - accessible by multiple roles */}
        <Route path="/calendar" component={() => <RoleBasedRoute component={Calendar} allowedRoles={['superadmin', 'directeur', 'docent']} />} />
        
        {/* Evaluation tools - accessible by directeur and docent */}
        <Route path="/attendance" component={() => <RoleBasedRoute component={Attendance} allowedRoles={['directeur', 'docent']} />} />
        <Route path="/grading" component={() => <RoleBasedRoute component={Cijfers} allowedRoles={['directeur', 'docent']} />} />
        <Route path="/student-dossier" component={() => <RoleBasedRoute component={StudentDossier} allowedRoles={['directeur', 'docent']} />} />
        <Route path="/reports" component={() => <RoleBasedRoute component={Reports} allowedRoles={['directeur', 'docent']} />} />
        
        {/* Financial management - directeur only */}
        <Route path="/fees" component={() => <RoleBasedRoute component={Fees} allowedRoles={['directeur']} />} />
        
        {/* Settings and admin tools */}
        <Route path="/settings" component={() => <RoleBasedRoute component={Settings} allowedRoles={['superadmin', 'directeur']} />} />
        
        {/* Communication tools - accessible by most roles */}
        <Route path="/notifications" component={() => <RoleBasedRoute component={Notifications} allowedRoles={['superadmin', 'directeur', 'docent', 'student', 'ouder']} />} />
        <Route path="/messages" component={() => <RoleBasedRoute component={Messages} allowedRoles={['superadmin', 'directeur', 'docent', 'student', 'ouder']} />} />
        
        {/* Account management - accessible by all authenticated users */}
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
