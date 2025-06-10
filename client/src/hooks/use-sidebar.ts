import { useState } from 'react';

export default function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return {
    isOpen,
    toggle,
    close,
    open
  };
}
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
