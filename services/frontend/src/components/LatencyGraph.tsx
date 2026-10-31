import React from 'react';
import { Timer, ArrowDownRight, Zap } from 'lucide-react';

interface LatencyGraphProps {
  currentLatencyMs: number;
  history: Array<{ timestamp: number; latencyMs: number }>;
  maxToleratedLagMs: number;
}

export const LatencyGraph: React.FC<LatencyGraphProps> = ({
  currentLatencyMs,
  history,
  maxToleratedLagMs,
}) => {
  // Chart dimensions
  const svgWidth = 560;
  const svgHeight = 140;
  const padding = { top: 20, right: 30, bottom: 25, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const yMax = 1200; // max scale 1200ms
  const scaleY = (ms: number) => padding.top + graphHeight - (Math.min(yMax, Math.max(0, ms)) / yMax) * graphHeight;

  // Threshold lines
  const humanMinY = scaleY(180);
  const humanMaxY = scaleY(450);
  const botThresholdY = scaleY(maxToleratedLagMs);

  // Generate data points
  const points = history.length > 0
    ? history.slice(-15)
    : [
        { timestamp: 1, latencyMs: 230 },
        { timestamp: 2, latencyMs: 245 },
        { timestamp: 3, latencyMs: 220 },
        { timestamp: 4, latencyMs: 260 },
        { timestamp: 5, latencyMs: currentLatencyMs || 240 },
      ];

  const polylinePoints = points
    .map((p, idx) => {
      const x = padding.left + (idx / Math.max(1, points.length - 1)) * graphWidth;
      const y = scaleY(p.latencyMs);
      return `${x},${y}`;
    })
    .join(' ');

  const isAnomalous = currentLatencyMs > maxToleratedLagMs;
  const isTooFast = currentLatencyMs < 120;

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Millisecond Turn-Taking & Reflex Latency Tracker
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">Target Range:</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            180ms – 450ms
          </span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-cyber-800 bg-[#0a0f18] p-1">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36">
          {/* Shaded Human Baseline Band (180ms to 450ms) */}
          <rect
            x={padding.left}
            y={humanMaxY}
            width={graphWidth}
            height={humanMinY - humanMaxY}
            fill="#10b981"
            fillOpacity="0.08"
          />

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={scaleY(200)}
            x2={svgWidth - padding.right}
            y2={scaleY(200)}
            stroke="#162234"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={scaleY(600)}
            x2={svgWidth - padding.right}
            y2={scaleY(600)}
            stroke="#162234"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={scaleY(1000)}
            x2={svgWidth - padding.right}
            y2={scaleY(1000)}
            stroke="#162234"
            strokeDasharray="3 3"
          />

          {/* AI Pipeline Threat Threshold Line */}
          <line
            x1={padding.left}
            y1={botThresholdY}
            x2={svgWidth - padding.right}
            y2={botThresholdY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={svgWidth - padding.right - 4}
            y={botThresholdY - 4}
            fill="#ef4444"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            AI TTS + LLM Lag Threshold ({maxToleratedLagMs}ms)
          </text>

          {/* Y Axis labels */}
          <text x={padding.left - 6} y={scaleY(1000)} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            1000ms
          </text>
          <text x={padding.left - 6} y={scaleY(600)} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            600ms
          </text>
          <text x={padding.left - 6} y={scaleY(200)} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            200ms
          </text>

          {/* Historical Latency Polyline */}
          <polyline
            fill="none"
            stroke={isAnomalous ? '#ef4444' : '#06b6d4'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Active Data Points */}
          {points.map((p, idx) => {
            const cx = padding.left + (idx / Math.max(1, points.length - 1)) * graphWidth;
            const cy = scaleY(p.latencyMs);
            const isLast = idx === points.length - 1;
            return (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? 5 : 3}
                  fill={isAnomalous ? '#ef4444' : '#06b6d4'}
                  stroke="#0a0f18"
                  strokeWidth="1.5"
                  className={isLast ? 'animate-pulse' : ''}
                />
                {isLast && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill="none"
                    stroke={isAnomalous ? '#ef4444' : '#06b6d4'}
                    strokeWidth="1"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Current Latency Metric Badge */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-cyber-800 bg-cyber-950/60 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Zap className={`w-3.5 h-3.5 ${isAnomalous ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
            <span className="text-slate-400">Observed Reaction Latency:</span>
            <span className={`font-bold text-sm ${isAnomalous ? 'text-rose-400' : 'text-cyan-300'}`}>
              {currentLatencyMs} ms
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAnomalous ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                <ArrowDownRight className="w-3.5 h-3.5 rotate-45" />
                PIPELINE DELAY EXCEEDED (+{currentLatencyMs - maxToleratedLagMs}ms)
              </span>
            ) : isTooFast ? (
              <span className="text-amber-400 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                SUSPICIOUS (PRE-CACHED / SUB-120ms)
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                ORGANIC REFLEX RANGE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

