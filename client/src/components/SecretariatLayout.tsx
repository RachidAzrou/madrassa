import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  School,
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Settings, 
  LogOut, 
  X, 
  Home,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecretariatLayoutProps {
  children: React.ReactNode;
}

export default function SecretariatLayout({ children }: SecretariatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Define all navigation items with their RBAC resources
  const allNavigationItems = [
    {
      name: 'Studentenbeheer',
      href: '/secretariat/students',
      icon: Users,
      current: location.startsWith('/secretariat/students'),
      resource: 'student' as const
    },
    {
      name: 'Voogdenbeheer',
      href: '/secretariat/guardians',
      icon: UserCheck,
      current: location.startsWith('/secretariat/guardians'),
      resource: 'guardian' as const
    },
    {
      name: 'Docentenbeheer',
      href: '/secretariat/teachers',
      icon: GraduationCap,
      current: location.startsWith('/secretariat/teachers'),
      resource: 'teacher' as const
    },
    {
      name: 'Klassenbeheer',
      href: '/secretariat/classes',
      icon: School,
      current: location.startsWith('/secretariat/classes'),
      resource: 'class' as const
    },
    {
      name: 'Cursussen',
      href: '/secretariat/courses',
      icon: BookOpen,
      current: location.startsWith('/secretariat/courses'),
      resource: 'course' as const
    },
    {
      name: 'Roosterbeheer',
      href: '/secretariat/schedule',
      icon: Calendar,
      current: location.startsWith('/secretariat/schedule'),
      resource: 'schedule' as const
    },
    {
      name: 'Rapporten',
      href: '/secretariat/reports',
      icon: BarChart3,
      current: location.startsWith('/secretariat/reports'),
      resource: 'report' as const
    },
    {
      name: 'Betalingsbeheer',
      href: '/secretariat/payments',
      icon: CreditCard,
      current: location.startsWith('/secretariat/payments'),
      resource: 'payment' as const
    },
    {
      name: 'Communicatie',
      href: '/secretariat/communications',
      icon: MessageSquare,
      current: location.startsWith('/secretariat/communications'),
      resource: 'communication' as const
    },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigationItems.filter(item => 
    canRead(user?.role || 'guest', item.resource)
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Full Width */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      <div className="flex pt-16">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Admin Style */}
        <div className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col border-r border-gray-200`}>
          
          {/* Mobile header with close button */}
          <div className="lg:hidden p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
                <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                  location === "/secretariat"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                }`}>
                  <div className="flex-shrink-0">
                    <Home className={`h-4 w-4 transition-colors ${
                      location === "/secretariat" ? 'text-white' : 'text-gray-400 hover:text-blue-600'
                    }`} />
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
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
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
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
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
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
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
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
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
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
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
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                <div className="flex-shrink-0">
                  <Settings className="h-4 w-4 transition-colors text-gray-400 hover:text-blue-600" />
                </div>
                <span className="truncate whitespace-nowrap">Instellingen</span>
              </div>
              <div
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <div className="flex-shrink-0">
                  <LogOut className="h-4 w-4 transition-colors text-gray-400 hover:text-red-600" />
                </div>
                <span className="truncate whitespace-nowrap">Afmelden</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Page Content - Full Height */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}