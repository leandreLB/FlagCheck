'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, User, MessageSquare } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/describe', icon: MessageSquare, label: 'Describe' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-2xl">
      {/* Glow effect at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-primary opacity-50" />
      
      <div className="mx-auto flex max-w-[600px] md:max-w-none items-center justify-around px-4 md:px-8 lg:px-12 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 transition-all duration-300 min-h-[56px] justify-center ${
                isActive
                  ? 'text-white scale-110'
                  : 'text-gray-400 hover:text-gray-300 hover:scale-105'
              }`}
            >
              {/* Active indicator glow */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-20 blur-xl" />
                  <div className="absolute inset-0 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl" />
                </>
              )}
              
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`relative z-10 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : ''}`}
              />
              <span className={`text-xs font-bold relative z-10 transition-all ${
                isActive ? 'drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]' : ''
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
