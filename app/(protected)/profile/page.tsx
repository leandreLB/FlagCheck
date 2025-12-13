'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LogOut, 
  Trash2, 
  Crown, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import { ScanRecord } from '@/lib/types';

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch subscription status
      const subResponse = await fetch('/api/subscription/check');
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscriptionStatus(subData.status);
      }

      // Fetch scans for stats
      const scansResponse = await fetch('/api/scans/list');
      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        // Ensure we have an array, even if empty
        const scansArray = Array.isArray(scansData) ? scansData : [];
        setScans(scansArray);
        console.log('Scans loaded:', scansArray.length, scansArray);
      } else {
        console.error('Failed to fetch scans:', scansResponse.status);
        setScans([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Si on revient de Stripe avec un session_id, attendre que le webhook soit traité puis rafraîchir
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      console.log('✅ Payment successful, waiting for webhook...');
      // Attendre 3 secondes pour laisser le temps au webhook d'être traité
      const timeout = setTimeout(() => {
        console.log('🔄 Refreshing subscription status...');
        fetchData();
        // Nettoyer l'URL
        router.replace('/profile');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [searchParams, router]);

  const handleUpgrade = async () => {
    try {
      // Convert 'pro' to 'monthly' to match the API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: 'monthly' }),
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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro subscription? You will lose access to unlimited scans at the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      alert('Subscription cancelled successfully. Your access will continue until the end of your billing period.');
      
      // Refresh subscription status
      await fetchData();
    } catch (err) {
      console.error('Cancel subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implement account deletion
      // This will require deleting data from Supabase and Clerk
      alert('Deletion feature coming soon. Contact support to delete your account.');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats - ensure scans is an array
  const totalScans = Array.isArray(scans) ? scans.length : 0;
  
  // Calculate average score with proper handling
  let averageScore = 0;
  if (totalScans > 0 && Array.isArray(scans)) {
    const validScans = scans.filter(scan => scan && typeof scan.score === 'number' && !isNaN(scan.score));
    if (validScans.length > 0) {
      const sum = validScans.reduce((sum, scan) => sum + scan.score, 0);
      averageScore = Math.round((sum / validScans.length) * 10) / 10;
    }
  }
  
  // Debug logs
  console.log('Stats calculation:', {
    totalScans,
    scansLength: scans.length,
    scans: scans,
    averageScore,
    firstScan: scans[0]
  });
  
  // Find most common red flag
  const flagCounts: Record<string, number> = {};
  if (Array.isArray(scans)) {
    scans.forEach(scan => {
      if (scan.red_flags && Array.isArray(scan.red_flags)) {
        scan.red_flags.forEach(flag => {
          if (flag && flag.flag) {
            flagCounts[flag.flag] = (flagCounts[flag.flag] || 0) + 1;
          }
        });
      }
    });
  }
  const mostCommonFlag = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const getSubscriptionBadge = () => {
    if (subscriptionStatus === 'pro') {
      return (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl px-5 py-3 border border-indigo-600/30 shadow-glow-sm">
          <Crown className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-indigo-400">Pro Member - $6.99/month</span>
          <button
            onClick={handleCancelSubscription}
            className="ml-auto rounded-lg px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      );
    } else if (subscriptionStatus === 'lifetime') {
      return (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-600/20 to-pink-600/10 backdrop-blur-xl px-5 py-3 border border-pink-600/30 shadow-glow-pink">
          <Sparkles className="h-5 w-5 text-pink-400" />
          <span className="font-bold text-pink-400">Lifetime Member ⭐</span>
        </div>
      );
    } else {
      const remainingScans = Math.max(0, 3 - totalScans);
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-black/50 backdrop-blur-xl px-5 py-3 border border-white/10 glass-card">
          <span className="text-gray-400 font-semibold">{remainingScans} free scans remaining</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-black">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden w-full">
      {/* Premium Animated Background - Ultra Sophistiqué */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        
        {/* Animated mesh gradient */}
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
              className="absolute w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent animate-pulse-glow"
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
        {/* Safe-area padding pour le haut - Ultra Premium */}
        <div 
          className="mb-8 md:mb-12 animate-slide-up"
          style={{ 
            paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'calc(env(safe-area-inset-top, 0px) + 2rem)'
          }}
        >
          <h1 
            className="mb-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]"
            style={{
              textShadow: '0 0 60px rgba(99, 102, 241, 0.4), 0 0 100px rgba(236, 72, 153, 0.3)'
            }}
          >
            Profile
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-medium">Manage your account and settings</p>
        </div>

        <div className="space-y-6">
          {/* User Info Card - Ultra Premium */}
          <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-indigo-500/30 hover:shadow-[0_12px_48px_rgba(99,102,241,0.3),0_0_0_1px_rgba(99,102,241,0.2)] transition-all duration-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-primary blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center gap-5">
              {user?.imageUrl ? (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-primary blur-2xl opacity-50" />
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'Avatar'}
                    className="relative h-20 w-20 rounded-full border-2 border-white/20 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-primary blur-2xl opacity-50" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary border-2 border-white/20 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <span className="text-3xl font-bold text-white relative z-10">
                      {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || 'U'}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  {user?.fullName || 'User'}
                </h2>
                <p className="text-sm text-gray-400">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Status - Ultra Premium */}
          <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-indigo-500/30 hover:shadow-[0_12px_48px_rgba(99,102,241,0.3)] transition-all duration-500 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-primary blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="mb-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Subscription
              </h3>
              {getSubscriptionBadge()}
              {subscriptionStatus === 'free' && (
                <button
                  onClick={handleUpgrade}
                  className="group/btn relative mt-5 w-full rounded-xl overflow-hidden bg-gradient-primary px-4 py-4 font-bold text-white min-h-[56px] transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:shadow-[0_0_50px_rgba(99,102,241,0.8)] hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10">Upgrade to Pro</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats - Ultra Premium */}
          <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-indigo-500/30 hover:shadow-[0_12px_48px_rgba(99,102,241,0.3)] transition-all duration-500 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-primary blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="mb-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Statistics
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Total Scans Card - Premium */}
                <div className="group/card relative rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-indigo-500/50 hover:shadow-[0_8px_32px_rgba(99,102,241,0.4),0_0_0_1px_rgba(99,102,241,0.3)] hover:scale-105 transition-all duration-500 stagger-item" style={{ animationDelay: '0.4s' }}>
                  <div className="absolute -inset-0.5 rounded-2xl bg-indigo-500/20 blur-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 p-2 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover/card:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-500">
                        <TrendingUp className="h-5 w-5 text-indigo-300" />
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Scans</p>
                    </div>
                    <p className="text-5xl font-black text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)] group-hover/card:scale-110 transition-transform duration-500">
                      {totalScans || 0}
                    </p>
                  </div>
                </div>

                {/* Average Score Card - Premium */}
                <div className="group/card relative rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-orange-500/50 hover:shadow-[0_8px_32px_rgba(249,115,22,0.4),0_0_0_1px_rgba(249,115,22,0.3)] hover:scale-105 transition-all duration-500 stagger-item" style={{ animationDelay: '0.5s' }}>
                  <div className="absolute -inset-0.5 rounded-2xl bg-orange-500/20 blur-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-600/20 p-2 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover/card:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all duration-500">
                        <AlertTriangle className="h-5 w-5 text-orange-300" />
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Average Score</p>
                    </div>
                    <p className="text-5xl font-black text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover/card:scale-110 transition-transform duration-500">
                      {averageScore > 0 ? averageScore.toFixed(1) : '0.0'}
                    </p>
                  </div>
                </div>

                {/* Most Common Flag Card - Premium */}
                <div className="group/card relative rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-red-500/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.4),0_0_0_1px_rgba(239,68,68,0.3)] hover:scale-105 transition-all duration-500 stagger-item" style={{ animationDelay: '0.6s' }}>
                  <div className="absolute -inset-0.5 rounded-2xl bg-red-500/20 blur-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 p-2 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] group-hover/card:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all duration-500">
                        <AlertTriangle className="h-5 w-5 text-red-300" />
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Most Common Red Flag</p>
                    </div>
                    <p className="text-base font-bold text-red-400 line-clamp-2 leading-tight drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                      {mostCommonFlag}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Ultra Premium */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={handleSignOut}
              className="group/btn relative flex w-full items-center justify-center gap-3 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/30 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              <LogOut className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Sign out</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="group/btn relative flex w-full items-center justify-center gap-3 rounded-xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 backdrop-blur-xl px-6 py-4 font-bold text-red-400 min-h-[56px] transition-all hover:border-red-500/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.3),0_0_0_1px_rgba(239,68,68,0.2)] shadow-[0_4px_20px_rgba(239,68,68,0.2)] hover:scale-105 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              <Trash2 className="h-5 w-5 relative z-10" />
              <span className="relative z-10">{isDeleting ? 'Deleting...' : 'Delete account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 text-center">
              <div className="mb-5 inline-flex rounded-full bg-red-500/20 p-4 border border-red-500/30">
                <Trash2 className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-white">
                Delete account
              </h2>
              <p className="text-gray-400">
                This action is irreversible. All your data will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-4 font-bold text-white min-h-[56px] transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
