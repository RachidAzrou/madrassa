import { Link, useLocation } from "wouter";
import useSidebar from "@/hooks/use-sidebar";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => {
  return (
    <Link href={to}>
      <a
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer ${
          isActive
            ? "bg-primary-700 text-white"
            : "text-white/70 hover:bg-primary-700 hover:text-white"
        }`}
      >
        <i className={`${icon} mr-3 text-lg`}></i>
        {label}
      </a>
    </Link>
  );
};

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const [location] = useLocation();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-600 text-white transform lg:relative transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-6 flex items-center justify-between border-b border-primary-700">
          <div className="flex items-center space-x-2">
            <i className="ri-graduation-cap-fill text-2xl"></i>
            <span className="text-xl font-semibold">EduManage</span>
          </div>
          <button
            onClick={toggle}
            className="lg:hidden text-white"
            aria-label="Close sidebar"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavItem
            to="/"
            icon="ri-dashboard-line"
            label="Dashboard"
            isActive={location === "/" || location === ""}
          />
          <NavItem
            to="/students"
            icon="ri-user-line"
            label="Students"
            isActive={location === "/students"}
          />
          <NavItem
            to="/courses"
            icon="ri-book-open-line"
            label="Courses"
            isActive={location === "/courses"}
          />
          <NavItem
            to="/programs"
            icon="ri-building-line"
            label="Programs"
            isActive={location === "/programs"}
          />
          <NavItem
            to="/calendar"
            icon="ri-calendar-line"
            label="Calendar"
            isActive={location === "/calendar"}
          />
          <NavItem
            to="/attendance"
            icon="ri-checkbox-circle-line"
            label="Attendance"
            isActive={location === "/attendance"}
          />
          <NavItem
            to="/grading"
            icon="ri-medal-line"
            label="Grading"
            isActive={location === "/grading"}
          />
          <NavItem
            to="/reports"
            icon="ri-bar-chart-line"
            label="Reports"
            isActive={location === "/reports"}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-white/70">Administrator</p>
              </div>
            </div>
            <a 
              onClick={() => {
                localStorage.removeItem("auth_token");
                window.location.href = "/login";
              }}
              className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
            >
              Uitloggen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
