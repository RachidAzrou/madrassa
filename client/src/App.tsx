import { Switch, Route, useLocation } from "wouter";
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
import Cijfers from "@/pages/Cijfers";
import Reports from "@/pages/Reports";
import Guardians from "@/pages/Guardians";
import Teachers from "@/pages/Teachers";
import Admissions from "@/pages/Admissions";
import StudentGroups from "@/pages/StudentGroups";
import MyAccount from "@/pages/MyAccount";
import Login from "@/pages/Login";

import Scheduling from "@/pages/Scheduling";
import Fees from "@/pages/Fees";
import Settings from "@/pages/Settings";
import { useState, useEffect } from "react";

function AuthenticatedRouter() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/guardians" component={Guardians} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/admissions" component={Admissions} />
        <Route path="/student-groups" component={StudentGroups} />
        <Route path="/courses" component={Courses} />
        <Route path="/programs" component={Programs} />

        <Route path="/scheduling" component={Scheduling} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/grading" component={Cijfers} />
        <Route path="/fees" component={Fees} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/mijn-account" component={MyAccount} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  // Voor demo doeleinden, in productie zou je dit met een echte auth check implementeren
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Controleer of er een login route is, zo niet we zijn automatisch ingelogd 
    // Dit is alleen voor demo doeleinden
    if (location === "/login") {
      setIsAuthenticated(false);
    } else {
      // Controleer als er een login token is, anders blijf niet-ingelogd
      const hasToken = localStorage.getItem("auth_token");
      
      // Voor demo purposes, we simuleren een token
      if (location === "/") {
        setIsAuthenticated(true);
      }
    }
  }, [location]);

  // Login functie voor de Login component
  const handleLogin = () => {
    localStorage.setItem("auth_token", "demo_token");
    setIsAuthenticated(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/login">
            <Login onLoginSuccess={handleLogin} />
          </Route>
          <Route>
            {isAuthenticated ? <AuthenticatedRouter /> : <Login onLoginSuccess={handleLogin} />}
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
