'use client';

import { useEffect, useState } from 'react';

const SPLASH_SHOWN_KEY = 'flagcheck-splash-shown';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown
    if (typeof window === 'undefined') return;
    
    const hasShownSplash = localStorage.getItem(SPLASH_SHOWN_KEY);
    
    if (hasShownSplash) {
      // Don't show splash if already seen
      return;
    }

    // Show splash screen
    setIsVisible(true);
    
    // Show loader after a short delay
    const loaderTimer = setTimeout(() => {
      setShowLoader(true);
    }, 300);

    // Hide splash screen after initial loading
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Mark as already shown
      localStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    }, 2000); // Displayed for 2 seconds

    return () => {
      clearTimeout(loaderTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black animate-fade-in"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Logo FlagCheck avec fade-in */}
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          {/* Glow effect autour du logo */}
          <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-50 animate-pulse-glow" style={{
            borderRadius: '20px',
            transform: 'scale(1.5)',
          }} />
          <h1 className="relative text-5xl md:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]">
            FlagCheck
          </h1>
        </div>

        {/* Loader rose/violet */}
        {showLoader && (
          <div className="relative animate-slide-up">
            <div className="flex gap-2">
              <div 
                className="h-3 w-3 rounded-full bg-gradient-primary animate-bounce"
                style={{ 
                  animationDelay: '0s',
                  animationDuration: '1s',
                }}
              />
              <div 
                className="h-3 w-3 rounded-full bg-gradient-primary animate-bounce"
                style={{ 
                  animationDelay: '0.2s',
                  animationDuration: '1s',
                }}
              />
              <div 
                className="h-3 w-3 rounded-full bg-gradient-primary animate-bounce"
                style={{ 
                  animationDelay: '0.4s',
                  animationDuration: '1s',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

