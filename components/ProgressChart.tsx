'use client';

import { SelfTest } from '@/lib/types/selfTest.types';

interface ProgressChartProps {
  tests: SelfTest[];
}

export default function ProgressChart({ tests }: ProgressChartProps) {
  if (tests.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 text-center">
        <p className="text-gray-400">No test history available</p>
      </div>
    );
  }

  // Prendre les 6 derniers tests (ou moins)
  const recentTests = tests.slice(0, 6).reverse();
  const maxScore = 10;
  const minScore = 0;
  const chartHeight = 200;
  const chartWidth = Math.max(300, recentTests.length * 60);
  const padding = 40;

  // Générer les labels de mois
  const getMonthLabel = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
  };

  // Calculer les points pour la ligne
  const points = recentTests.map((test, index) => {
    const x = padding + (recentTests.length > 1 ? (index * (chartWidth - 2 * padding)) / (recentTests.length - 1) : chartWidth / 2 - padding);
    const y = chartHeight - padding - ((test.scores.total - minScore) / (maxScore - minScore)) * (chartHeight - 2 * padding);
    return { x, y, score: test.scores.total };
  });

  // Créer le path pour la ligne
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Progress Chart</h3>
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Grille horizontale */}
          {[0, 2, 4, 6, 8, 10].map((value) => {
            const y = chartHeight - padding - ((value - minScore) / (maxScore - minScore)) * (chartHeight - 2 * padding);
            return (
              <g key={value}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Ligne de progression */}
          {points.length > 1 && (
            <path
              d={pathData}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Gradient pour la ligne */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="url(#gradient)"
                className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="white"
              />
              {/* Label du mois en dessous */}
              <text
                x={point.x}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {getMonthLabel(recentTests[index].date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">
        Lower scores are better. Score over time.
      </p>
    </div>
  );
}

