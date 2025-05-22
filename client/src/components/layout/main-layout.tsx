import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { useMobile } from "@/hooks/useMobile";

type MainLayoutProps = {
  children: React.ReactNode;
};

const getPageTitle = (path: string): string => {
  switch (path) {
    case "/":
      return "Dashboard";
    case "/students":
      return "Studenten";
    case "/guardians":
      return "Voogden";
    case "/teachers":
      return "Docenten";
    case "/courses":
      return "Curriculum";
    case "/programs":
      return "Vakken";
    case "/calendar":
      return "Kalender";
    case "/attendance":
      return "Aanwezigheid";
    case "/grading":
      return "Cijfers";
    case "/reports":
      return "Rapport";
    case "/fees":
      return "Betalingsbeheer";
    case "/admissions":
      return "Aanmeldingen";
    case "/student-groups":
      return "Klassen";
    case "/scheduling":
      return "Planning";
    case "/settings":
      return "Instellingen";
    case "/mijn-account":
      return "Mijn Account";
    default:
      return "myMadrassa";
  }
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();
  const pageTitle = getPageTitle(location);

  // Voorkom scrollen van body wanneer mobiele sidebar open is
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, sidebarOpen]);

  // Sluit sidebar bij navigatie op mobiel
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Standaard sidebar open op desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Overlay backdrop voor mobiel */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - vast op desktop, zwevend op mobiel */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-50 transition duration-200 ease-in-out lg:h-screen flex-shrink-0`}
      >
        <Sidebar 
          isMobile={isMobile} 
          onClose={() => setSidebarOpen(false)} 
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full h-screen overflow-hidden">
        <Header onMenuClick={toggleSidebar} title={pageTitle} />
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto border-l border-gray-200 bg-white">
          <div className="w-full mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
