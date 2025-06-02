import { ChevronRight, LucideIcon } from "lucide-react";
import { createElement } from "react";

interface PremiumHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  path?: string; // For backwards compatibility
  breadcrumbs?: {
    parent?: string;
    current: string;
  };
}

export function PremiumHeader({ title, icon, description, breadcrumbs, path }: PremiumHeaderProps) {
  // We gebruiken createElement om het Lucide icoon correct te instantiëren
  const IconComponent = createElement(icon, {
    className: "h-5 w-5 text-white"
  });
  
  // Convert path string to breadcrumbs if provided
  let effectiveBreadcrumbs = breadcrumbs;
  if (!breadcrumbs && path) {
    const parts = path.split(' > ');
    effectiveBreadcrumbs = {
      parent: parts.length > 1 ? parts[0] : undefined,
      current: parts.length > 1 ? parts[1] : parts[0]
    };
  }

  return (
    <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex flex-col">
        <div className="bg-[#1e40af] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {IconComponent}
            <h1 className="text-base font-medium text-white tracking-tight">{title}</h1>
          </div>
          {effectiveBreadcrumbs && (
            <div className="text-xs text-white opacity-70 flex items-center">
              {effectiveBreadcrumbs.parent && (
                <>
                  <span className="mr-1">{
                    // Direct category mapping for specific pages
                    (() => {
                      if (!path) return effectiveBreadcrumbs.parent;
                      
                      // Onderwijs category
                      if (path.startsWith('/student-groups')) return 'Onderwijs';
                      if (path.startsWith('/programs')) return 'Onderwijs';
                      if (path.startsWith('/calendar')) return 'Onderwijs';
                      if (path.startsWith('/courses')) return 'Onderwijs';
                      if (path.startsWith('/scheduling')) return 'Onderwijs';
                      
                      // Beheer category
                      if (path.startsWith('/students')) return 'Beheer';
                      if (path.startsWith('/guardians')) return 'Beheer';
                      if (path.startsWith('/teachers')) return 'Beheer';
                      
                      // Evaluatie category
                      if (path.startsWith('/attendance')) return 'Evaluatie';
                      if (path.startsWith('/grading')) return 'Evaluatie';
                      if (path.startsWith('/reports')) return 'Evaluatie';
                      if (path.startsWith('/fees')) return 'Evaluatie';
                      if (path.startsWith('/student-dossier')) return 'Evaluatie';
                      
                      return effectiveBreadcrumbs.parent;
                    })()
                  }</span>
                  <ChevronRight className="h-3 w-3 mx-0.5" />
                </>
              )}
              <span>{
                // Map current page names to Dutch labels
                (() => {
                  if (!path) return effectiveBreadcrumbs.current;
                  
                  if (path.startsWith('/student-groups')) return 'Klassen';
                  if (path.startsWith('/programs')) return 'Vakken';
                  if (path.startsWith('/calendar')) return 'Rooster';
                  if (path.startsWith('/courses')) return 'Curriculum';
                  if (path.startsWith('/scheduling')) return 'Planning';
                  if (path.startsWith('/students')) return 'Studenten';
                  if (path.startsWith('/guardians')) return 'Voogden';
                  if (path.startsWith('/teachers')) return 'Docenten';
                  if (path.startsWith('/attendance')) return 'Aanwezigheid';
                  if (path.startsWith('/grading')) return 'Cijfers';
                  if (path.startsWith('/reports')) return 'Rapport';
                  if (path.startsWith('/fees')) return 'Betalingsbeheer';
                  if (path.startsWith('/student-dossier')) return 'Leerlingendossier';
                  
                  return effectiveBreadcrumbs.current;
                })()
              }</span>
            </div>
          )}
        </div>
        {description && (
          <div className="bg-white px-6 py-2 text-gray-600 text-sm">
            {description}
          </div>
        )}
      </div>
    </header>
  );
}