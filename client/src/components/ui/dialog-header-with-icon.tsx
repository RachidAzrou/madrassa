import React from 'react';
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DialogHeaderWithIconProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function DialogHeaderWithIcon({ icon, title, description }: DialogHeaderWithIconProps) {
  return (
    <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div>
          <DialogTitle className="text-white text-lg font-semibold m-0">
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-sm m-0">
            {description}
          </DialogDescription>
        </div>
      </div>
    </div>
  );
}