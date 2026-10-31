import React from 'react';
import { X, Play, ShieldAlert, CheckCircle2, Cpu } from 'lucide-react';

interface CallSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (scenario: 'HUMAN' | 'AI_CLONE' | 'VOICE_CHANGER') => void;
}

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-cyber-900 border border-cyber-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-cyber-800">
          <div>
            <h3 className="text-base font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Telephony Call Simulation Suite
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject synthetic VoIP audio streams to evaluate system defenses
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 my-5">
          {/* Scenario 1: Authentic Human */}
          <div
            onClick={() => {
              onSimulate('HUMAN');
              onClose();
            }}
            className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-mono font-bold text-emerald-400">Scenario A: Authentic Human Caller</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">
                  240ms Latency
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Normal motor reflex timing, organic glottal micro-prosody, room acoustic ambience. Verifies immediately.
              </p>
            </div>
          </div>

          {/* Scenario 2: Zero-Shot AI Voice Clone */}
          <div
            onClick={() => {
              onSimulate('AI_CLONE');
              onClose();
            }}
            className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-mono font-bold text-rose-400">Scenario B: LLM + Neural Voice Clone Attack</h4>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded">
                  780ms Latency
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Simulates automated bot pipeline lag (ASR + LLM generation + ElevenLabs TTS synthesis) and HiFi-GAN 7.5kHz cutoff.
              </p>
            </div>
          </div>

          {/* Scenario 3: Real-Time Voice Changer (RVC) */}
          <div
            onClick={() => {
              onSimulate('VOICE_CHANGER');
              onClose();
            }}
            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-mono font-bold text-amber-400">Scenario C: Real-Time RVC Impersonator</h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded">
                  320ms Latency
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Human responds fast, but RVC pitch quantization and phase inconsistency trigger acoustic forensic alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-cyber-800 text-[11px] text-slate-500 font-mono text-center">
          Click any scenario to inject simulated VoIP telephony packets into the live pipeline.
        </div>
      </div>
    </div>
  );
};

