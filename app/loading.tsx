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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Logo au centre avec glow rose/violet */}
      <div className="relative mb-8">
        {/* Glow effect rose/violet animé autour du logo */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 opacity-40 blur-3xl animate-pulse-slow" 
             style={{
               width: '200px',
               height: '200px',
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)',
             }}
        />
        
        {/* Glow secondaire plus subtil */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-400 opacity-30 blur-2xl animate-pulse-glow"
             style={{
               width: '180px',
               height: '180px',
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)',
             }}
        />
        
        {/* Logo principal avec fond dégradé rose-violet */}
        <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-purple-600 flex items-center justify-center shadow-2xl animate-bounce"
             style={{
               boxShadow: '0 0 40px rgba(255, 20, 147, 0.6), 0 0 80px rgba(199, 21, 133, 0.4)',
             }}
        >
          {/* Drapeau emoji stylisé */}
          <span className="text-6xl filter drop-shadow-lg">🚩</span>
        </div>
      </div>

      {/* Texte FlagCheck avec gradient rose-violet */}
      <h1 className="text-3xl font-bold mb-6 animate-pulse">
        <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
          FlagCheck
        </span>
      </h1>

      {/* Loading spinner avec points rose/violet */}
      <div className="flex space-x-2">
        <div 
          className="w-3 h-3 bg-pink-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '0ms',
            boxShadow: '0 0 10px rgba(255, 20, 147, 0.6)',
          }} 
        />
        <div 
          className="w-3 h-3 bg-rose-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '150ms',
            boxShadow: '0 0 10px rgba(236, 72, 153, 0.6)',
          }} 
        />
        <div 
          className="w-3 h-3 bg-purple-500 rounded-full" 
          style={{ 
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: '300ms',
            boxShadow: '0 0 10px rgba(147, 51, 234, 0.6)',
          }} 
        />
      </div>
    </div>
  );
}

