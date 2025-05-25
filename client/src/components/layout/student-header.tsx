import { ChevronRight, Users } from "lucide-react";

// Een eenvoudigere paginaheader specifiek voor de Students pagina
export function StudentHeader() {
  return (
    <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex flex-col">
        <div className="bg-[#1e40af] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white tracking-tight">Studenten</h1>
          </div>
          <div className="text-xs text-white opacity-70 flex items-center">
            <span className="mr-1">Beheer</span>
            <ChevronRight className="h-3 w-3 mx-0.5" />
            <span>Studenten</span>
          </div>
        </div>
      </div>
    </header>
  );
}