import { ChevronRight, LucideIcon } from "lucide-react";
import { createElement } from "react";

interface PremiumHeaderProps {
  title: string;
  icon: LucideIcon;
  breadcrumbs?: {
    parent?: string;
    current: string;
  };
}

export function PremiumHeader({ title, icon, breadcrumbs }: PremiumHeaderProps) {
  // We gebruiken createElement om het Lucide icoon correct te instantiëren
  const IconComponent = createElement(icon, {
    className: "h-5 w-5 text-white"
  });

  return (
    <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex flex-col">
        <div className="bg-[#1e40af] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {IconComponent}
            <h1 className="text-base font-medium text-white tracking-tight">{title}</h1>
          </div>
          {breadcrumbs && (
            <div className="text-xs text-white opacity-70 flex items-center">
              {breadcrumbs.parent && (
                <>
                  <span className="mr-1">{breadcrumbs.parent}</span>
                  <ChevronRight className="h-3 w-3 mx-0.5" />
                </>
              )}
              <span>{breadcrumbs.current}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}