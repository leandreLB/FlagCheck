'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { AlertTriangle, Calendar, ArrowRight, Sparkles, History as HistoryIcon } from 'lucide-react';
import { ScanRecord } from '@/lib/types';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userId } = useAuth();

  const fetchScans = useCallback(async () => {
    // Si l'utilisateur n'est pas connecté, ne pas essayer de charger
    if (!userId) {
      setIsLoading(false);
      setError('Please sign in to view your scan history');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/scans/list');
      
      if (!response.ok) {
        // Récupérer le message d'erreur de l'API si disponible
        let errorMessage = 'Error loading scans';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si la réponse n'est pas du JSON, utiliser le message par défaut
        }
        
        // Si erreur 401, rediriger vers la connexion
        if (response.status === 401) {
          const currentUrl = window.location.pathname;
          router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setScans(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, router]);

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
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 animate-fade-in">
            <div className="mb-6 inline-block rounded-full bg-gradient-primary p-8 shadow-glow-md animate-pulse-glow">
              <HistoryIcon className="h-16 w-16 text-white" />
            </div>
            <h2 className="mb-3 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Loading<span className="animate-pulse">...</span>
            </h2>
            <p className="text-gray-400 text-lg">Loading your scan history</p>
          </div>

          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
            <div className="h-full animate-progress bg-gradient-progress shadow-glow-orange" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const needsAuth = error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized');
    
    return (
      <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full min-h-screen">
        {/* Background with violet reflections */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-purple-600/20 via-purple-700/10 to-transparent blur-[150px] opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-radial from-purple-500/15 via-purple-600/8 to-transparent blur-[140px] opacity-50" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-md">
            <div className="mb-6 text-6xl">⚠️</div>
            <h2 className="mb-2 text-3xl font-bold text-white">Error</h2>
            <p className="mb-8 text-gray-400">{error}</p>
            {needsAuth ? (
              <button
                onClick={() => {
                  const currentUrl = window.location.pathname;
                  router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
                }}
                className="rounded-xl bg-gradient-primary px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)]"
              >
                Sign in
              </button>
            ) : (
              <button
                onClick={fetchScans}
                className="rounded-xl bg-gradient-primary px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)]"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full">
      {/* Background with violet reflections */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base dark background with violet tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        
        {/* Violet reflections - multiple layers */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-purple-600/20 via-purple-700/10 to-transparent blur-[150px] opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-radial from-purple-500/15 via-purple-600/8 to-transparent blur-[140px] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-700/25 via-purple-800/15 to-transparent blur-[180px] opacity-40" />
        
        {/* Subtle particle effect - reduced */}
        <div className="absolute inset-0 opacity-[0.02]">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-300/30 rounded-full animate-particle-float"
              style={{
                left: `${(i * 7.2) % 100}%`,
                top: `${(i * 11.3) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${15 + (i % 10)}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0 md:pb-8" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
        {/* Premium Top Bar - Sticky */}
        <div 
          className="sticky top-0 z-50 mb-0 -mx-6 md:-mx-8 lg:-mx-12 px-6 md:px-8 lg:px-12"
          style={{ 
            paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'calc(env(safe-area-inset-top, 0px) + 4rem)'
          }}
        >
          <div className="mx-auto max-w-[600px] md:max-w-none">
            <div className="flex h-[60px] items-center justify-between rounded-2xl border border-white/5 bg-black/40 backdrop-blur-[20px] px-5 shadow-lg">
              <h1 className="text-xl font-bold text-white">
                FlagCheck
              </h1>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 mb-[60px] mt-[60px] text-center animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[700px] h-[700px] animate-aura-move">
              <div className="absolute inset-0 bg-gradient-radial-text-aura blur-[80px]" />
            </div>
          </div>
          
          <div className="relative mb-4 inline-block">
            <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-70 animate-glow-move" style={{
              borderRadius: '12px',
              transform: 'scale(1.3)',
            }} />
            <h2 
              className="relative text-4xl font-bold leading-tight text-gray-50"
              style={{
                textShadow: '0 0 40px rgba(99, 102, 241, 0.8), 0 0 80px rgba(236, 72, 153, 0.6)'
              }}
            >
              Your scan{' '}
              <span className="text-pink-500/80">history</span>
              {' '}🚩
            </h2>
          </div>
          <p className="relative text-base text-gray-400">
            {scans.length === 0 
              ? 'Your scan history will appear here'
              : `${scans.length} scan${scans.length > 1 ? 's' : ''} in total`
            }
          </p>
        </div>

        <div 
          className="relative z-10 flex flex-col items-center justify-center w-full"
          style={{ 
            paddingTop: 'max(0.5rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'auto'
          }}
        >
          <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
            {scans.length === 0 ? (
              <div className="group relative mb-8 animate-slide-up">
                {/* Reduced premium glow effects */}
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-primary blur-3xl transition-all duration-500 ease-out opacity-30 group-hover:opacity-40" />
                <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-indigo-500/25 via-pink-500/25 to-indigo-500/25 blur-2xl transition-all duration-500 ease-out opacity-25 group-hover:opacity-30" />
                
                {/* Premium glassmorphism container */}
                <div className="relative rounded-[2rem] border-2 border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-12 sm:p-14 shadow-[0_15px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_15px_rgba(255,255,255,0.06)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_2px_rgba(99,102,241,0.2),inset_0_1px_20px_rgba(255,255,255,0.08)] transition-all duration-500 ease-out text-center">
                  <div className="relative mb-6 inline-block">
                    <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-50 animate-pulse-glow" />
                    <div className="relative text-8xl animate-float">🚩</div>
                  </div>
                  <h3 className="mb-2 text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    No scans yet
                  </h3>
                  <p className="mb-8 text-gray-400 text-base sm:text-lg">
                    Start scanning profiles to see your history here!
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="group/btn relative w-full rounded-2xl overflow-hidden bg-gradient-primary px-6 py-4 font-bold text-white text-base min-h-[60px] transition-all duration-500 hover:scale-[1.02] shadow-[0_0_25px_rgba(99,102,241,0.4),0_0_50px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5),0_0_70px_rgba(236,72,153,0.4)]"
                  >
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-primary blur-xl opacity-40 group-hover/btn:opacity-50 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                      Scan a profile
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {scans.map((scan, index) => (
                  <button
                    key={scan.id}
                    onClick={() => handleScanClick(scan.id)}
                    className="group relative w-full overflow-hidden rounded-[2rem] border-2 border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-6 text-left transition-all duration-500 hover:border-indigo-500/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_2px_rgba(99,102,241,0.2),inset_0_1px_20px_rgba(255,255,255,0.08)] hover:scale-[1.02] animate-slide-up"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    {/* Multi-layer glow effects */}
                    <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      {/* Header with score and date */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-5xl font-black bg-gradient-to-br ${getScoreColor(scan.score)} bg-clip-text text-transparent drop-shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform duration-500`}
                          >
                            {scan.score}
                          </span>
                          <span className="text-xl text-gray-400 font-semibold">/10</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
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
                          <div className="flex items-center gap-2 text-sm font-semibold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-xl">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              {scan.red_flags.length} red flag{scan.red_flags.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 backdrop-blur-xl">
                            <Sparkles className="h-4 w-4" />
                            <span>All clear!</span>
                          </div>
                        )}

                        {/* Hover indicator - Premium */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1">
                          <div className="rounded-full bg-gradient-primary p-2 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/30">
                            <ArrowRight className="h-4 w-4 text-white" />
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
      </div>
    </div>
  );
}
