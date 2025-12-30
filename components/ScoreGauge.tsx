'use client';

interface ScoreGaugeProps {
  score: number; // Score de 0 à 10
  size?: number;
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const percentage = (score / 10) * 100;
  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Couleur en fonction du score (plus le score est bas, mieux c'est)
  const getColor = () => {
    if (score <= 2) return '#10b981'; // Vert (All clear)
    if (score <= 5) return '#f59e0b'; // Orange (Needs work)
    if (score <= 8) return '#ef4444'; // Rouge (Warning signs)
    return '#dc2626'; // Rouge foncé (Major red flags)
  };

  const color = getColor();

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-white" style={{ textShadow: `0 0 20px ${color}` }}>
          {score.toFixed(1)}
        </div>
        <div className="text-sm text-gray-400 mt-1">/ 10</div>
      </div>
    </div>
  );
}

