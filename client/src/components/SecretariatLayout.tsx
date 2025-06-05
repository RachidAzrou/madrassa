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

      {/* Sidebar - Admin Style */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col border-r border-gray-200`}>
        
        {/* Mobile header with close button */}
        <div className="lg:hidden p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-gray-900">myMadrassa</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-100">
          <div className="bg-gray-50 rounded-md overflow-hidden">
            <Link href="/secretariat">
              <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                location === "/secretariat"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:text-primary hover:bg-gray-100"
              }`}>
                <div className="flex-shrink-0">
                  <Home className="h-4 w-4" />
                </div>
                <span className="truncate whitespace-nowrap">Dashboard</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col flex-1">
          <div className="flex-1 py-2 px-3 overflow-y-auto">
            <div className="space-y-4">
              <div className="pt-2">
                <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Beheer
                </p>
                <div className="space-y-1.5">
                  {navigation
                    .filter(item => ['Studentenbeheer', 'Voogdenbeheer', 'Docentenbeheer', 'Klassenbeheer'].includes(item.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            item.current
                              ? "bg-primary text-white font-medium"
                              : "text-gray-600 hover:text-primary hover:bg-gray-100"
                          }`}>
                            <div className="flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Onderwijs
                </p>
                <div className="space-y-1.5">
                  {navigation
                    .filter(item => ['Cursussen', 'Roosterbeheer'].includes(item.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            item.current
                              ? "bg-primary text-white font-medium"
                              : "text-gray-600 hover:text-primary hover:bg-gray-100"
                          }`}>
                            <div className="flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Evaluatie
                </p>
                <div className="space-y-1.5">
                  {navigation
                    .filter(item => ['Rapporten'].includes(item.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            item.current
                              ? "bg-primary text-white font-medium"
                              : "text-gray-600 hover:text-primary hover:bg-gray-100"
                          }`}>
                            <div className="flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Financiën
                </p>
                <div className="space-y-1.5">
                  {navigation
                    .filter(item => ['Betalingsbeheer'].includes(item.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            item.current
                              ? "bg-primary text-white font-medium"
                              : "text-gray-600 hover:text-primary hover:bg-gray-100"
                          }`}>
                            <div className="flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Communicatie
                </p>
                <div className="space-y-1.5">
                  {navigation
                    .filter(item => ['Communicatie'].includes(item.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            item.current
                              ? "bg-primary text-white font-medium"
                              : "text-gray-600 hover:text-primary hover:bg-gray-100"
                          }`}>
                            <div className="flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Settings & Logout Section */}
        <div className="px-3 border-t border-gray-300 py-3 bg-gray-50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer text-gray-600 hover:text-primary hover:bg-gray-100">
              <div className="flex-shrink-0">
                <Settings className="h-4 w-4" />
              </div>
              <span className="truncate whitespace-nowrap">Instellingen</span>
            </div>
            <div
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <div className="flex-shrink-0">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="truncate whitespace-nowrap">Afmelden</span>
            </div>
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