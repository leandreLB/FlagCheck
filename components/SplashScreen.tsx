'use client';

import { useEffect } from 'react';

export default function SplashScreen() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to hide splash screen
    const hideSplashScreen = () => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        // Add fade-out class for animation
        splash.classList.add('fade-out');
        
        // Remove completely from DOM after animation
        setTimeout(() => {
          if (splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 500); // Matches CSS transition duration
      }
    };

    // Always wait 4 seconds before hiding splash screen
    const timer = setTimeout(() => {
      hideSplashScreen();
    }, 4000);

    // Cleanup
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // This component doesn't render anything - splash screen is in HTML
  return null;
}
