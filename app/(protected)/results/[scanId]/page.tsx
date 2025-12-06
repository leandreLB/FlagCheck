'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { ScanRecord } from '@/lib/types';
import confetti from 'canvas-confetti';
import { generateShareImage } from '@/lib/shareImageGenerator';
import ShareModal from '@/components/ShareModal';
import CircularGauge from '@/components/CircularGauge';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [templateVariant, setTemplateVariant] = useState<number>(0);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`);
        if (!response.ok) {
          throw new Error('Scan not found');
        }
        const data = await response.json();
        setScan(data);

        // Sélectionner un variant de template aléatoire (0-3) pour l'image de partage
        setTemplateVariant(Math.floor(Math.random() * 4));

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
          
          if (subscriptionStatus === 'free' && count >= MAX_FREE_SCANS) {
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
      return { text: "Green flags only!", emoji: "✅", color: "text-green-400" };
    } else if (score >= 3 && score <= 6) {
      return { text: "Some concerns detected", emoji: "⚠️", color: "text-orange-400" };
    } else if (score >= 7 && score <= 9) {
      return { text: "Multiple red flags", emoji: "🚩", color: "text-red-400" };
    } else {
      return { text: "Critical red flags", emoji: "💀", color: "text-red-600" };
    }
  };

  const handleShare = async () => {
    if (!scan) {
      console.error('No scan data available');
      return;
    }
    
    if (typeof document === 'undefined' || !document.createElement) {
      alert('Cette fonctionnalité nécessite un navigateur moderne.');
      return;
    }
    
    setIsSharing(true);
    try {
      const top3Flags = scan.red_flags.slice(0, 3);
      
      const imageBlob = await generateShareImage({
        score: scan.score,
        redFlags: scan.red_flags,
        top3Flags: top3Flags,
        templateVariant: templateVariant,
      });

      const imageUrl = URL.createObjectURL(imageBlob);
      
      setShareImageBlob(imageBlob);
      setShareImageUrl(imageUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error generating share image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      alert(`Erreur lors de la génération de l'image: ${errorMessage}. Veuillez réessayer.`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!shareImageBlob) return;
    
    const url = URL.createObjectURL(shareImageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flagcheck-results.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setTimeout(() => {
      if (shareImageUrl) {
        URL.revokeObjectURL(shareImageUrl);
        setShareImageUrl(null);
        setShareImageBlob(null);
      }
    }, 300);
  };

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    try {
      const priceType = plan === 'pro' ? 'monthly' : 'lifetime';
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500 border-t-transparent"></div>
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-50">Error</h2>
          <p className="mb-4 text-gray-400">{error || 'Scan not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusMessage(scan.score);

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Animated background gradients - même style que les autres pages */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial opacity-50" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-pink-500/10 to-transparent opacity-30" />
      </div>

      {/* Header avec safe-area pour éviter le chevauchement avec la barre de statut iOS */}
      <div 
        className="relative z-10 flex items-center justify-between px-4 md:px-8 pb-4 animate-slide-up"
        style={{ 
          paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
          minHeight: 'calc(env(safe-area-inset-top, 0px) + 3rem)'
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 transition-all hover:text-white hover:scale-105 p-2 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-2 text-gray-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-50 glass-card"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{isSharing ? 'Sharing...' : 'Share'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex-1 px-6 pb-32 md:pb-12 w-full transition-all duration-300 ${showPaywall ? 'blur-sm' : ''}`}>
          {/* Score Section - Gauge circulaire */}
          <div className="mb-6 md:mb-12 lg:mb-16 animate-fade-in">
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12">
              {/* Gauge circulaire */}
              <div className="flex-shrink-0">
                <CircularGauge score={scan.score} size={280} strokeWidth={24} />
              </div>

              {/* Status et infos */}
              <div className="flex-1 text-center lg:text-left space-y-4 max-w-2xl">
                <div className="space-y-3">
                  <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 ${status.color} glass-card`}>
                    <span className="text-2xl md:text-3xl">{status.emoji}</span>
                    <span className="font-bold text-lg md:text-xl">{status.text}</span>
                  </div>
                  <p className="text-gray-400 text-base md:text-lg">
                    {scan.red_flags.length === 0 
                      ? "No red flags detected in this profile"
                      : `${scan.red_flags.length} red flag${scan.red_flags.length > 1 ? 's' : ''} found`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Red Flags Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {scan.red_flags.length === 0 ? (
            <div className="rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl p-8 md:p-12 text-center glass-card shadow-lg shadow-green-500/10">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold text-green-400 mb-2">
                All Clear! 🎉
              </h3>
              <p className="text-gray-300 text-base md:text-lg">
                This profile looks like a great match. No red flags detected!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Red Flags ({scan.red_flags.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {scan.red_flags.map((flag, index) => (
                  <div
                    key={index}
                    className="group rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-xl p-6 transition-all duration-300 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/20 hover:scale-[1.02] glass-card"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🚩
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-2 text-lg md:text-xl font-bold text-red-400 group-hover:text-red-300 transition-colors">
                          {flag.flag}
                        </h3>
                        <p className="text-sm md:text-base leading-relaxed text-gray-300">
                          {flag.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Share Button - Gros bouton viral */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-xl border border-white/10 px-6 py-5 font-bold text-white min-h-[64px] transition-all duration-300 hover:scale-[1.02] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 glass-card"
          >
            {isSharing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-white border-t-transparent"></div>
                <span>Génération...</span>
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                <span>Share Results</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-4 font-bold text-white min-h-[56px] transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-white/5 glass-card"
          >
            Scan Another Profile
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex-1 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5 glass-card"
          >
            View All Scans
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareImageBlob && shareImageUrl && (
        <ShareModal
          imageBlob={shareImageBlob}
          imageUrl={shareImageUrl}
          score={scan.score}
          onClose={handleCloseShareModal}
          onDownload={handleDownloadImage}
        />
      )}

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
