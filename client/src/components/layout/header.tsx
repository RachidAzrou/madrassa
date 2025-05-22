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
        className="md:hidden bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <NotificationDropdown />
      
      <Button variant="ghost" size="icon" className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-sm" asChild>
        <Link href="/settings">
          <Settings className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};

export default Header;
