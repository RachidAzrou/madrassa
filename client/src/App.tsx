import { useState, useEffect } from "react";
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

// Context voor authenticatie
import React, { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, navigate] = useLocation();
  
  // Check bij laden van de applicatie of er een token is
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      navigate("/login");
    }
  }, [navigate]);
  
  const login = () => {
    localStorage.setItem("auth_token", "dummy_token");
    setIsAuthenticated(true);
    navigate("/");
  };
  
  const logout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    navigate("/login");
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  return isAuthenticated ? <Component {...rest} /> : null;
}

function AppRoutes() {
  const { isAuthenticated, login } = React.useContext(AuthContext);
  const [location] = useLocation();
  
  // Als we op de login pagina zijn, toon alleen de login component
  if (location === "/login") {
    return <Login onLoginSuccess={login} />;
  }
  
  // Anders, toon de beveiligde routes
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/students" component={() => <ProtectedRoute component={Students} />} />
        <Route path="/guardians" component={() => <ProtectedRoute component={Guardians} />} />
        <Route path="/teachers" component={() => <ProtectedRoute component={Teachers} />} />
        <Route path="/admissions" component={() => <ProtectedRoute component={Admissions} />} />
        <Route path="/student-groups" component={() => <ProtectedRoute component={StudentGroups} />} />
        <Route path="/courses" component={() => <ProtectedRoute component={Courses} />} />
        <Route path="/programs" component={() => <ProtectedRoute component={Programs} />} />
        <Route path="/scheduling" component={() => <ProtectedRoute component={Scheduling} />} />
        <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
        <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} />} />
        <Route path="/grading" component={() => <ProtectedRoute component={Cijfers} />} />
        <Route path="/fees" component={() => <ProtectedRoute component={Fees} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/mijn-account" component={() => <ProtectedRoute component={MyAccount} />} />
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
        <AuthProvider>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/:rest*" component={AppRoutes} />
          </Switch>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
