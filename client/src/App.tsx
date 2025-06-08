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
// Students import removed - using role-specific components
import Courses from "@/pages/Courses";
import Programs from "@/pages/Programs";
import Calendar from "@/pages/Calendar";
import Attendance from "@/pages/Attendance";
import Cijfers from "@/pages/Cijfers";
import Reports from "@/pages/Reports";
import Guardians from "@/pages/Guardians";
import Teachers from "@/pages/Teachers";

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
import TeacherLayout from "@/components/TeacherLayout";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherStudents from "@/pages/teacher/TeacherStudents";
import StudentLayout from "@/components/StudentLayout";
import StudentDashboard from "@/pages/student/StudentDashboard";
import GuardianLayout from "@/components/GuardianLayout";
import GuardianDashboard from "@/pages/guardian/GuardianDashboard";
import SecretariatLayout from "@/components/SecretariatLayout";
import SecretariatDashboard from "@/pages/secretariat/SecretariatDashboard";
import Admissions from "@/pages/secretariat/Admissions";
import SecretariatStudents from "@/pages/secretariat/Students";
import SecretariatGuardians from "@/pages/secretariat/Guardians";
import SecretariatPayments from "@/pages/secretariat/Payments";
import SecretariatCommunications from "@/pages/secretariat/Communications";
import DemoPayment from "@/pages/DemoPayment";
import PaymentSuccess from "@/pages/PaymentSuccess";

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

// Role-based Authenticated Routes
function AuthenticatedRouter() {
  const { user } = useAuth();
  
  // Secretariat routes
  if (user?.role === 'secretariat') {
    return (
      <SecretariatLayout>
        <Switch>
          <Route path="/secretariat" component={() => <AuthenticatedRoute component={SecretariatDashboard} />} />
          <Route path="/" component={() => <AuthenticatedRoute component={SecretariatDashboard} />} />
          <Route path="/secretariat/students" component={() => <AuthenticatedRoute component={SecretariatStudents} />} />
          <Route path="/secretariat/guardians" component={() => <AuthenticatedRoute component={SecretariatGuardians} />} />
          <Route path="/secretariat/teachers" component={() => <AuthenticatedRoute component={Teachers} />} />
          <Route path="/secretariat/classes" component={() => <AuthenticatedRoute component={StudentGroups} />} />
          <Route path="/secretariat/courses" component={() => <AuthenticatedRoute component={Courses} />} />
          <Route path="/secretariat/schedule" component={() => <AuthenticatedRoute component={Calendar} />} />
          <Route path="/secretariat/payments" component={() => <AuthenticatedRoute component={SecretariatPayments} />} />
          <Route path="/secretariat/reports" component={() => <AuthenticatedRoute component={Reports} />} />
          <Route path="/secretariat/communication" component={() => <AuthenticatedRoute component={SecretariatCommunications} />} />
          <Route path="/secretariat/admissions" component={() => <AuthenticatedRoute component={Admissions} />} />
          <Route path="/notifications" component={() => <AuthenticatedRoute component={Notifications} />} />
          <Route path="/messages" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/mijn-account" component={() => <AuthenticatedRoute component={MyAccount} />} />
          <Route component={NotFound} />
        </Switch>
      </SecretariatLayout>
    );
  }

  // Guardian routes
  if (user?.role === 'guardian') {
    return (
      <GuardianLayout>
        <Switch>
          <Route path="/" component={() => <AuthenticatedRoute component={Dashboard} />} />
          <Route path="/guardian/children" component={() => <AuthenticatedRoute component={SecretariatStudents} />} />
          <Route path="/guardian/attendance" component={() => <AuthenticatedRoute component={Attendance} />} />
          <Route path="/guardian/grades" component={() => <AuthenticatedRoute component={Cijfers} />} />
          <Route path="/guardian/reports" component={() => <AuthenticatedRoute component={Reports} />} />
          <Route path="/guardian/communications" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/guardian/payments" component={() => <AuthenticatedRoute component={Fees} />} />
          <Route path="/notifications" component={() => <AuthenticatedRoute component={Notifications} />} />
          <Route path="/messages" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/mijn-account" component={() => <AuthenticatedRoute component={MyAccount} />} />
          <Route component={NotFound} />
        </Switch>
      </GuardianLayout>
    );
  }

  // Student routes
  if (user?.role === 'student') {
    return (
      <StudentLayout>
        <Switch>
          <Route path="/" component={() => <AuthenticatedRoute component={StudentDashboard} />} />
          <Route path="/student/class" component={() => <AuthenticatedRoute component={SecretariatStudents} />} />
          <Route path="/student/teachers" component={() => <AuthenticatedRoute component={Teachers} />} />
          <Route path="/student/subjects" component={() => <AuthenticatedRoute component={Courses} />} />
          <Route path="/student/attendance" component={() => <AuthenticatedRoute component={Attendance} />} />
          <Route path="/student/reports" component={() => <AuthenticatedRoute component={Reports} />} />
          <Route path="/student/grades" component={() => <AuthenticatedRoute component={Cijfers} />} />
          <Route path="/notifications" component={() => <AuthenticatedRoute component={Notifications} />} />
          <Route path="/messages" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/mijn-account" component={() => <AuthenticatedRoute component={MyAccount} />} />
          <Route component={NotFound} />
        </Switch>
      </StudentLayout>
    );
  }
  
  // Teacher routes
  if (user?.role === 'teacher') {
    return (
      <TeacherLayout>
        <Switch>
          <Route path="/" component={() => <AuthenticatedRoute component={TeacherDashboard} />} />
          <Route path="/teacher" component={() => <AuthenticatedRoute component={TeacherDashboard} />} />
          <Route path="/teacher/students" component={() => <AuthenticatedRoute component={TeacherStudents} />} />
          <Route path="/teacher/classes" component={() => <AuthenticatedRoute component={Classes} />} />
          <Route path="/teacher/calendar" component={() => <AuthenticatedRoute component={Calendar} />} />
          <Route path="/teacher/subjects" component={() => <AuthenticatedRoute component={Courses} />} />
          <Route path="/teacher/attendance" component={() => <AuthenticatedRoute component={Attendance} />} />
          <Route path="/teacher/grades" component={() => <AuthenticatedRoute component={Cijfers} />} />
          <Route path="/teacher/communications" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/teacher/reports" component={() => <AuthenticatedRoute component={Reports} />} />
          <Route path="/notifications" component={() => <AuthenticatedRoute component={Notifications} />} />
          <Route path="/messages" component={() => <AuthenticatedRoute component={Messages} />} />
          <Route path="/mijn-account" component={() => <AuthenticatedRoute component={MyAccount} />} />
          <Route component={NotFound} />
        </Switch>
      </TeacherLayout>
    );
  }
  
  // Admin and other roles - default layout
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <AuthenticatedRoute component={Dashboard} />} />
        <Route path="/dashboard" component={() => <AuthenticatedRoute component={Dashboard} />} />
        <Route path="/students" component={() => <AuthenticatedRoute component={SecretariatStudents} />} />
        <Route path="/guardians" component={() => <AuthenticatedRoute component={Guardians} />} />
        <Route path="/teachers" component={() => <AuthenticatedRoute component={Teachers} />} />

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
        <Route path="/profile" component={() => <AuthenticatedRoute component={Profile} />} />
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
      <Route path="/demo-payment" component={DemoPayment} />
      <Route path="/payment-success" component={PaymentSuccess} />
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
