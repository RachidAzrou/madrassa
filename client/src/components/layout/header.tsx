import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type HeaderProps = {
  onMenuClick: () => void;
  title: string; // We behouden de prop maar gebruiken hem niet in de weergave
};

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white">
      <div className="px-2 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          {/* Titel is verwijderd */}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Zoekbalk is verwijderd */}

          <Button variant="ghost" size="icon" className="text-gray-500 hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Meldingen</span>
          </Button>

          {/* Profielsymbool toegevoegd */}
          <Button variant="ghost" size="icon" className="text-gray-500" asChild>
            <Link href="/mijn-account">
              <User className="h-5 w-5" />
              <span className="sr-only">Mijn Account</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
