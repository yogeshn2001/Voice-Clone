import React, { useEffect, useRef } from 'react';
import { Activity, Radio } from 'lucide-react';
import { AcousticAnomalyMetrics } from '../types.js';

interface AudioVisualizerProps {
  metrics: AcousticAnomalyMetrics | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ metrics, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let step = 0;

    const render = () => {
      step += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // Dark canvas clear with fade trail
      ctx.fillStyle = '#0a0f18';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = '#162234';
      ctx.lineWidth = 1;
      const gridSpacing = 30;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!isActive) {
        // Idle flatline
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animationId = requestAnimationFrame(render);
        return;
      }

      // 1. Draw Waveform (Caller Audio Track)
      const synthProb = metrics?.syntheticVoiceProbability ?? 0.05;
      const isSynthetic = synthProb > 0.65;
      const waveformColor = isSynthetic ? '#ef4444' : synthProb > 0.35 ? '#f59e0b' : '#06b6d4';

      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = waveformColor;
      ctx.shadowBlur = isSynthetic ? 10 : 4;
      ctx.beginPath();

      const centerY = height / 2;
      const amplitude = 32 + (metrics?.vocoderArtifactScore || 0) * 20;

      for (let x = 0; x < width; x++) {
        // Compose natural or synthetic harmonics
        const freq1 = Math.sin((x * 0.04) + step * 4);
        const freq2 = Math.cos((x * 0.08) - step * 2) * 0.5;
        const noise = (Math.random() - 0.5) * (isSynthetic ? 12 : 3); // Synthetic phase jitter noise
        const y = centerY + (freq1 + freq2) * amplitude + noise;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 2. Anomaly Spectral Spikes overlay if deepfake artifacts detected
      if (metrics && metrics.vocoderArtifactScore > 0.4) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        for (let i = 0; i < 4; i++) {
          const spikeX = ((step * 60 + i * 140) % width);
          const spikeWidth = 24;
          ctx.fillRect(spikeX, 0, spikeWidth, height);

          // Anomaly tag marker
          ctx.fillStyle = '#ef4444';
          ctx.font = '10px monospace';
          ctx.fillText('VOCODER_CUTOFF_7.5kHz', Math.max(10, spikeX - 40), 20);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, metrics]);

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Live Acoustic Spectrum & Neural Vocoder Heatmap
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            16-bit PCM (Real-Time Buffer)
          </span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-cyber-800 bg-[#0a0f18]">
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="w-full h-40 block"
        />

        {/* Live Audio Overlay Telemetry */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono bg-cyber-950/80 backdrop-blur px-2.5 py-1 rounded border border-cyber-800 text-slate-400">
          <div>
            <span className="text-slate-500">Sample Window: </span>
            <span className="text-cyan-300 font-semibold">20ms</span>
          </div>
          <div>
            <span className="text-slate-500">Zero-Crossing Rate: </span>
            <span className="text-cyan-300 font-semibold">0.084</span>
          </div>
          <div>
            <span className="text-slate-500">Spectral Flatness: </span>
            <span className="text-cyan-300 font-semibold">0.012 Wiener</span>
          </div>
          <div>
            <span className="text-slate-500">Vocoder Rolloff: </span>
            <span className={metrics && metrics.vocoderArtifactScore > 0.4 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {metrics && metrics.vocoderArtifactScore > 0.4 ? '7,820 Hz (ANOMALOUS)' : '4,210 Hz (ORGANIC)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

