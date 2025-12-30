'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Check, Crown } from 'lucide-react';

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  const handleCheckout = async (planType: 'pro_monthly' | 'pro_annual') => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: planType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Payment failed');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  const benefits = [
    'Unlimited profile scans',
    'Unlimited self-tests',
    'Track your progress over time',
    'Get personalized tips',
    'Access full history',
  ];

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-purple-600/20 via-purple-700/10 to-transparent blur-[150px] opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-block rounded-full bg-gradient-primary p-4 shadow-glow-md">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Full Access
          </h1>
          <p className="text-lg text-gray-400">
            Upgrade to Pro and unlock all features
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6">
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards - Display both plans side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <div className="relative rounded-3xl border-2 border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:border-pink-500/50 transition-all duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">PRO</h3>
              <div className="mb-4">
                <span className="text-6xl font-bold text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">9.99€</span>
                <span className="text-xl text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">Monthly billing</p>
              <button
                onClick={() => handleCheckout('pro_monthly')}
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-primary px-6 py-4 font-bold text-white text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Start Pro Monthly'}
              </button>
            </div>
          </div>

          {/* Annual Plan - Highlighted */}
          <div className="relative rounded-3xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl p-8 shadow-glow-md hover:border-indigo-400/70 transition-all duration-300 transform hover:scale-105">
            {/* BEST VALUE Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1.5 text-sm font-bold text-white shadow-glow-sm">
              BEST VALUE
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">ANNUAL PRO</h3>
              <div className="mb-2">
                <span className="text-6xl font-bold text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">79.99€</span>
                <span className="text-xl text-gray-400 ml-2">/year</span>
              </div>
              <p className="text-sm text-gray-400 mb-1">Only 6.67€/month</p>
              <p className="text-sm font-semibold text-green-400 mb-6">Save 33%</p>
              <button
                onClick={() => handleCheckout('pro_annual')}
                disabled={isLoading}
                className="w-full rounded-xl glow-button px-6 py-4 font-bold text-white text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Start Annual Pro'}
              </button>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">Cancel anytime</p>
          <p className="text-sm text-gray-500">Secure payment • No hidden fees</p>
        </div>
      </div>
    </div>
  );
}

