import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
// Import nieuw logo
import myMadrassaLogo from "../../assets/mymadrassa-new.png";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserRound,
  UserCheck,
  BookOpen,
  BookText,
  Calendar,
  ClipboardCheck,
  Percent,
  BarChart3,
  LogOut,
  Menu,
  X,
  Building,
  CreditCard,
  UserPlus,
  Settings,
  School,
  Glasses,
  FileText,
  Clock,
  Coins,
  BookMarked,
  MessageSquare,
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
          "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer",
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
  const [userData, setUserData] = useState<any>(null);
  
  // Gebruiker data uit localStorage ophalen of standaard data gebruiken
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Fout bij het parsen van gebruikersdata:', error);
        // Fallback naar demo data als er een fout is
        setUserData({
          firstName: "Ahmed",
          lastName: "Hassan",
          role: "Administrator"
        });
      }
    } else {
      // Demo data als er geen gebruiker is opgeslagen
      setUserData({
        firstName: "Ahmed",
        lastName: "Hassan",
        role: "Administrator"
      });
    }
  }, []);

  // Sidebar is always expanded, no need to adjust on resize
  useEffect(() => {
    setExpanded(true); // Always keep the sidebar expanded
  }, []);

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
        "w-64 flex flex-col", /* Slightly increased width */
        isMobile ? "shadow-xl" : "", /* Add shadow on mobile */
        className
      )}
    >
      {/* Mobile header with close button */}
      {isMobile && (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <img src={myMadrassaLogo} alt="myMadrassa Logo" className="h-12" />
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}

      
      {/* Dashboard link */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="bg-gray-50 rounded-md overflow-hidden">
          <Link href="/">
            <div
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer",
                location === "/"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:text-primary hover:bg-gray-100"
              )}
            >
              <div className="flex-shrink-0">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="truncate whitespace-nowrap">Dashboard</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Navigation links */}
      <nav className="flex flex-col flex-1">
        <div className="flex-1 py-2 px-3 overflow-y-auto">
          <div className="space-y-4">
            <div className="pt-2">
              <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Beheer
              </p>
              <div className="space-y-1.5">
                <SidebarLink
                  href="/students"
                  icon={<Users className="h-4 w-4" />}
                  label="Studenten"
                  isActive={location.startsWith("/students")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/guardians"
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Voogden"
                  isActive={location.startsWith("/guardians")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/teachers"
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Docenten"
                  isActive={location.startsWith("/teachers")}
                  onClick={handleLinkClick}
                />

                <SidebarLink
                  href="/admissions"
                  icon={<FileText className="h-4 w-4" />}
                  label="Aanmeldingen"
                  isActive={location.startsWith("/admissions")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/student-groups"
                  icon={<ChalkBoard className="h-4 w-4" />}
                  label="Klassen"
                  isActive={location.startsWith("/student-groups")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/rooms"
                  icon={<Building className="h-4 w-4" />}
                  label="Lokalen Beheer"
                  isActive={location.startsWith("/rooms")}
                  onClick={handleLinkClick}
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Onderwijs
              </p>
              <div className="space-y-1.5">
                <SidebarLink
                  href="/courses"
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Curriculum"
                  isActive={location.startsWith("/courses")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/programs"
                  icon={<BookText className="h-4 w-4" />}
                  label="Vakken"
                  isActive={location.startsWith("/programs")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/scheduling"
                  icon={<Clock className="h-4 w-4" />}
                  label="Rooster"
                  isActive={location.startsWith("/scheduling")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/calendar"
                  icon={<Calendar className="h-4 w-4" />}
                  label="Kalender"
                  isActive={location.startsWith("/calendar")}
                  onClick={handleLinkClick}
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Evaluatie
              </p>
              <div className="space-y-1.5">
                <SidebarLink
                  href="/attendance"
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  label="Aanwezigheid"
                  isActive={location.startsWith("/attendance")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/grading"
                  icon={<Percent className="h-4 w-4" />}
                  label="Cijfers"
                  isActive={location.startsWith("/grading")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/reports"
                  icon={<BookMarked className="h-4 w-4" />}
                  label="Rapport"
                  isActive={location.startsWith("/reports")}
                  onClick={handleLinkClick}
                />
                <SidebarLink
                  href="/fees"
                  icon={<Coins className="h-4 w-4" />}
                  label="Betalingsbeheer"
                  isActive={location.startsWith("/fees")}
                  onClick={handleLinkClick}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Afmelden knop aan einde van de sidebar */}
        <div className="px-3 mt-auto border-t border-gray-200 py-4 bg-white w-full">
          <div
            onClick={() => {
              // Verwijder authenticatie gegevens
              localStorage.removeItem("isAuthenticated");
              localStorage.removeItem("user");
              // Direct naar login pagina navigeren
              window.location.href = "/login";
              if (onClose) onClose();
            }}
            className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <div className="flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="truncate whitespace-nowrap font-medium">Afmelden</span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
