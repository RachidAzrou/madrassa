import { Menu, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NotificationDropdown from "../notifications/NotificationDropdown";

type HeaderProps = {
  onMenuClick: () => void;
  title: string; // We behouden de prop maar gebruiken hem niet in de weergave
};

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <div className="absolute top-4 right-16 z-50 flex items-center gap-4 p-2 rounded-lg border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden bg-primary hover:bg-primary/90 text-white shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <NotificationDropdown />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="bg-primary hover:bg-primary/90 text-white shadow-sm"
        onClick={() => window.history.back()}
        title="Terug naar vorige pagina"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default Header;
