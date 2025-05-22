import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NotificationDropdown from "../notifications/NotificationDropdown";

type HeaderProps = {
  onMenuClick: () => void;
  title: string; // We behouden de prop maar gebruiken hem niet in de weergave
};

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <div className="absolute top-4 right-16 z-50 flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden bg-blue-50 hover:bg-blue-100 text-blue-800 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <NotificationDropdown />
      
      <Button variant="ghost" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-800 shadow-sm" asChild>
        <Link href="/settings">
          <Settings className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};

export default Header;
