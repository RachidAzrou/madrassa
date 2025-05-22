import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import MobileHeader from "./mobile-header";
import { useMobile } from "@/hooks/useMobile";

type ResponsiveLayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
};

const ResponsiveLayout = ({ children, pageTitle }: ResponsiveLayoutProps) => {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sluit sidebar wanneer schermgrootte verandert
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Voorkom scrollen van de body wanneer mobiele sidebar open is
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar - altijd zichtbaar op grote schermen */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobiele sidebar overlay - alleen zichtbaar wanneer geopend */}
      {isMobile && sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar 
              isMobile={true} 
              onClose={() => setSidebarOpen(false)} 
            />
          </div>
        </>
      )}

      {/* Hoofdinhoud */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobiele header met menu knop */}
        <MobileHeader 
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        {/* Inhoud van de pagina */}
        <main className="flex-1 overflow-y-auto border-l border-gray-200 bg-white lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;