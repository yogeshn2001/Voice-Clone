import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RiskGaugeProps {
  score: number; // 0 to 100
  verdict: 'AUTHENTIC_HUMAN' | 'SUSPICIOUS_ANOMALY' | 'SYNTHETIC_DEEPFAKE_ALERT';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, verdict }) => {
  // Semi-circle gauge calculation (from 180deg to 360deg / 0deg)
  const getColor = () => {
    if (score < 25) return '#10b981'; // Emerald
    if (score < 65) return '#f59e0b'; // Amber
    return '#ef4444'; // Crimson
  };

  const getVerdictDetails = () => {
    switch (verdict) {
      case 'AUTHENTIC_HUMAN':
        return {
          label: 'ORGANIC HUMAN VOICE',
          desc: 'Organic glottal micro-prosody & natural latency confirmed',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        };
      case 'SUSPICIOUS_ANOMALY':
        return {
          label: 'SUSPICIOUS ANOMALY',
          desc: 'Pacing lag or spectral flatness deviation detected',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        };
      case 'SYNTHETIC_DEEPFAKE_ALERT':
        return {
          label: 'AI CLONE DETECTED',
          desc: 'Neural vocoder spectral signature & pipeline lag confirmed',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />,
          colorClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        };
    }
  };

  const details = getVerdictDetails();
  const activeColor = getColor();

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Composite Risk Engine</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-850 border border-cyber-700 text-slate-400">
          REAL-TIME INFERENCE
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative flex items-center justify-center my-3">
        <svg height="140" width="220" className="overflow-visible">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track (semi-circle) */}
          <path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke="#162234"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Dynamic Active Stroke */}
          <path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke={activeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * 90}`}
            strokeDashoffset={`${Math.PI * 90 * (1 - score / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s' }}
            filter="url(#gaugeGlow)"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute top-[58px] flex flex-col items-center">
          <div className="flex items-baseline font-mono font-bold">
            <span className="text-4xl tracking-tight" style={{ color: activeColor }}>
              {score}
            </span>
            <span className="text-sm text-slate-400 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">SYNTHETIC PROB</span>
        </div>
      </div>

      {/* Risk Tier Marker Scale */}
      <div className="w-full flex justify-between text-[11px] font-mono text-slate-500 px-4 -mt-2 mb-4">
        <span className="text-emerald-500">0% Human</span>
        <span className="text-amber-500">50% Caution</span>
        <span className="text-rose-500">100% Clone</span>
      </div>

      {/* Verdict Card */}
      <div className={`w-full p-3 rounded-lg border flex items-start gap-3 transition-colors ${details.colorClass}`}>
        <div className="mt-0.5">{details.icon}</div>
        <div>
          <h4 className="text-xs font-bold font-mono tracking-wider">{details.label}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{details.desc}</p>
        </div>
      </div>
    </div>
  );
};

