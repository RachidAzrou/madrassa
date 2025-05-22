import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { useMobile } from "@/hooks/use-mobile";

type MainLayoutProps = {
  children: React.ReactNode;
};

const getPageTitle = (path: string): string => {
  switch (path) {
    case "/":
      return "Dashboard";
    case "/students":
      return "Student Management";
    case "/courses":
      return "Course Management";
    case "/programs":
      return "Program Management";
    case "/calendar":
      return "Academic Calendar";
    case "/attendance":
      return "Attendance Tracking";
    case "/grading":
      return "Grading System";
    case "/reports":
      return "Reports";
    default:
      return "myMadrassa";
  }
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();
  const pageTitle = getPageTitle(location);

  // Close sidebar on location change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Open sidebar by default on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for both mobile and desktop */}
      <div 
        className={`fixed md:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-30 transition duration-200 ease-in-out h-screen flex-shrink-0`}
      >
        <Sidebar 
          isMobile={isMobile} 
          onClose={() => setSidebarOpen(false)} 
          className="h-full" />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden bg-gray-50">
        <Header onMenuClick={toggleSidebar} title={pageTitle} />
        <main className="flex-1 p-2 sm:p-4 md:p-6 pt-10 overflow-x-auto overflow-y-auto border-l border-gray-200" style={{ height: "calc(100vh - 64px)", minHeight: "600px" }}>
          <div className="max-w-7xl mx-auto w-full min-h-[400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
