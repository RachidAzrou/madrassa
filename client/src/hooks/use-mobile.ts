import { useState, useEffect } from 'react';

export function useMobile(mobileWidth = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < mobileWidth : false
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileWidth);
    };

    // Run once on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [mobileWidth]);

  return isMobile;
}

export default useMobile;