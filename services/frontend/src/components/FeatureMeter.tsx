import React from 'react';
import { Sliders, Cpu, Mic, VolumeX, BarChart2 } from 'lucide-react';
import { AcousticAnomalyMetrics } from '../types.js';

interface FeatureMeterProps {
  metrics: AcousticAnomalyMetrics | null;
}

export const FeatureMeter: React.FC<FeatureMeterProps> = ({ metrics }) => {
  const vocoderScore = Math.round((metrics?.vocoderArtifactScore ?? 0.04) * 100);
  const pitchScore = Math.round((metrics?.pitchQuantizationScore ?? 0.06) * 100);
  const noiseFloor = Math.round((metrics?.noiseFloorContinuity ?? 0.96) * 100);
  const jitter = metrics?.packetJitterMs ?? 3;

  const items = [
    {
      label: 'Vocoder Rolloff Artifact',
      value: vocoderScore,
      unit: '%',
      icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
      desc: 'HiFi-GAN / MelGAN 7.5kHz cutoff smearing',
      isAnomaly: vocoderScore > 40,
    },
    {
      label: 'Pitch Quantization (F0)',
      value: pitchScore,
      unit: '%',
      icon: <Mic className="w-3.5 h-3.5 text-indigo-400" />,
      desc: 'Loss of natural human vocal micro-tremors',
      isAnomaly: pitchScore > 40,
    },
    {
      label: 'Room Ambience Continuity',
      value: noiseFloor,
      unit: '%',
      icon: <VolumeX className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Detects artificial digital zero noise cuts',
      isAnomaly: noiseFloor < 70,
    },
    {
      label: 'Packet Telephony Jitter',
      value: jitter,
      unit: 'ms',
      icon: <BarChart2 className="w-3.5 h-3.5 text-amber-400" />,
      desc: 'Transport layer audio frame stability',
      isAnomaly: jitter > 25,
    },
  ];

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Acoustic Forensics & DSP Feature Extraction
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">DSP SUB-ROUTINE</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border transition-all ${
              item.isAnomaly
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : 'bg-cyber-850 border-cyber-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                {item.icon}
                <span className="text-slate-200">{item.label}</span>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  item.isAnomaly ? 'text-rose-400' : 'text-cyan-300'
                }`}
              >
                {item.value} {item.unit}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-cyber-950 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.isAnomaly ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, item.value)}%` }}
              ></div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

