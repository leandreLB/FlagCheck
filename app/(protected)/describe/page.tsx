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

        <div 
          className="relative z-10 flex flex-col items-center justify-center w-full"
          style={{ 
            paddingTop: 'max(0.5rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'auto'
          }}
        >
          <div className="w-full max-w-md">
            {/* Subscription Status */}
            {getStatusBadge()}

            {/* Description Input Zone - Premium Glassmorphism with Smooth Animations */}
            <div className="group relative mb-8 animate-slide-up">
              {/* Reduced premium glow effects */}
              <div className="absolute -inset-2 rounded-[2rem] bg-gradient-primary blur-3xl transition-all duration-500 ease-out opacity-30 group-hover:opacity-40" />
              <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-indigo-500/25 via-pink-500/25 to-indigo-500/25 blur-2xl transition-all duration-500 ease-out opacity-25 group-hover:opacity-30" />
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-pink-500/20 to-purple-500/20 blur-xl transition-all duration-500 ease-out opacity-20 group-hover:opacity-25" />
              
              {/* Premium glassmorphism container */}
              <div className="relative rounded-[2rem] border-2 border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_15px_rgba(255,255,255,0.06)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_2px_rgba(99,102,241,0.2),inset_0_1px_20px_rgba(255,255,255,0.08)] group-hover:-translate-y-1 group-hover:scale-[1.01] transition-all duration-500 ease-out">
                {/* Subtle inner glow effect - reduced */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex flex-col gap-6 relative z-10">
                  {/* Premium Icon with enhanced animations */}
                  <div className="relative flex justify-center">
                    {/* Reduced icon glow */}
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-3xl opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="absolute -inset-1 bg-gradient-primary rounded-full blur-xl opacity-25 group-hover:opacity-35 transition-opacity duration-500" />
                    
                    {/* Icon container with reduced styling */}
                    <div className="relative rounded-full bg-gradient-primary p-6 sm:p-7 shadow-[0_0_25px_rgba(99,102,241,0.5),0_0_50px_rgba(236,72,153,0.4)] group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 ease-out">
                      {/* Inner shine effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                      <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="mb-3 text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.4)] tracking-tight">
                      Describe this person
                    </h2>
                    <p className="text-sm sm:text-base text-gray-300 mb-6 font-medium">
                      Ex: "She says she's a CEO at 23 years old and travels a lot..."
                    </p>
                  </div>
                  
                  {/* Premium textarea with glassmorphism */}
                  <div className="relative group/textarea">
                    {/* Textarea glow effect on focus */}
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-0 group-focus-within/textarea:opacity-30 blur-md transition-opacity duration-300" />
                    
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a textual description of the person..."
                      disabled={subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0}
                      className="relative w-full min-h-[240px] sm:min-h-[280px] rounded-2xl border-2 border-white/30 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-xl px-5 sm:px-6 py-4 sm:py-5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/20 focus:bg-black/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm sm:text-base shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
                      maxLength={2000}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm text-gray-400 font-medium">
                    <span>{description.length}/2000 characters</span>
                    {subscriptionStatus === 'free' && remainingScans === 0 && (
                      <span className="text-orange-400 font-semibold">Upgrade to Pro to continue</span>
                    )}
                  </div>
                  
                  {/* Premium analyze button */}
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!description.trim() || (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0)}
                    className="group/btn relative w-full rounded-2xl overflow-hidden bg-gradient-primary px-6 py-4 font-bold text-white text-base sm:text-lg min-h-[60px] transition-all duration-500 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(99,102,241,0.4),0_0_50px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5),0_0_70px_rgba(236,72,153,0.4)]"
                  >
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-primary blur-xl opacity-40 group-hover/btn:opacity-50 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                      {subscriptionStatus === 'free' && remainingScans === 0
                        ? 'Upgrade to Pro'
                        : 'Analyze red flags'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Premium How it Works Section */}
            <div className="group relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {/* Reduced glow effects */}
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-primary blur-2xl opacity-20 group-hover:opacity-25 transition-opacity duration-500" />
              <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-indigo-500/15 via-pink-500/15 to-indigo-500/15 blur-xl opacity-15 group-hover:opacity-20 transition-opacity duration-500" />
              
              {/* Premium glassmorphism container */}
              <div className="relative rounded-[2rem] border-2 border-white/20 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_2px_20px_rgba(255,255,255,0.08)] group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_0_2px_rgba(99,102,241,0.2),inset_0_2px_30px_rgba(255,255,255,0.12)] group-hover:-translate-y-1 transition-all duration-500">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-xl opacity-50" />
                      <div className="relative rounded-lg bg-gradient-primary p-2 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                      How it works?
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="group/step flex items-start gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 rounded-xl blur-lg opacity-50 group-hover/step:opacity-70 transition-opacity duration-300" />
                        <div className="relative rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 p-3 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover/step:scale-110 group-hover/step:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300">
                          <span className="text-2xl font-bold text-indigo-300">1</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-base sm:text-lg text-white font-medium mb-1">
                          Describe a person or profile textually
                        </p>
                        <p className="text-sm text-gray-400">
                          Enter details about the person you want to analyze
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="group/step flex items-start gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-pink-600/20 rounded-xl blur-lg opacity-50 group-hover/step:opacity-70 transition-opacity duration-300" />
                        <div className="relative rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 p-3 shadow-[0_0_20px_rgba(236,72,153,0.3)] group-hover/step:scale-110 group-hover/step:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300">
                          <span className="text-2xl font-bold text-pink-300">2</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-base sm:text-lg text-white font-medium mb-1">
                          Our AI analyzes the content to detect red flags
                        </p>
                        <p className="text-sm text-gray-400">
                          Advanced algorithms examine every detail for warning signs
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="group/step flex items-start gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl blur-lg opacity-50 group-hover/step:opacity-70 transition-opacity duration-300" />
                        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 p-3 shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover/step:scale-110 group-hover/step:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
                          <span className="text-2xl font-bold text-purple-300">3</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-base sm:text-lg text-white font-medium mb-1">
                          Get a detailed report in seconds
                        </p>
                        <p className="text-sm text-gray-400">
                          Receive comprehensive insights with explanations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$6.99</span>
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
              <div className="relative rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card">
                <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-pink-500/80 to-purple-500/80 px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
                  Best value
                </div>
                <div className="mb-3">
                  <h3 className="mb-1 text-2xl font-bold text-white">Lifetime</h3>
                  <p className="text-sm text-gray-400">Lifetime access</p>
                </div>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$49.99</span>
                  <span className="text-gray-400 ml-2">one-time</span>
                </div>
                <div className="mb-5">
                  <span className="text-sm text-gray-500 line-through">Normally $79.99</span>
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
