import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile sidebar (overlay) */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar component */}
      {sidebarOpen && (
        <Sidebar
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen && !isMobile ? "md:ml-64" : ""
        }`}
      >
        <Header onMenuClick={toggleSidebar} title={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-200 bg-white mt-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} <span className="text-gray-600">my</span><span className="text-blue-600">Madrassa</span>. Alle rechten voorbehouden.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-primary">
                Privacybeleid
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary">
                Gebruiksvoorwaarden
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary">
                Hulp
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
