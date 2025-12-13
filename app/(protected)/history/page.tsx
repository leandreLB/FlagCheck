'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { ScanRecord } from '@/lib/types';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchScans = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scans/list');
      if (!response.ok) {
        throw new Error('Error loading scans');
      }
      const data = await response.json();
      setScans(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleScanClick = (scanId: string) => {
    router.push(`/results/${scanId}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 1 && score <= 3) {
      return 'from-green-400 to-emerald-500';
    } else if (score >= 4 && score <= 6) {
      return 'from-orange-500 to-amber-400';
    } else {
      return 'from-red-500 to-red-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-black">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Error</h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <button
            onClick={fetchScans}
            className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5 glass-card"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden w-full">
      {/* Premium Animated Background - Ultra Sophistiqué */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        
        {/* Animated mesh gradient - Multi-layer */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1800px] h-[1800px] bg-gradient-radial-aura blur-[160px] animate-ambient-aura" />
          <div className="absolute top-1/4 right-1/4 w-[1400px] h-[1400px] bg-gradient-radial-aura-secondary blur-[140px] animate-ambient-aura-secondary" />
          <div className="absolute bottom-1/4 left-1/4 w-[1200px] h-[1200px] bg-gradient-radial-aura blur-[130px] animate-ambient-aura-tertiary" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] bg-gradient-radial-aura blur-[180px] opacity-20 animate-ambient-aura" style={{ animationDuration: '80s' }} />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 opacity-[0.06]">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-particle-float"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 3.7) % 100}%`,
                top: `${(i * 5.9) % 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${15 + (i % 15)}s`,
                boxShadow: `0 0 ${2 + (i % 4)}px rgba(255, 255, 255, 0.5)`,
              }}
            />
          ))}
        </div>

        {/* Animated light rays */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse-glow"
              style={{
                left: `${20 + i * 30}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: '4s',
                transform: `rotate(${i * 15}deg)`,
                transformOrigin: 'top center',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 pt-6 md:pt-12 pb-24 md:pb-32 max-w-[600px] md:max-w-7xl mx-auto w-full animate-fade-in" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
        {/* Header avec safe-area - Ultra Premium */}
        <div 
          className="mb-8 md:mb-12 animate-slide-up"
          style={{ 
            paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'calc(env(safe-area-inset-top, 0px) + 3rem)'
          }}
        >
          <h1 
            className="mb-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]"
            style={{
              textShadow: '0 0 60px rgba(139, 92, 246, 0.4), 0 0 100px rgba(236, 72, 153, 0.3)'
            }}
          >
            History
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-medium">
            {scans.length === 0 
              ? 'Your scan history will appear here'
              : `${scans.length} scan${scans.length > 1 ? 's' : ''} in total`
            }
          </p>
        </div>

        {scans.length === 0 ? (
          <div className="flex flex-1 items-center justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center max-w-md px-4">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-50 animate-pulse-glow" />
                <div className="relative text-8xl animate-float">🚩</div>
              </div>
              <h2 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                No scans yet
              </h2>
              <p className="mb-8 text-gray-400 text-base sm:text-lg md:text-xl">
                Start scanning profiles to see your history here!
              </p>
              <button
                onClick={() => router.push('/')}
                className="group/btn relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-xl px-8 py-4 font-bold text-white min-h-[56px] transition-all hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10">Scan a profile</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {scans.map((scan, index) => (
              <button
                key={scan.id}
                onClick={() => handleScanClick(scan.id)}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-6 text-left transition-all duration-500 hover:border-indigo-500/40 hover:scale-[1.03] hover:shadow-[0_12px_48px_rgba(99,102,241,0.3),0_0_0_1px_rgba(99,102,241,0.2)] stagger-item"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Multi-layer glow effects */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-3xl border border-indigo-500/0 group-hover:border-indigo-500/30 transition-colors duration-500" />
                
                <div className="relative z-10">
                  {/* Header with score and date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-5xl md:text-6xl font-black bg-gradient-to-br ${getScoreColor(scan.score)} bg-clip-text text-transparent drop-shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform duration-500`}
                      >
                        {scan.score}
                      </span>
                      <span className="text-xl md:text-2xl text-gray-400 font-semibold">/10</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(scan.created_at)}</span>
                    </div>
                  </div>

                  {/* Thumbnail - Premium avec effets */}
                  <div className="mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-black/50 border-2 border-white/10 relative group/img">
                    {scan.image_url ? (
                      <>
                        <img
                          src={scan.image_url}
                          alt="Scanned profile"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Red flags info - Premium */}
                  <div className="flex items-center justify-between">
                    {scan.red_flags.length > 0 ? (
                      <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-xl">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                        <span>
                          {scan.red_flags.length} red flag{scan.red_flags.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 backdrop-blur-xl">
                        <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                        <span>All clear!</span>
                      </div>
                    )}

                    {/* Hover indicator - Premium */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1">
                      <div className="rounded-full bg-gradient-primary p-2 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/30">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
