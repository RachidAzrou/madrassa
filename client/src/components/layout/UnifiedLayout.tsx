import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import { Topbar } from "./topbar";
import { useMobile } from "@/hooks/use-mobile";

type UnifiedLayoutProps = {
  children: React.ReactNode;
  userRole: string;
};

const UnifiedLayout = ({ children, userRole }: UnifiedLayoutProps) => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

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

export default UnifiedLayout;
export { UnifiedLayout };