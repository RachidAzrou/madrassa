import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
// Import nieuw logo
import myMadrassaLogo from "../../assets/mymadrassa-new.png";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  BookText,
  Calendar,
  ClipboardCheck,
  Percent,
  BarChart3,
  LogOut,
  Menu,
  X,
  CreditCard,
  UserPlus,
  Settings,
  School,
  Glasses,
  FileText,
  Clock,
  Coins,
  BookMarked,
} from "lucide-react";

// Aangepast ChalkboardTeacher icoon
const ChalkBoard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="14" rx="2" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="18" y1="12" x2="18" y2="20" />
    <ellipse cx="12" cy="18" rx="3" ry="2" />
    <path d="M10 4h4" />
    <path d="M8 8h8" />
  </svg>
);
// Logo import already at the top

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

const SidebarLink = ({ href, icon, label, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer",
          isActive
            ? "bg-primary text-white font-medium"
            : "text-gray-600 hover:text-primary hover:bg-gray-100"
        )}
      >
        <div className="flex-shrink-0">
          {icon}
        </div>
        <span className="truncate whitespace-nowrap">{label}</span>
      </div>
    </Link>
  );
};

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
};

const Sidebar = ({ isMobile = false, onClose, className = "" }: SidebarProps) => {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(!isMobile);

  // Adjust sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setExpanded(true);
      } else if (isMobile) {
        setExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Handle click on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-gray-200",
        "w-64 flex flex-col",
        className
      )}
    >
      {/* Logo and header */}
      <div className="flex items-center justify-center px-2 py-4 border-b border-gray-200">
        <Link href="/">
          <div className="w-full flex items-center justify-center">
            <img 
              src={myMadrassaLogo} 
              alt="myMadrassa Logo" 
              className="w-full object-contain" 
              style={{ maxHeight: "60px" }}
            />
            <span className="sr-only">myMadrassa</span>
          </div>
        </Link>
        {isMobile && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-4">
          {/* Ingelogde gebruiker informatie */}
          <div className="pt-1 pb-3">
            <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ingelogd als
            </p>
            <div className="bg-blue-50 rounded-md p-3 mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <span className="font-semibold">JD</span>
                </div>
                <div>
                  <div className="font-medium">Beheerder</div>
                  <div className="text-xs text-gray-500">admin@mymadrassa.nl</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <SidebarLink
              href="/"
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Dashboard"
              isActive={location === "/"}
              onClick={handleLinkClick}
            />
          </div>

          <div className="pt-2">
            <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Studentenbeheer
            </p>
            <div className="space-y-1.5">
              <SidebarLink
                href="/students"
                icon={<Users className="h-5 w-5" />}
                label="Studenten"
                isActive={location.startsWith("/students")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/guardians"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path>
                </svg>}
                label="Voogden"
                isActive={location.startsWith("/guardians")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/teachers"
                icon={<GraduationCap className="h-5 w-5" />}
                label="Docenten"
                isActive={location.startsWith("/teachers")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/admissions"
                icon={<FileText className="h-5 w-5" />}
                label="Aanmeldingen"
                isActive={location.startsWith("/admissions")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/student-groups"
                icon={<ChalkBoard className="h-5 w-5" />}
                label="Klassen"
                isActive={location.startsWith("/student-groups")}
                onClick={handleLinkClick}
              />
            </div>
          </div>

          <div className="pt-2">
            <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Academisch
            </p>
            <div className="space-y-1.5">
              <SidebarLink
                href="/courses"
                icon={<BookOpen className="h-5 w-5" />}
                label="Curriculum"
                isActive={location.startsWith("/courses")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/programs"
                icon={<BookText className="h-5 w-5" />}
                label="Vakken"
                isActive={location.startsWith("/programs")}
                onClick={handleLinkClick}
              />

              <SidebarLink
                href="/scheduling"
                icon={<Clock className="h-5 w-5" />}
                label="Planning"
                isActive={location.startsWith("/scheduling")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/calendar"
                icon={<Calendar className="h-5 w-5" />}
                label="Kalender"
                isActive={location.startsWith("/calendar")}
                onClick={handleLinkClick}
              />
            </div>
          </div>

          <div className="pt-2">
            <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Hulpmiddelen
            </p>
            <div className="space-y-1.5">
              <SidebarLink
                href="/attendance"
                icon={<ClipboardCheck className="h-5 w-5" />}
                label="Aanwezigheid"
                isActive={location.startsWith("/attendance")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/grading"
                icon={<Percent className="h-5 w-5" />}
                label="Cijfers"
                isActive={location.startsWith("/grading")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/reports"
                icon={<BookMarked className="h-5 w-5" />}
                label="Rapport"
                isActive={location.startsWith("/reports")}
                onClick={handleLinkClick}
              />
              <SidebarLink
                href="/fees"
                icon={<Coins className="h-5 w-5" />}
                label="Betalingsbeheer"
                isActive={location.startsWith("/fees")}
                onClick={handleLinkClick}
              />
            </div>
          </div>

          <div className="pt-2">
            <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Systeem
            </p>
            <div className="space-y-1.5">
              <SidebarLink
                href="/settings"
                icon={<Settings className="h-5 w-5" />}
                label="Instellingen"
                isActive={location.startsWith("/settings")}
                onClick={handleLinkClick}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <span className="font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">Beheerder</p>
            <p className="text-xs text-gray-500 truncate">admin@mymadrassa.nl</p>
          </div>
          <button className="p-1.5 rounded text-gray-500 hover:bg-gray-100">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
