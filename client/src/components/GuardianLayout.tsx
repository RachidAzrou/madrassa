import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  CreditCard,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";

interface GuardianLayoutProps {
  children: React.ReactNode;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
}

export default function GuardianLayout({ children }: GuardianLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Fetch guardian's children
  const { data: childrenData } = useQuery<{ children: Child[] }>({
    queryKey: ['/api/guardian/children'],
    retry: false,
  });

  const children_list = childrenData?.children || [];
  const selectedChild = children_list.find(child => child.id.toString() === selectedChildId);

  // Auto-select first child if none selected
  useEffect(() => {
    if (children_list.length > 0 && !selectedChildId) {
      setSelectedChildId(children_list[0].id.toString());
    }
  }, [children_list, selectedChildId]);

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: location === "/",
      disabled: !selectedChild
    },
    ...(children_list.length > 1 ? [{
      name: "Mijn Kinderen",
      href: "/guardian/children",
      icon: Users,
      current: location === "/guardian/children",
      disabled: false
    }] : []),
    {
      name: `${selectedChild ? selectedChild.firstName : 'Kind'} - Aanwezigheid`,
      href: "/guardian/attendance",
      icon: ClipboardList,
      current: location === "/guardian/attendance",
      disabled: !selectedChild
    },
    {
      name: `${selectedChild ? selectedChild.firstName : 'Kind'} - Cijfers`,
      href: "/guardian/grades",
      icon: GraduationCap,
      current: location === "/guardian/grades",
      disabled: !selectedChild
    },
    {
      name: `${selectedChild ? selectedChild.firstName : 'Kind'} - Rapport`,
      href: "/guardian/reports",
      icon: FileText,
      current: location === "/guardian/reports",
      disabled: !selectedChild
    },
    {
      name: `${selectedChild ? selectedChild.firstName : 'Kind'} - Dossier`,
      href: "/guardian/student-file",
      icon: BookOpen,
      current: location === "/guardian/student-file",
      disabled: !selectedChild
    },
    {
      name: "Betalingen",
      href: "/guardian/payments",
      icon: CreditCard,
      current: location === "/guardian/payments",
      disabled: false
    }
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo and close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">myMadrassa</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  Voogd
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Child selection */}
        {children_list.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Selecteer kind:
            </label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kies een kind" />
              </SelectTrigger>
              <SelectContent>
                {children_list.map((child) => (
                  <SelectItem key={child.id} value={child.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{child.firstName} {child.lastName}</span>
                      <span className="text-sm text-gray-500">({child.class})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChild && (
              <div className="mt-2 text-sm text-gray-600">
                Student ID: {selectedChild.studentId} • Klas: {selectedChild.class}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.disabled ? "#" : item.href}>
                <a className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed'
                    : item.current
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                }`}>
                  <Icon className={`mr-3 h-5 w-5 ${
                    item.disabled
                      ? 'text-gray-300'
                      : item.current 
                        ? 'text-purple-600' 
                        : 'text-gray-400 group-hover:text-purple-600'
                  }`} />
                  <span className="truncate">{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Afmelden
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-semibold text-gray-900">myMadrassa</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children_list.length === 0 ? (
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen kinderen gevonden</h3>
                <p className="text-gray-600">
                  Er zijn geen kinderen gekoppeld aan dit account. Neem contact op met de school om uw kinderen te koppelen.
                </p>
              </div>
            </div>
          ) : !selectedChild ? (
            <div className="p-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een kind</h3>
                <p className="text-gray-600">
                  Kies een kind uit de lijst om de informatie te bekijken.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}