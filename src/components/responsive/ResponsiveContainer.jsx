import React, { useState, useEffect } from 'react';

/**
 * ResponsiveContainer component that provides responsive layout switching
 * Mobile: 0-1023px (single column with tabs)
 * Desktop: 1024px+ (3-column layout)
 */
const ResponsiveContainer = ({ children, mobileLayout, desktopLayout }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check screen size and update responsive state
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 1024;
      const newIsTablet = width >= 768 && width < 1024;
      
      // Only update if there's a change to prevent unnecessary re-renders
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
      setIsTablet(prev => prev !== newIsTablet ? newIsTablet : prev);
    };

    // Initial check
    checkScreenSize();

    // Debounced resize handler to improve performance
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkScreenSize, 100);
    };

    // Listen for window resize
    window.addEventListener('resize', debouncedResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // If specific layouts are provided, use them
  if (mobileLayout && desktopLayout) {
    return (
      <div className="w-full h-screen font-serif relative bg-gradient-to-b from-amber-50 to-amber-100 text-gray-800 dark:bg-gradient-to-b dark:from-gray-900 dark:to-black dark:text-green-400 overflow-hidden">
        {/* Mobile Layout */}
        <div className={`${isMobile ? 'flex' : 'hidden'} flex-col h-full`}>
          {mobileLayout}
        </div>
        
        {/* Desktop Layout */}
        <div className={`${!isMobile ? 'flex' : 'hidden'} h-full`}>
          {desktopLayout}
        </div>
      </div>
    );
  }

  // Default responsive behavior with children
  return (
    <div className="w-full h-screen font-serif relative bg-gradient-to-b from-amber-50 to-amber-100 text-gray-800 dark:bg-gradient-to-b dark:from-gray-900 dark:to-black dark:text-green-400">
      {/* Mobile Layout: Single column with tab navigation */}
      <div className={`${isMobile ? 'flex' : 'hidden'} flex-col h-full`}>
        {children}
      </div>
      
      {/* Desktop Layout: 3-column layout */}
      <div className={`${!isMobile ? 'flex' : 'hidden'} h-full`}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveContainer; 