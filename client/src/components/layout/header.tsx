import { useState } from "react";
import { Search, Bell, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeaderProps = {
  onMenuClick: () => void;
  title: string;
};

const Header = ({ onMenuClick, title }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Zoeken..."
              className="w-[200px] pl-8 md:w-[260px] rounded-md border border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="ghost" size="icon" className="text-gray-500">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Meldingen</span>
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-500">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Instellingen</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
