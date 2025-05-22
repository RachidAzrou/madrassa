import { useState, useEffect } from 'react';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Tailwind CSS breakpoints
const breakpoints = {
  xs: 480,   // Extra small devices
  sm: 640,   // Small devices
  md: 768,   // Medium devices
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
};

/**
 * Enhanced mobile detection hook with responsive breakpoints support
 * @param size - Breakpoint to check against (defaults to 'md')
 * @returns Object with responsive state data
 */
export function useResponsive(size: BreakpointSize = 'md') {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial check
    handleResize();
    
    // Add resize listener with debounce for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < breakpoints[size],
    isXs: windowSize.width < breakpoints.xs,
    isSm: windowSize.width < breakpoints.sm && windowSize.width >= breakpoints.xs,
    isMd: windowSize.width < breakpoints.md && windowSize.width >= breakpoints.sm,
    isLg: windowSize.width < breakpoints.lg && windowSize.width >= breakpoints.md,
    isXl: windowSize.width >= breakpoints.xl,
    breakpoint: Object.entries(breakpoints).reduce((acc, [key, value]) => {
      if (windowSize.width >= value) {
        return key as BreakpointSize;
      }
      return acc;
    }, 'xs' as BreakpointSize),
    orientation: windowSize.width > windowSize.height ? 'landscape' : 'portrait',
  };
}

// Legacy function for backward compatibility
export function useMobile(mobileWidth = 768): boolean {
  const { isMobile } = useResponsive(mobileWidth === 768 ? 'md' : 
                                     mobileWidth === 640 ? 'sm' : 
                                     mobileWidth === 1024 ? 'lg' : 'md');
  return isMobile;
}

export default useResponsive;