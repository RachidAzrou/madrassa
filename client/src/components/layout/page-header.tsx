import { ChevronRight } from "lucide-react";

// Een eenvoudigere paginaheader met solide blauwe achtergrond
export function PageHeader({
  title,
  icon,
  parent,
  current
}: {
  title: string;
  icon: JSX.Element;
  parent?: string;
  current: string;
}) {
  return (
    <div className="bg-[#1e40af] px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Het icoon wordt als JSX element doorgegeven, geen transformatie nodig */}
        {icon}
        <h1 className="text-base font-medium text-white tracking-tight">{title}</h1>
      </div>
      <div className="text-xs text-white opacity-70 flex items-center">
        {parent && (
          <>
            <span className="mr-1">{parent}</span>
            <ChevronRight className="h-3 w-3 mx-0.5" />
          </>
        )}
        <span>{current}</span>
      </div>
    </div>
  );
}