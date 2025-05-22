import { Menu } from "lucide-react";
import myMadrassaLogo from "../../assets/mymadrassa-new.png";

type MobileHeaderProps = {
  onMenuClick: () => void;
  title?: string;
};

const MobileHeader = ({ onMenuClick, title = "myMadrassa" }: MobileHeaderProps) => {
  return (
    <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white sticky top-0 z-30">
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex items-center">
        <img 
          src={myMadrassaLogo} 
          alt="myMadrassa Logo" 
          className="h-10 object-contain" 
        />
      </div>
      
      <div className="w-12">
        {/* Lege div voor balans in de layout */}
      </div>
    </div>
  );
};

export default MobileHeader;