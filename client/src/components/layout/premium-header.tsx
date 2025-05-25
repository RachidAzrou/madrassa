import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumHeaderProps {
  title: string;
  path: string; // Bijvoorbeeld "Beheer > Studenten"
  icon: LucideIcon;
}

export function PremiumHeader({ title, path, icon: Icon }: PremiumHeaderProps) {
  return (
    <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex flex-col">
        <div className="bg-gradient-to-r from-[#0f2b76] to-[#1e4baf] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center bg-white rounded-sm shadow-md overflow-hidden">
              <div className="bg-gradient-to-b from-[#1e4baf] to-[#0f2b76] h-7 w-7 flex items-center justify-center m-1">
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <h1 className="text-base font-medium text-white tracking-tight">{title}</h1>
          </div>
        </div>
        <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
          <div className="text-xs text-gray-500">{path}</div>
        </div>
      </div>
    </header>
  );
}