'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, X } from 'lucide-react';
import { ScanRecord } from '@/lib/types';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

const MAX_FREE_SCANS = 3;

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [isSharing, setIsSharing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`);
        if (!response.ok) {
          throw new Error('Scan not found');
        }
        const data = await response.json();
        setScan(data);

        // Check subscription status first
        let subscriptionStatus = 'free';
        const subscriptionResponse = await fetch('/api/subscription/check');
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          subscriptionStatus = subscriptionData.status;
          setSubscriptionStatus(subscriptionData.status);
        }

        // Check scan count for paywall
        const scansResponse = await fetch('/api/scans/list');
        if (scansResponse.ok) {
          const scans = await scansResponse.json();
          const count = scans.length || 0;
          setScanCount(count);
          
          // Show paywall ONLY if user is on free tier AND used 3 scans
          // Pro and Lifetime users should NEVER see this popup
          if (subscriptionStatus === 'free' && count >= MAX_FREE_SCANS) {
            // Small delay to let the results render first
            setTimeout(() => {
              setShowPaywall(true);
            }, 1000);
          }
        }

        // Trigger confetti if score is 1-2 (healthy profile)
        if (data.score >= 1 && data.score <= 2) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    if (scanId) {
      fetchScan();
    }
  }, [scanId]);

  const getStatusMessage = (score: number) => {
    if (score >= 1 && score <= 2) {
      return "✅ Green flags only! This one's a keeper";
    } else if (score >= 3 && score <= 6) {
      return "⚠️ Some concerns, proceed with caution";
    } else if (score >= 7 && score <= 9) {
      return "🚩 Yikes! Multiple red flags detected";
    } else {
      return "💀 RUN. Abort mission.";
    }
  };

  const handleShare = async () => {
    if (!resultsRef.current) return;
    
    setIsSharing(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#0F0F0F',
        scale: 2,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'flagcheck-results.png', { type: 'image/png' });
        const data = new ClipboardItem({ 'image/png': file });
        
        try {
          await navigator.clipboard.write([data]);
          alert('Screenshot copied to clipboard!');
        } catch (err) {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'flagcheck-results.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Error creating screenshot');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    try {
      // Convert 'pro' to 'monthly' to match the API
      const priceType = plan === 'pro' ? 'monthly' : 'lifetime';
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-50">Error</h2>
          <p className="mb-4 text-gray-400">{error || 'Scan not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const flagEmojis = '🚩'.repeat(Math.min(scan.score, 10));

  return (
    <div className="relative flex min-h-screen flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4 animate-slide-up">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 transition-all hover:text-white hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-2 text-gray-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-50 glass-card"
        >
          <Share2 className="h-4 w-4" />
          <span>{isSharing ? 'Sharing...' : 'Share'}</span>
        </button>
      </div>

      {/* Results Content */}
      <div 
        ref={resultsRef}
        className={`flex-1 px-6 pb-8 transition-all duration-300 ${showPaywall ? 'blur-sm' : ''}`}
      >
        {/* Score Display */}
        <div className="relative mb-8 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-2xl p-8 text-center glass-card animate-count-up">
          {/* Glow effect based on score */}
          <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-50 -z-10 ${
            scan.score >= 7 ? 'bg-red-500/30' : 
            scan.score >= 3 ? 'bg-orange-500/30' : 
            'bg-green-500/30'
          }`} />
          
          <div className="mb-6 relative z-10">
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <div className={`text-8xl md:text-9xl font-black drop-shadow-[0_0_20px_currentColor] ${
                scan.score >= 7 ? 'bg-gradient-to-br from-red-500 to-red-600 bg-clip-text text-transparent' :
                scan.score >= 3 ? 'bg-gradient-to-br from-orange-500 to-amber-400 bg-clip-text text-transparent' :
                'bg-gradient-to-br from-green-400 to-emerald-500 bg-clip-text text-transparent'
              }`}>
                {scan.score}
              </div>
              <span className="text-3xl md:text-4xl font-bold text-gray-400">/10</span>
            </div>
            <div className="text-4xl">{flagEmojis}</div>
          </div>
          <p className="text-xl font-bold text-gray-300">
            {getStatusMessage(scan.score)}
          </p>
        </div>

        {/* Red Flags List */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="mb-6 text-2xl font-bold text-white">
            Red Flags ({scan.red_flags.length})
          </h2>
          {scan.red_flags.length === 0 ? (
            <div className="rounded-3xl border border-green-500/30 bg-green-500/10 backdrop-blur-xl p-8 text-center glass-card shadow-glow-orange">
              <p className="text-2xl mb-3">✅</p>
              <p className="text-xl font-bold text-green-400 mb-2">
                No red flags detected!
              </p>
              <p className="text-sm text-gray-400">
                This profile looks like a good match.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scan.red_flags.map((flag, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-xl p-5 transition-all duration-300 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] glass-card stagger-item"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl animate-float" style={{ animationDelay: `${index * 0.1}s` }}>🚩</span>
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-bold text-red-400">{flag.flag}</h3>
                      <p className="text-sm leading-relaxed text-gray-300">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-xl glow-button px-6 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
          >
            Scan Another Profile
          </button>
          <button
            onClick={() => router.push('/history')}
            className="w-full rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5 glass-card"
          >
            View All Scans
          </button>
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 text-center">
              <div className="mb-4 text-6xl">🚫</div>
              <h2 className="mb-2 text-3xl font-bold text-white">
                Scan limit reached
              </h2>
              <p className="text-gray-400">
                Upgrade to Pro for unlimited scans!
              </p>
            </div>

            <div className="space-y-4">
              {/* Pro Plan */}
              <div className="relative rounded-3xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl p-6 shadow-glow-md hover:border-indigo-500 transition-all duration-300">
                <div className="absolute right-4 top-4 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
                  Recommended
                </div>
                <div className="mb-3">
                  <h3 className="mb-1 text-2xl font-bold text-white">Pro</h3>
                  <p className="text-sm text-gray-400">Unlimited scans</p>
                </div>
                <div className="mb-5">
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$3.99</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <button
                  onClick={() => handleCheckout('pro')}
                  className="w-full rounded-xl glow-button px-4 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
                >
                  Choose Pro
                </button>
              </div>

              {/* Lifetime Plan */}
              <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card">
                <div className="mb-3">
                  <h3 className="mb-1 text-2xl font-bold text-white">Lifetime</h3>
                  <p className="text-sm text-gray-400">Lifetime access</p>
                </div>
                <div className="mb-5">
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$24.99</span>
                  <span className="text-gray-400 ml-2">one-time</span>
                </div>
                <button
                  onClick={() => handleCheckout('lifetime')}
                  className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-4 py-4 font-bold text-white min-h-[56px] transition-all hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-glow-pink"
                >
                  Choose Lifetime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

