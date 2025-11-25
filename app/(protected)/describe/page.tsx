'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

const MAX_FREE_SCANS = 3;

export default function DescribePage() {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
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

  const handleAnalyze = async () => {
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    // Check if user has reached limit BEFORE analyzing
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
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
    return <LoadingScreen />;
  }

  const getStatusBadge = () => {
    if (subscriptionStatus === 'pro') {
      return (
        <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl p-4 text-center shadow-glow-sm">
          <p className="text-sm font-semibold text-indigo-400">
            ⭐ Pro Member - Unlimited scans
          </p>
        </div>
      );
    } else if (subscriptionStatus === 'lifetime') {
      return (
        <div className="mb-8 rounded-2xl border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl p-4 text-center shadow-glow-pink">
          <p className="text-sm font-semibold text-pink-400">
            💎 Lifetime Member - Lifetime access
          </p>
        </div>
      );
    } else if (remainingScans !== null) {
      return (
        <div className="relative mb-8">
          <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-5 text-center glass-card shadow-lg">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-indigo-500/5 animate-pulse-slow" />
            <p className="relative text-sm text-gray-400">
              Free scans remaining: <span className="font-bold text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] text-lg">{remainingScans}/{MAX_FREE_SCANS}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex flex-col">
      {/* Subtle ambient aura effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-particle-float"
              style={{
                left: `${(i * 7.2) % 100}%`,
                top: `${(i * 11.3) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${15 + (i % 10)}s`,
              }}
            />
          ))}
        </div>
        
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[1400px] h-[1400px] animate-ambient-aura">
          <div className="absolute inset-0 bg-gradient-radial-aura blur-[120px]" />
        </div>
        
        <div className="absolute top-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] animate-ambient-aura-secondary">
          <div className="absolute inset-0 bg-gradient-radial-aura-secondary blur-[100px]" />
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col px-6 py-8 animate-fade-in">
        {/* Premium Top Bar - Sticky */}
        <div className="sticky top-0 z-50 mb-0 -mx-6 px-6 pt-4">
          <div className="mx-auto max-w-[600px]">
            <div className="flex h-[60px] items-center justify-between rounded-2xl border border-white/5 bg-black/40 backdrop-blur-[20px] px-5 shadow-lg">
              <h1 className="text-xl font-bold text-white">
                FlagCheck
              </h1>
              
              {subscriptionStatus === 'free' && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)]"
                >
                  Get PRO
                </button>
              )}
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
              Describe the{' '}
              <span className="text-pink-500/80">person</span>
              {' '}and detect red flags 🚩
            </h2>
          </div>
          <p className="relative text-base text-gray-400">
            AI-powered textual analysis of warning signs
          </p>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center pt-8">
          <div className="w-full max-w-md">
            {/* Subscription Status */}
            {getStatusBadge()}

            {/* Description Input Zone */}
            <div className="group relative mb-8 animate-slide-up">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-primary blur-3xl transition-all duration-500 opacity-40 group-hover:opacity-60 animate-pulse-glow" />
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-pink-500/20 to-indigo-500/20 blur-xl transition-all duration-500 opacity-30 group-hover:opacity-40" />
              
              <div className="relative rounded-3xl border-2 border-white/20 bg-black/40 backdrop-blur-xl p-6 shadow-lg glass-card">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-50 group-hover:opacity-70 animate-pulse-glow" />
                    <div className="relative rounded-full bg-gradient-primary p-4 shadow-[0_0_30px_rgba(99,102,241,0.6),0_0_60px_rgba(236,72,153,0.4)] inline-block mx-auto">
                      <Sparkles className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h2 className="mb-3 text-2xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      Describe this person
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Ex: "She says she's a CEO at 23 years old and travels a lot..."
                    </p>
                  </div>
                  
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a textual description of the person..."
                    disabled={subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0}
                    className="w-full min-h-[200px] rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    maxLength={2000}
                  />
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{description.length}/2000 characters</span>
                    {subscriptionStatus === 'free' && remainingScans === 0 && (
                      <span className="text-orange-500">Upgrade to Pro to continue</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!description.trim() || (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0)}
                    className="w-full rounded-xl glow-button px-6 py-4 font-bold text-white text-base min-h-[56px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscriptionStatus === 'free' && remainingScans === 0
                      ? 'Upgrade to Pro'
                      : 'Analyze red flags'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 glass-card animate-slide-up shadow-lg" style={{ animationDelay: '0.2s' }}>
              <h3 className="mb-6 text-lg font-bold text-white">
                How it works?
              </h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.3s' }}>
                  <span className="mt-1 text-pink-500 text-lg">•</span>
                  <span>Describe a person or profile textually</span>
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
    'Analyzing description...',
    'Detecting red flags...',
    'Examining warning signs...',
    'Generating report...',
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
            <Sparkles className="h-16 w-16 text-white" />
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

