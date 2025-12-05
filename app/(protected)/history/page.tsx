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
    <div className="flex min-h-screen flex-col px-6 py-8 pb-24 md:pb-8 bg-black animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="mb-2 text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          History
        </h1>
        <p className="text-gray-400 text-base md:text-lg">
          {scans.length === 0 
            ? 'Your scan history will appear here'
            : `${scans.length} scan${scans.length > 1 ? 's' : ''} in total`
          }
        </p>
      </div>

      {scans.length === 0 ? (
        <div className="flex flex-1 items-center justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center max-w-md">
            <div className="mb-6 text-8xl animate-float">🚩</div>
            <h2 className="mb-2 text-2xl md:text-3xl font-bold text-white">
              No scans yet
            </h2>
            <p className="mb-8 text-gray-400 text-base md:text-lg">
              Start scanning profiles to see your history here!
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-8 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5 glass-card"
            >
              Scan a profile
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {scans.map((scan, index) => (
            <button
              key={scan.id}
              onClick={() => handleScanClick(scan.id)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 text-left transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 glass-card stagger-item"
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              
              {/* Header with score and date */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-5xl md:text-6xl font-black bg-gradient-to-br ${getScoreColor(scan.score)} bg-clip-text text-transparent drop-shadow-[0_0_12px_currentColor]`}
                  >
                    {scan.score}
                  </span>
                  <span className="text-xl md:text-2xl text-gray-400 font-semibold">/10</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(scan.created_at)}</span>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-black/50 border border-white/10 relative">
                {scan.image_url ? (
                  <>
                    <img
                      src={scan.image_url}
                      alt="Scanned profile"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Red flags info */}
              <div className="flex items-center justify-between">
                {scan.red_flags.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-red-400">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                    <span>
                      {scan.red_flags.length} red flag{scan.red_flags.length > 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-green-400">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                    <span>All clear!</span>
                  </div>
                )}

                {/* Hover indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                  <div className="rounded-full bg-white/10 p-2 border border-white/20">
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
