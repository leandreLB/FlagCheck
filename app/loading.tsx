'use client';

import { useEffect, useState } from 'react';

export default function Loading() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out après un court délai pour permettre le chargement
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F0F0F] transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Logo animé avec drapeau */}
      <div className="relative mb-8">
        {/* Fond dégradé animé */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-pink-500 opacity-20 blur-3xl animate-pulse-slow" />
        
        {/* Logo principal avec animation pulse */}
        <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-2xl animate-bounce">
          <span className="text-6xl">🚩</span>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-pink-500 opacity-30 blur-2xl animate-pulse-glow" />
      </div>

      {/* Texte FlagCheck */}
      <h1 className="text-3xl font-bold mb-6 animate-pulse">
        <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          FlagCheck
        </span>
      </h1>

      {/* Loading spinner avec animation personnalisée */}
      <div className="flex space-x-2">
        <div 
          className="w-3 h-3 bg-indigo-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '0ms'
          }} 
        />
        <div 
          className="w-3 h-3 bg-pink-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '150ms'
          }} 
        />
        <div 
          className="w-3 h-3 bg-indigo-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '300ms'
          }} 
        />
      </div>
    </div>
  );
}

