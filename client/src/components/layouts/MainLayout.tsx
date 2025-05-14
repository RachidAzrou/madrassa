import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  GraduationCap,
  Menu,
  UserCircle,
  LayoutDashboard,
  Users,
  BookOpen,
  ListTodo,
  CalendarDays,
  FileText,
  BarChart,
  FileBarChart,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [location, isMobile]);

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
      active: location === "/" || location === "/dashboard",
    },
    {
      label: "Students",
      icon: <Users className="h-5 w-5" />,
      href: "/students",
      active: location === "/students",
    },
    {
      label: "Courses",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/courses",
      active: location === "/courses",
    },
    {
      label: "Programs",
      icon: <ListTodo className="h-5 w-5" />,
      href: "/programs",
      active: location === "/programs",
    },
    {
      label: "Calendar",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/calendar",
      active: location === "/calendar",
    },
    {
      label: "Attendance",
      icon: <FileText className="h-5 w-5" />,
      href: "/attendance",
      active: location === "/attendance",
    },
    {
      label: "Grading",
      icon: <BarChart className="h-5 w-5" />,
      href: "/grading",
      active: location === "/grading",
    },
    {
      label: "Reports",
      icon: <FileBarChart className="h-5 w-5" />,
      href: "/reports",
      active: location === "/reports",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-30 flex items-center justify-between px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">EduManage</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b flex items-center">
            <div className="bg-primary p-1.5 rounded mr-2 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">EduManage</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg",
                        item.active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="border-t p-4">
            <div className="flex items-center">
              <UserCircle className="h-10 w-10 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@edumanage.com</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Log out</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0 md:ml-64 min-h-screen flex flex-col">
        <div className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-background border-t py-4 px-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground text-sm">
              &copy; 2023 EduManage. All rights reserved.
            </p>
            <div className="flex justify-center md:justify-end space-x-4 mt-2 md:mt-0">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Terms of Service
              </a>
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
