import { ReactNode } from 'react';

interface DialogHeaderWithIconProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function DialogHeaderWithIcon({ icon, title, description }: DialogHeaderWithIconProps) {
  return (
    <div className="bg-[#1e40af] text-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-blue-100 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}