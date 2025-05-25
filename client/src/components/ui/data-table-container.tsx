import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// DataTableContainer: Hoofdcontainer voor datatabellen
export function DataTableContainer({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}

// SearchActionBar: Container voor zoekbalk en actieknoppen
export function SearchActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-sm p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {children}
      </div>
    </div>
  );
}

// TableContainer: Bevat de daadwerkelijke tabel met data
export function TableContainer({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

// DataTableHeader: Titel en beschrijving van een datatabelsectie
interface DataTableHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function DataTableHeader({ title, description, children }: DataTableHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// TableLoadingState: Laadstatus voor tabellen
export function TableLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <Loader2 className="h-8 w-8 text-[#1e40af] animate-spin mb-2" />
      <p className="text-sm text-gray-500">Gegevens laden...</p>
    </div>
  );
}

// EmptyTableState: Weergave wanneer een tabel geen data bevat
interface EmptyTableStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyTableState({ icon, title, description, action }: EmptyTableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

// ActionButtonsContainer: Container voor actieknoppen in tabellen met hover effect
export function ActionButtonsContainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

// EmptyActionHeader: Lege header cel voor actiekolom
export function EmptyActionHeader() {
  return (
    <th className="px-4 py-3 text-right">
      <span className="sr-only">Acties</span>
    </th>
  );
}