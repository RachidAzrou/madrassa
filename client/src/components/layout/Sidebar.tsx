import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ListChecks,
  Calendar,
  FileText,
  BarChart2,
  FileBarChart,
  LogOut,
  Menu,
  User,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const [location, setLocation] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: Users },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Programs", href: "/programs", icon: ListChecks },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Attendance", href: "/attendance", icon: FileText },
    { name: "Grading", href: "/grading", icon: BarChart2 },
    { name: "Reports", href: "/reports", icon: FileBarChart },
  ];

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location === item.href;

    return (
      <li>
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "w-full justify-start",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Link href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </Button>
          </Link>
        )}
      </li>
    );
  };

  return (
    <div
      className={cn(
        "sidebar transition-all duration-300 ease-in-out",
        collapsed && "sidebar-collapsed"
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-sidebar-foreground" />
          {!collapsed && (
            <span className="text-xl font-semibold text-sidebar-foreground">
              EduManage
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col justify-between h-[calc(100vh-3.5rem)]",
          "overflow-y-auto py-4"
        )}
      >
        <nav className="space-y-1 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </ul>
        </nav>

        <div className="px-2 pb-4">
          <div className={cn(
            "flex items-center border-t border-sidebar-border pt-4",
            collapsed ? "justify-center" : "justify-start px-2"
          )}>
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
                      <User className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Admin User</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-sidebar-accent/50 flex items-center justify-center">
                  <span className="text-sidebar-accent-foreground font-medium text-sm">AU</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-sidebar-foreground">Admin User</div>
                  <div className="text-xs text-sidebar-foreground/70">admin@edumanage.com</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
