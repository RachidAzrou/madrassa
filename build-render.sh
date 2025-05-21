#!/bin/bash

# Script voor succesvolle build en deployment op Render

# Verwijder problematische gebruik van dezelfde bestandsnaam met verschillende hoofdletters
echo "Opschonen van duplicate bestanden met conflicterende hoofdletters..."

# Verwijder duplicate sidebar bestanden en behoud alleen Sidebar.tsx (met hoofdletter)
if [ -f client/src/components/layout/sidebar.tsx ] && [ -f client/src/components/layout/Sidebar.tsx ]; then
  echo "Verwijder duplicate sidebar.tsx..."
  rm client/src/components/layout/sidebar.tsx
fi

# Verwijder duplicate header bestanden en behoud alleen Header.tsx (met hoofdletter)
if [ -f client/src/components/layout/header.tsx ] && [ -f client/src/components/layout/Header.tsx ]; then
  echo "Verwijder duplicate header.tsx..."
  rm client/src/components/layout/header.tsx
fi

# Herstel het problematische use-sidebar.ts bestand
echo "Repareren van use-sidebar.ts..."
cat > client/src/hooks/use-sidebar.ts << 'EOF'
import { createContext, useContext, useState, ReactNode } from 'react';

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(
    window.innerWidth >= 768 // Default open on larger screens
  );

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
      {children}
    </SidebarContext.Provider>
  );
}

export default function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
EOF

# Build starten
echo "Bouwen van de applicatie..."
npm install
npm run build

echo "Build script voltooid!"