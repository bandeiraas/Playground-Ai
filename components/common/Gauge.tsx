import React, { useState } from 'react';

interface GaugeProps {
  value: number; // 0 to 1
  label: string;
  tooltipText?: string;
  // FIX: Add optional baselineValue prop to fix typing errors in Phase3_Evaluation.tsx
  baselineValue?: number;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, tooltipText, baselineValue }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const size = 100;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - value * circumference;

  let colorClass = 'text-green-400 stroke-green-400';
  if (value < 0.9) {
    colorClass = 'text-yellow-400 stroke-yellow-400';
  }
  if (value < 0.85) {
    colorClass = 'text-red-400 stroke-red-400';
  }

  const baselineMarker = () => {
    if (baselineValue === undefined || baselineValue === null) return null;
    const angle = baselineValue * 360;
    
    return (
      <g transform={`rotate(${angle - 90} ${center} ${center})`}>
        {/* This creates a small triangle marker on the gauge ring, pointing inwards */}
        <path d={`M ${center} ${strokeWidth - 1} l 3 -5 l -6 0 z`} fill="white" />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            className="stroke-current text-gray-700"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            className={`stroke-current transition-all duration-500 ease-in-out ${colorClass}`}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Baseline marker */}
          {baselineMarker()}
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${colorClass}`}>
          {(value * 100).toFixed(0)}%
        </div>
      </div>
      <div className="relative flex items-center justify-center gap-1 mt-2">
        <p className="text-sm text-gray-400">{label}</p>
        {tooltipText && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 border border-gray-700 text-left">
                    {tooltipText}
                    {baselineValue !== undefined && baselineValue !== null && (
                        <p className="mt-2 pt-2 border-t border-gray-600">
                            Baseline: <span className="font-bold">{(baselineValue * 100).toFixed(0)}%</span>
                        </p>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gauge;
