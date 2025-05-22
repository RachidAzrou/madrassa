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
import React, { createContext } from "react";

// Eenvoudigere AuthContext
export const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  user: null as any,
});

// Auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [, navigate] = useLocation();
  
  // Check token bij het laden
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        setIsAuthenticated(true);
        const userRole = localStorage.getItem("user_role") || "USER";
        const userName = localStorage.getItem("user_name") || "Gebruiker";
        setUser({ role: userRole, name: userName });
      }
    };
    
    checkAuth();
  }, []);
  
  const login = () => {
    localStorage.setItem("auth_token", "admin_token");
    localStorage.setItem("user_role", "ADMIN");
    localStorage.setItem("user_name", "Admin");
    setIsAuthenticated(true);
    setUser({ role: "ADMIN", name: "Admin" });
    navigate("/");
  };
  
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hoofdapplicatie routes
function AppRoutes() {
  const { isAuthenticated } = React.useContext(AuthContext);
  const [location] = useLocation();
  const [, navigate] = useLocation();
  
  // Redirect naar login als niet geauthenticeerd
  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      navigate("/login");
    }
  }, [isAuthenticated, location, navigate]);
  
  // Als we op login pagina zijn maar al geauthenticeerd, ga naar dashboard
  useEffect(() => {
    if (isAuthenticated && location === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, location, navigate]);
  
  if (!isAuthenticated && location !== "/login") {
    return null;
  }
  
  if (location === "/login") {
    return <Login />;
  }
  
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

// Main App component
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
