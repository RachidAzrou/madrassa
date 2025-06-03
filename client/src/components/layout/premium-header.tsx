import { ChevronRight, LucideIcon } from "lucide-react";
import { createElement } from "react";
import { useLocation } from "wouter";

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
  const [location] = useLocation();
  
  // We gebruiken createElement om het Lucide icoon correct te instantiëren
  const IconComponent = createElement(icon, {
    className: "h-5 w-5 text-white"
  });
  
  // Convert path string to breadcrumbs if provided, or generate from location
  let effectiveBreadcrumbs = breadcrumbs;
  if (!breadcrumbs) {
    if (path) {
      const parts = path.split(' > ');
      effectiveBreadcrumbs = {
        parent: parts.length > 1 ? parts[0] : undefined,
        current: parts.length > 1 ? parts[1] : parts[0]
      };
    } else {
      // Generate breadcrumbs based on current location
      const getParentCategory = () => {
        if (['/student-groups', '/programs', '/calendar', '/courses', '/scheduling'].includes(location)) return 'Onderwijs';
        if (['/students', '/guardians', '/teachers', '/accounts'].includes(location)) return 'Beheer';
        if (['/attendance', '/grading', '/reports', '/student-dossier'].includes(location)) return 'Evaluatie';
        if (location === '/fees') return 'Financien';
        return undefined;
      };
      
      const getCurrentPage = () => {
        const pageMap = {
          '/student-groups': 'Klassen',
          '/programs': 'Vakken',
          '/calendar': 'Rooster',
          '/courses': 'Curriculum',
          '/scheduling': 'Planning',
          '/students': 'Studenten',
          '/guardians': 'Voogden',
          '/teachers': 'Docenten',
          '/accounts': 'Accounts',
          '/attendance': 'Aanwezigheid',
          '/grading': 'Cijfers',
          '/reports': 'Rapport',
          '/fees': 'Betalingsbeheer',
          '/student-dossier': 'Leerlingdossier'
        };
        return pageMap[location] || title;
      };
      
      effectiveBreadcrumbs = {
        parent: getParentCategory(),
        current: getCurrentPage()
      };
    }
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
                    location === '/student-groups' ? 'Onderwijs' :
                    location === '/programs' ? 'Onderwijs' :
                    location === '/calendar' ? 'Onderwijs' :
                    location === '/courses' ? 'Onderwijs' :
                    location === '/scheduling' ? 'Onderwijs' :
                    location === '/students' ? 'Beheer' :
                    location === '/guardians' ? 'Beheer' :
                    location === '/teachers' ? 'Beheer' :
                    location === '/accounts' ? 'Beheer' :
                    location === '/attendance' ? 'Evaluatie' :
                    location === '/grading' ? 'Evaluatie' :
                    location === '/reports' ? 'Evaluatie' :
                    location === '/fees' ? 'Financien' :
                    location === '/student-dossier' ? 'Evaluatie' :
                    effectiveBreadcrumbs.parent
                  }</span>
                  <ChevronRight className="h-3 w-3 mx-0.5" />
                </>
              )}
              <span>{
                // Map current page names to Dutch labels
                location === '/student-groups' ? 'Klassen' :
                location === '/programs' ? 'Vakken' :
                location === '/calendar' ? 'Rooster' :
                location === '/courses' ? 'Curriculum' :
                location === '/scheduling' ? 'Planning' :
                location === '/students' ? 'Studenten' :
                location === '/guardians' ? 'Voogden' :
                location === '/teachers' ? 'Docenten' :
                location === '/accounts' ? 'Accounts' :
                location === '/attendance' ? 'Aanwezigheid' :
                location === '/grading' ? 'Cijfers' :
                location === '/reports' ? 'Rapport' :
                location === '/fees' ? 'Betalingsbeheer' :
                location === '/student-dossier' ? 'Leerlingdossier' :
                effectiveBreadcrumbs.current
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