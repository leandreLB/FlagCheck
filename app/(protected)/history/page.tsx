'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calendar } from 'lucide-react';
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
            className="rounded-xl glow-button px-6 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 md:px-8 lg:px-12 py-8 pb-24 md:pb-8 bg-black animate-fade-in max-w-[600px] md:max-w-none mx-auto md:mx-0">
      <div className="mb-8 animate-slide-up">
        <h1 className="mb-2 text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">History</h1>
        <p className="text-gray-400 text-base">Your previous scans</p>
      </div>

      {scans.length === 0 ? (
        <div className="flex flex-1 items-center justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <div className="mb-6 text-8xl animate-float">🚩</div>
            <p className="mb-2 text-2xl font-bold text-white">
              No scans yet
            </p>
            <p className="mb-8 text-gray-400">
              Start scanning profiles!
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-xl glow-button px-8 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
            >
              Scan a profile
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {scans.map((scan, index) => (
            <button
              key={scan.id}
              onClick={() => handleScanClick(scan.id)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-5 text-left transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl glass-card stagger-item"
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />
              
              {/* Thumbnail */}
              <div className="mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-black/50 border border-white/10 relative">
                {scan.image_url ? (
                  <>
                    <img
                      src={scan.image_url}
                      alt="Scanned profile"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Score - Big Number */}
              <div className="mb-3 flex items-baseline gap-2">
                <span
                  className={`text-5xl font-black drop-shadow-[0_0_12px_currentColor] ${
                    scan.score >= 7
                      ? 'bg-gradient-to-br from-red-500 to-red-600 bg-clip-text text-transparent'
                      : scan.score >= 3
                      ? 'bg-gradient-to-br from-orange-500 to-amber-400 bg-clip-text text-transparent'
                      : 'bg-gradient-to-br from-green-400 to-emerald-500 bg-clip-text text-transparent'
                  }`}
                >
                  {scan.score}
                </span>
                <span className="text-xl text-gray-400 font-semibold">/10</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(scan.created_at)}</span>
              </div>

              {/* Red flags count */}
              {scan.red_flags.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {scan.red_flags.length} red flag{scan.red_flags.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Hover indicator */}
              <div className="absolute right-5 top-5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
                <div className="rounded-full bg-gradient-primary p-3 shadow-glow-sm">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
