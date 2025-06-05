import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/useRBAC";
import { RESOURCES } from "../../../shared/rbac";
import { Topbar } from "@/components/layout/topbar";
import {
  Home,
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  ClipboardList,
  Bell,
  Search,
  BarChart3,
  BookOpen,
  UserCheck,
  DollarSign
} from "lucide-react";

interface SecretariatLayoutProps {
  children: React.ReactNode;
}

export default function SecretariatLayout({ children }: SecretariatLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { canRead, canManage } = useRBAC();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items with RBAC filtering
  const allNavigationItems = [
    {
      name: "Dashboard",
      href: "/secretariat",
      icon: Home,
      current: location === "/secretariat",
      resource: RESOURCES.DASHBOARD
    },
    {
      name: "Studentenbeheer",
      href: "/secretariat/students",
      icon: Users,
      current: location === "/secretariat/students",
      resource: RESOURCES.STUDENTS
    },
    {
      name: "Voogdenbeheer",
      href: "/secretariat/guardians",
      icon: UserPlus,
      current: location === "/secretariat/guardians",
      resource: RESOURCES.GUARDIANS
    },
    {
      name: "Docentenbeheer",
      href: "/secretariat/teachers",
      icon: UserCheck,
      current: location === "/secretariat/teachers",
      resource: RESOURCES.TEACHERS
    },
    {
      name: "Klassenbeheer",
      href: "/secretariat/classes",
      icon: GraduationCap,
      current: location === "/secretariat/classes",
      resource: RESOURCES.CLASSES
    },
    {
      name: "Cursussen",
      href: "/secretariat/courses",
      icon: BookOpen,
      current: location === "/secretariat/courses",
      resource: RESOURCES.COURSES
    },
    {
      name: "Roosterbeheer",
      href: "/secretariat/schedule",
      icon: Calendar,
      current: location === "/secretariat/schedule",
      resource: RESOURCES.CLASSES
    },
    {
      name: "Betalingsbeheer",
      href: "/secretariat/payments",
      icon: CreditCard,
      current: location === "/secretariat/payments",
      resource: RESOURCES.PAYMENTS
    },
    {
      name: "Rapporten",
      href: "/secretariat/reports",
      icon: BarChart3,
      current: location === "/secretariat/reports",
      resource: RESOURCES.REPORTS
    },
    {
      name: "Communicatie",
      href: "/secretariat/communication",
      icon: MessageSquare,
      current: location === "/secretariat/communication",
      resource: RESOURCES.COMMUNICATIONS
    }
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigationItems.filter(item => 
    canRead(item.resource)
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Full Height */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-purple-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-violet-600 font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-white">myMadrassa</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-violet-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-b from-violet-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 mb-2">{user?.email}</p>
              <Badge variant="secondary" className="bg-violet-100 text-violet-800 border-violet-200 text-xs">
                Secretariaat
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Flex Grow */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
            Hoofdmenu
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                  item.current
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700 hover:transform hover:scale-105'
                }`}>
                  <Icon className={`mr-4 h-5 w-5 transition-colors ${
                    item.current ? 'text-white' : 'text-gray-400 group-hover:text-violet-600'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings & Logout Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-violet-600 hover:bg-violet-50 transition-all"
            >
              <Settings className="mr-3 h-5 w-5" />
              Instellingen
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Afmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content - Full Height */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}