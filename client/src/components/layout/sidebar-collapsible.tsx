import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
// Import nieuw logo
import myMadrassaLogo from "../../assets/mymadrassa-new.png";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  BookText,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Percent,
  LogOut,
  Building,
  Clock,
  Coins,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Aangepast ChalkboardTeacher icoon
export const ChalkBoard = (props: any) => (
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

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  collapsed?: boolean;
};

const SidebarLink = ({ href, icon, label, isActive, onClick, collapsed = false }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer rounded-sm",
          isActive
            ? "bg-blue-50 text-blue-800 font-medium"
            : "text-gray-700 hover:text-blue-700 hover:bg-blue-50/50"
        )}
        title={collapsed ? label : undefined}
      >
        <div className="flex-shrink-0">
          {icon}
        </div>
        {!collapsed && (
          <span className="truncate whitespace-nowrap">{label}</span>
        )}
      </div>
    </Link>
  );
};

type SectionHeaderProps = {
  title: string;
  collapsed?: boolean;
};

const SectionHeader = ({ title, collapsed = false }: SectionHeaderProps) => (
  <div className="flex items-center mb-1 px-2">
    <div className="h-px bg-gray-300 flex-grow mr-2"></div>
    {!collapsed && (
      <p className="text-xs font-medium text-gray-600 tracking-wide uppercase">
        {title}
      </p>
    )}
    <div className="h-px bg-gray-300 flex-grow ml-2"></div>
  </div>
);

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
  defaultCollapsed?: boolean;
};

const Sidebar = ({ isMobile = false, onClose, className = "", defaultCollapsed = false }: SidebarProps) => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
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

  // Controleer of eerder ingestelde sidebar status is opgeslagen
  useEffect(() => {
    const storedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (storedCollapsed !== null) {
      setCollapsed(storedCollapsed === 'true');
    }
  }, []);

  // Update localStorage wanneer sidebar status verandert
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  // Adjust sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle click on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={cn("h-screen", className)}>
      <div 
        className={cn(
          "flex flex-col h-full bg-white border-r border-gray-200 shadow-md transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Toggle button for collapsing/expanding sidebar */}
        <div className="flex justify-end items-center h-12 px-2 border-b border-gray-200">
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            title={collapsed ? "Uitvouwen" : "Invouwen"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Navigation links - scrollable section */}
        <div className="flex-1 overflow-auto py-2 px-2">
          <div className="space-y-3">
            <div className="pt-1">
              <Link href="/">
                <div
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors cursor-pointer mb-3",
                    location === "/"
                      ? "bg-blue-50 text-blue-800 font-medium rounded-sm"
                      : "text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 rounded-sm"
                  )}
                  title={collapsed ? "Dashboard" : undefined}
                >
                  <div className="flex-shrink-0">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  {!collapsed && (
                    <span className="truncate whitespace-nowrap">Dashboard</span>
                  )}
                </div>
              </Link>
              
              <SectionHeader title="Beheer" collapsed={collapsed} />
              
              <div className="space-y-0.5">
                <SidebarLink
                  href="/students"
                  icon={<Users className="h-4.5 w-4.5" />}
                  label="Studenten"
                  isActive={location.startsWith("/students")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/guardians"
                  icon={<UserCheck className="h-4.5 w-4.5" />}
                  label="Voogden"
                  isActive={location.startsWith("/guardians")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/teachers"
                  icon={<GraduationCap className="h-4.5 w-4.5" />}
                  label="Docenten"
                  isActive={location.startsWith("/teachers")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />

                <SidebarLink
                  href="/student-groups"
                  icon={<ChalkBoard className="h-4.5 w-4.5" />}
                  label="Klassen"
                  isActive={location.startsWith("/student-groups")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/rooms"
                  icon={<Building className="h-4.5 w-4.5" />}
                  label="Lokalen"
                  isActive={location.startsWith("/rooms")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
              </div>
            </div>

            <div className="pt-1">
              <SectionHeader title="Onderwijs" collapsed={collapsed} />
              <div className="space-y-0.5">
                <SidebarLink
                  href="/courses"
                  icon={<BookOpen className="h-4.5 w-4.5" />}
                  label="Curriculum"
                  isActive={location.startsWith("/courses")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/programs"
                  icon={<BookText className="h-4.5 w-4.5" />}
                  label="Vakken"
                  isActive={location.startsWith("/programs")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/scheduling"
                  icon={<Clock className="h-4.5 w-4.5" />}
                  label="Planning"
                  isActive={location.startsWith("/scheduling")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/calendar"
                  icon={<Calendar className="h-4.5 w-4.5" />}
                  label="Kalender"
                  isActive={location.startsWith("/calendar")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
              </div>
            </div>

            <div className="pt-1">
              <SectionHeader title="Evaluatie" collapsed={collapsed} />
              <div className="space-y-0.5">
                <SidebarLink
                  href="/attendance"
                  icon={<ClipboardCheck className="h-4.5 w-4.5" />}
                  label="Aanwezigheid"
                  isActive={location.startsWith("/attendance")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/grading"
                  icon={<Percent className="h-4.5 w-4.5" />}
                  label="Cijfers"
                  isActive={location.startsWith("/grading")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/reports"
                  icon={<BookMarked className="h-4.5 w-4.5" />}
                  label="Rapport"
                  isActive={location.startsWith("/reports")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
                <SidebarLink
                  href="/fees"
                  icon={<Coins className="h-4.5 w-4.5" />}
                  label="Betalingsbeheer"
                  isActive={location.startsWith("/fees")}
                  onClick={handleLinkClick}
                  collapsed={collapsed}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Afmelden knop aan einde van de sidebar - fixed */}
        <div className="px-3 border-t border-gray-300 py-3 bg-gray-50">
          <div
            onClick={() => {
              // Verwijder authenticatie gegevens
              localStorage.removeItem("isAuthenticated");
              localStorage.removeItem("user");
              // Direct naar login pagina navigeren
              window.location.href = "/login";
              if (onClose) onClose();
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors cursor-pointer rounded-sm text-gray-700 hover:text-red-600 hover:bg-red-50/50"
          >
            <div className="flex-shrink-0">
              <LogOut className="h-4.5 w-4.5" />
            </div>
            {!collapsed && (
              <span className="truncate whitespace-nowrap">Afmelden</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;