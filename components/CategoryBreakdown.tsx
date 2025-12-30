'use client';

import { SelfTestScores } from '@/lib/types/selfTest.types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface CategoryBreakdownProps {
  scores: SelfTestScores;
}

const CATEGORIES = [
  { key: 'communication' as const, label: 'Communication', emoji: '💬' },
  { key: 'boundaries' as const, label: 'Boundaries', emoji: '🛡️' },
  { key: 'attachment' as const, label: 'Attachment', emoji: '💔' },
  { key: 'honesty' as const, label: 'Honesty', emoji: '🎭' },
  { key: 'toxic' as const, label: 'Toxic behaviors', emoji: '⚠️' },
] as const;

export default function CategoryBreakdown({ scores }: CategoryBreakdownProps) {
  const getStatusIcon = (score: number) => {
    if (score <= 2) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (score <= 5) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getBarColor = (score: number) => {
    if (score <= 2) return 'bg-green-500';
    if (score <= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const score = scores[category.key];
        const percentage = (score / 10) * 100;

        return (
          <div
            key={category.key}
            className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.emoji}</span>
                <span className="font-semibold text-white">{category.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{score.toFixed(1)}</span>
                <span className="text-sm text-gray-400">/ 10</span>
                {getStatusIcon(score)}
              </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(score)} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

