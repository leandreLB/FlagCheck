'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CheckCircle2, AlertTriangle, XCircle, Flag } from 'lucide-react';
import ScoreGauge from '@/components/ScoreGauge';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import ProgressChart from '@/components/ProgressChart';
import { SelfTest } from '@/lib/types/selfTest.types';

export default function MeScreen() {
  const [latestTest, setLatestTest] = useState<SelfTest | null>(null);
  const [testHistory, setTestHistory] = useState<SelfTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [canTakeTest, setCanTakeTest] = useState(true);
  const router = useRouter();
  const { userId } = useAuth();

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch subscription status
      const subResponse = await fetch('/api/subscription/check');
      let currentSubStatus: 'free' | 'pro' | 'lifetime' = 'free';
      if (subResponse.ok) {
        const subData = await subResponse.json();
        currentSubStatus = subData.status;
        setSubscriptionStatus(subData.status);
      }

      // Fetch latest test
      const latestResponse = await fetch('/api/self-tests/latest');
      if (latestResponse.ok) {
        const latestData = await latestResponse.json();
        setLatestTest(latestData);
      }

      // Check if user can take test
      const canTakeResponse = await fetch('/api/self-tests/can-take');
      if (canTakeResponse.ok) {
        const canTakeData = await canTakeResponse.json();
        setCanTakeTest(canTakeData.canTake);
      }

      // Fetch test history (only for Pro users)
      if (currentSubStatus === 'pro' || currentSubStatus === 'lifetime') {
        const historyResponse = await fetch('/api/self-tests/list?limit=6');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setTestHistory(historyData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusInfo = (score: number) => {
    if (score <= 2) {
      return {
        text: 'All clear!',
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        color: 'text-green-500',
      };
    } else if (score <= 5) {
      return {
        text: 'Needs work',
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        color: 'text-orange-500',
      };
    } else if (score <= 8) {
      return {
        text: 'Warning signs',
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        color: 'text-red-500',
      };
    } else {
      return {
        text: 'Major red flags',
        icon: <Flag className="h-5 w-5 text-red-600" />,
        color: 'text-red-600',
      };
    }
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleTakeTest = () => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    if (!canTakeTest && subscriptionStatus === 'free') {
      // Rediriger vers le paywall
      router.push('/profile?upgrade=true');
      return;
    }

    router.push('/me/test');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block rounded-full bg-gradient-primary p-4 shadow-glow-md animate-pulse">
            <Flag className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // État vide si aucun test
  if (!latestTest) {
    return (
      <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        </div>

        <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🪞</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Am I a red flag?
            </h1>
            <p className="text-gray-400">
              Discover your relationship health score
            </p>
          </div>

          {/* Empty state */}
          <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-12 text-center">
            <div className="mb-6 text-6xl">📊</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to discover your score?
            </h2>
            <p className="text-gray-400 mb-8">
              Take our quick 12-question quiz to assess your relationship behaviors and identify areas for growth.
            </p>
            <button
              onClick={handleTakeTest}
              className="rounded-xl glow-button px-8 py-4 font-bold text-white text-lg transition-all duration-300 hover:scale-105"
            >
              Take the test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(latestTest.scores.total);
  const daysAgo = getDaysAgo(latestTest.date);

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-purple-600/20 via-purple-700/10 to-transparent blur-[150px] opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            🪞 Am I a red flag?
          </h1>
          <p className="text-gray-400">
            Your relationship health score
          </p>
        </div>

        {/* Score Section */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8">
          <div className="flex flex-col items-center">
            <ScoreGauge score={latestTest.scores.total} size={200} />
            <div className={`mt-6 flex items-center gap-2 text-xl font-bold ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.text}</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Last checked: {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
            </p>
            <p className="mt-4 text-xs text-gray-500 text-center max-w-md">
              Lower scores are better. This test evaluates your relationship behaviors across five key categories.
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Score Breakdown</h2>
          <CategoryBreakdown scores={latestTest.scores} />
        </div>

        {/* Progress Chart (only for Pro users) */}
        {(subscriptionStatus === 'pro' || subscriptionStatus === 'lifetime') && testHistory.length > 0 && (
          <div className="mb-8">
            <ProgressChart tests={testHistory} />
          </div>
        )}

        {/* Free user message for chart */}
        {subscriptionStatus === 'free' && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 text-center">
            <p className="text-gray-400 mb-4">
              Upgrade to Pro to see your progress chart and full test history
            </p>
            <button
              onClick={() => router.push('/profile?upgrade=true')}
              className="rounded-xl bg-gradient-primary px-6 py-3 font-bold text-white transition-all hover:scale-105"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Take Test Button */}
        <button
          onClick={handleTakeTest}
          disabled={!canTakeTest && subscriptionStatus === 'free'}
          className={`w-full rounded-xl px-6 py-4 font-bold text-white text-lg transition-all duration-300 ${
            !canTakeTest && subscriptionStatus === 'free'
              ? 'border border-white/20 bg-black/50 backdrop-blur-xl opacity-60 cursor-not-allowed'
              : 'glow-button hover:scale-105'
          }`}
        >
          {!canTakeTest && subscriptionStatus === 'free'
            ? 'Upgrade to Pro'
            : latestTest
            ? 'Retake test'
            : 'Take the test'}
        </button>
      </div>
    </div>
  );
}

