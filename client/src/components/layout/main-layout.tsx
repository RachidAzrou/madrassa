import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import TestBanner from "./test-banner";
import { Topbar } from "./topbar";
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

  // Toggle sidebar based on mobile or desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Topbar - volledig boven alles */}
      <div className="w-full z-40">
        <Topbar onMenuClick={toggleSidebar} />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - conditionally visible on mobile */}
        <div className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'static z-30 h-[calc(100vh-3rem)] flex-shrink-0'
        }`}>
          <Sidebar 
            className="h-full" 
            isMobile={isMobile} 
            onClose={() => setSidebarOpen(false)} 
          />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
          <main className="flex-1 p-2 sm:p-4 md:p-6 pt-10 overflow-x-auto overflow-y-auto border-l border-gray-200">
            <div className="max-w-7xl mx-auto w-full min-h-full pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
