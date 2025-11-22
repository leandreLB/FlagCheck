'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Sparkles, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

const MAX_FREE_SCANS = 3;

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { userId } = useAuth();

  // Fetch remaining scans and subscription status
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/subscription/check');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.status);
        
        if (data.status === 'free') {
          const scansResponse = await fetch('/api/scans/list');
          if (scansResponse.ok) {
            const scans = await scansResponse.json();
            const used = scans.length || 0;
            setRemainingScans(Math.max(0, MAX_FREE_SCANS - used));
          }
        } else {
          // Pro or Lifetime: unlimited scans
          setRemainingScans(null);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      setRemainingScans(MAX_FREE_SCANS);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file only');
      return;
    }

    // Check if user has reached limit BEFORE uploading
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        
        // If limit reached error, show paywall
        if (response.status === 403) {
          setShowPaywall(true);
          setIsLoading(false);
          return;
        }
        
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      
      // Update local count
      if (subscriptionStatus === 'free') {
        setRemainingScans((prev) => (prev !== null ? prev - 1 : null));
      }
      
      router.push(`/results/${result.scanId}`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    try {
      // Convertir 'pro' en 'monthly' pour correspondre à l'API
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    // If no scans remaining, show paywall instead of file picker
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }
    
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getStatusBadge = () => {
    if (subscriptionStatus === 'pro') {
      return (
        <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl p-4 text-center shadow-glow-sm">
          <p className="text-sm font-semibold text-indigo-400">
            ⭐ Pro Member - Unlimited scans
          </p>
        </div>
      );
    } else if (subscriptionStatus === 'lifetime') {
      return (
        <div className="mb-6 rounded-2xl border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl p-4 text-center shadow-glow-pink">
          <p className="text-sm font-semibold text-pink-400">
            💎 Lifetime Member - Lifetime access
          </p>
        </div>
      );
    } else if (remainingScans !== null) {
      return (
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 text-center glass-card">
          <p className="text-sm text-gray-400">
            Free scans remaining: <span className="font-bold text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">{remainingScans}/{MAX_FREE_SCANS}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 animate-fade-in">
      <div className="mb-8 animate-slide-up">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-gradient-primary p-2 shadow-glow-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            FlagCheck
          </h1>
        </div>
        <p className="text-gray-400 text-base">
          Scan dating profiles to detect red flags
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md">
          {/* Subscription Status */}
          {getStatusBadge()}

          {/* Upload zone */}
          <div className="group relative mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-primary blur-2xl transition-all duration-300 ${
              isDragging ? 'opacity-60 scale-105' : 'opacity-30 group-hover:opacity-50'
            }`} />
            
            <div
              className={`relative rounded-3xl border-2 border-dashed p-12 backdrop-blur-xl transition-all duration-300 cursor-pointer min-h-[280px] flex items-center justify-center ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-600/20 shadow-glow-md scale-[1.02]'
                  : 'border-white/20 bg-black/40 hover:border-indigo-500/50 hover:bg-indigo-600/10 glass-card'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="rounded-full bg-gradient-primary p-6 shadow-glow-md group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-12 w-12 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="mb-2 text-2xl font-bold text-white">
                    Let's scan for red flags 🚩
                  </h2>
                  <p className="text-sm text-gray-400">
                    {subscriptionStatus === 'free' && remainingScans === 0
                      ? 'Upgrade to Pro to continue'
                      : 'Drag & drop an image or click to select'}
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl glow-button px-6 py-4 font-bold text-white text-base min-h-[56px] transition-all duration-300"
                >
                  {subscriptionStatus === 'free' && remainingScans === 0
                    ? 'Upgrade to Pro'
                    : 'Choose a file'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="mb-4 text-base font-bold text-white">
              How it works?
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.3s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Upload a dating profile screenshot</span>
              </li>
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.4s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Our AI analyzes the content to detect red flags</span>
              </li>
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.5s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Get a detailed report in seconds</span>
              </li>
            </ul>
          </div>
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
                  <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">$3.99</span>
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

function LoadingScreen() {
  const [loadingMessage, setLoadingMessage] = useState(0);
  const messages = [
    'Detecting gym selfies...',
    'Analyzing bio cringe...',
    'Counting fish pics...',
    'Checking for red flags...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 animate-fade-in">
          <div className="mb-6 inline-block rounded-full bg-gradient-primary p-8 shadow-glow-md animate-pulse-glow">
            <Camera className="h-16 w-16 text-white" />
          </div>
          <h2 className="mb-3 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analyzing<span className="animate-pulse">...</span>
          </h2>
          <p className="text-gray-400 text-lg">{messages[loadingMessage]}</p>
        </div>

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
          <div className="h-full animate-progress bg-gradient-progress shadow-glow-orange" />
        </div>
      </div>
    </div>
  );
}