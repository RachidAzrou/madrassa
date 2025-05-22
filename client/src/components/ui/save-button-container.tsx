import React from "react";
import { cn } from "@/lib/utils";

interface SaveButtonContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container component voor save knoppen die rechts uitgelijnd zijn
 * Gebruik dit component voor alle save/bevestig knoppen in formulieren
 */
const SaveButtonContainer: React.FC<SaveButtonContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex justify-end items-center gap-3 mt-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default SaveButtonContainer;