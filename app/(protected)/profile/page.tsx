'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          setScans(scansData || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        alert('Error creating payment session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    // TODO: Implement subscription cancellation via Stripe
    alert('Cancellation feature coming soon. Contact support to cancel your subscription.');
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

  // Calculate stats
  const totalScans = scans.length;
  const averageScore = scans.length > 0
    ? Math.round((scans.reduce((sum, scan) => sum + scan.score, 0) / scans.length) * 10) / 10
    : 0;
  
  // Find most common red flag
  const flagCounts: Record<string, number> = {};
  scans.forEach(scan => {
    scan.red_flags.forEach(flag => {
      flagCounts[flag.flag] = (flagCounts[flag.flag] || 0) + 1;
    });
  });
  const mostCommonFlag = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const getSubscriptionBadge = () => {
    if (subscriptionStatus === 'pro') {
      return (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl px-5 py-3 border border-indigo-600/30 shadow-glow-sm">
          <Crown className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-indigo-400">Pro Member - $3.99/month</span>
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
    <div className="flex min-h-screen flex-col px-6 md:px-8 lg:px-12 py-8 pb-24 md:pb-8 bg-black animate-fade-in max-w-[600px] md:max-w-none mx-auto md:mx-0">
      <div className="mb-8 animate-slide-up">
        <h1 className="mb-2 text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Profile</h1>
        <p className="text-gray-400 text-base">Manage your account and settings</p>
      </div>

      <div className="space-y-6">
        {/* User Info Card */}
        <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-5">
            {user?.imageUrl ? (
              <div className="relative">
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'Avatar'}
                  className="h-20 w-20 rounded-full border-2 border-white/20 shadow-glow-sm"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-xl" />
              </div>
            ) : (
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary border-2 border-white/20 shadow-glow-sm">
                <span className="text-3xl font-bold text-white relative z-10">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.fullName || 'User'}
              </h2>
              <p className="text-sm text-gray-400">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="mb-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Subscription
          </h3>
          {getSubscriptionBadge()}
          {subscriptionStatus === 'free' && (
            <button
              onClick={handleUpgrade}
              className="mt-5 w-full rounded-xl glow-button px-4 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="mb-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Statistics
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Total Scans Card */}
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card hover:border-indigo-500/30 hover:shadow-glow-sm transition-all duration-300 stagger-item" style={{ animationDelay: '0.4s' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-500/20 p-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Scans</p>
              </div>
              <p className="text-5xl font-black bg-gradient-primary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                {totalScans}
              </p>
            </div>

            {/* Average Score Card */}
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card hover:border-orange-500/30 hover:shadow-glow-orange transition-all duration-300 stagger-item" style={{ animationDelay: '0.5s' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-orange-500/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Average Score</p>
              </div>
              <p className="text-5xl font-black bg-gradient-orange bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]">
                {averageScore > 0 ? averageScore.toFixed(1) : '0.0'}
              </p>
            </div>

            {/* Most Common Flag Card */}
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 stagger-item" style={{ animationDelay: '0.6s' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-red-500/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Most Common Red Flag</p>
              </div>
              <p className="text-base font-bold text-red-400 line-clamp-2 leading-tight">
                {mostCommonFlag}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/20 hover:bg-white/5 glass-card"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl px-6 py-4 font-bold text-red-400 min-h-[56px] transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete account'}</span>
          </button>
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
