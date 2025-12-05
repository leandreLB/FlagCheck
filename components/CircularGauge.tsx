'use client';

import { useEffect, useState } from 'react';

interface CircularGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularGauge({ 
  score, 
  maxScore = 10, 
  size = 280,
  strokeWidth = 20 
}: CircularGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((score / maxScore) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Déterminer les couleurs selon le score
  const getColors = () => {
    if (score >= 1 && score <= 3) {
      return {
        gradient: ['#10B981', '#3B82F6'], // Vert vers bleu
        glow: 'rgba(16, 185, 129, 0.4)',
        text: 'from-green-400 to-blue-500',
      };
    } else if (score >= 4 && score <= 6) {
      return {
        gradient: ['#F97316', '#FBBF24'], // Orange vers jaune
        glow: 'rgba(249, 115, 22, 0.4)',
        text: 'from-orange-500 to-amber-400',
      };
    } else {
      return {
        gradient: ['#EF4444', '#DC2626'], // Rouge vif
        glow: 'rgba(239, 68, 68, 0.5)',
        text: 'from-red-500 to-red-600',
      };
    }
  };

  const colors = getColors();

  // Animation du score
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, score);
      setAnimatedScore(current);

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedScore(score);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Gauge */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 20px ${colors.glow})` }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gauge-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="100%" stopColor={colors.gradient[1]} />
          </linearGradient>
        </defs>
        
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gauge-gradient-${score})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 10px ${colors.gradient[0]})`,
          }}
        />
      </svg>

      {/* Score text au centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-6xl md:text-7xl font-black bg-gradient-to-br ${colors.text} bg-clip-text text-transparent drop-shadow-[0_0_20px_currentColor]`}>
          {Math.round(animatedScore)}
        </div>
        <div className="text-2xl md:text-3xl font-bold text-gray-400 mt-1">
          /{maxScore}
        </div>
      </div>
    </div>
  );
}

