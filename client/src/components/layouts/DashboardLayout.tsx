import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ListChecks, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  BarChartHorizontal, 
  FileBox, 
  GraduationCap, 
  Menu, 
  Search, 
  LogOut 
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <li>
      <Link href={href}>
        <a className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
          {icon}
          <span className="ml-3">{children}</span>
        </a>
      </Link>
    </li>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on mobile when clicking outside
  const handleOutsideClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Navigation items with their routes and icons
  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/students", label: "Students", icon: <Users className="mr-3 h-5 w-5" /> },
    { path: "/courses", label: "Courses", icon: <BookOpen className="mr-3 h-5 w-5" /> },
    { path: "/programs", label: "Programs", icon: <ListChecks className="mr-3 h-5 w-5" /> },
    { path: "/calendar", label: "Calendar", icon: <CalendarIcon className="mr-3 h-5 w-5" /> },
    { path: "/attendance", label: "Attendance", icon: <ClipboardList className="mr-3 h-5 w-5" /> },
    { path: "/grading", label: "Grading", icon: <BarChartHorizontal className="mr-3 h-5 w-5" /> },
    { path: "/reports", label: "Reports", icon: <FileBox className="mr-3 h-5 w-5" /> },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile header */}
      <header className="bg-white md:hidden border-b border-gray-200 fixed w-full z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={toggleSidebar} 
            className="text-gray-500 hover:text-primary focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Avatar size="sm" initials="AU" />
            <span className="text-sm font-medium text-gray-800">Admin</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-primary rounded p-1.5 mr-2">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-800">EduManage</span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1.5">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path} 
                  href={item.path} 
                  icon={item.icon}
                  isActive={location === item.path}
                >
                  {item.label}
                </NavItem>
              ))}
            </ul>
          </nav>
          
          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Avatar size="md" initials="AU" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">admin@edumanage.com</p>
              </div>
              <button className="ml-auto text-gray-400 hover:text-gray-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleOutsideClick}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-14 md:pt-0 md:ml-64 min-h-screen transition-all duration-300 ease-in-out`}>
        {/* Search Bar for Desktop */}
        <div className="bg-white shadow-sm p-4 hidden md:block">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Academic Year:</span>
              <select className="text-sm bg-white border border-gray-300 rounded px-2 py-1">
                <option>2023-2024</option>
                <option>2022-2023</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white mt-auto border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">© 2023 EduManage. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-primary text-sm">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-primary text-sm">Help Center</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
