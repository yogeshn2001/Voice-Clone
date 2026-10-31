import React, { useState } from 'react';
import { Send, Sparkles, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';
import { VerificationChallenge, ChallengeCategory } from '../types.js';

interface ChallengePanelProps {
  activeChallenge: VerificationChallenge | null;
  onTriggerChallenge: (category: ChallengeCategory, forceHighRisk: boolean) => void;
  isTriggering: boolean;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({
  activeChallenge,
  onTriggerChallenge,
  isTriggering,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>('pacing_disruption');
  const [forceHighRisk, setForceHighRisk] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const categories: Array<{ id: ChallengeCategory; label: string; icon: string; desc: string }> = [
    {
      id: 'pacing_disruption',
      label: 'Pacing / Reflex',
      icon: '⚡',
      desc: 'Catches pipeline latency buffers (>600ms)',
    },
    {
      id: 'cognitive_puzzle',
      label: 'Cognitive Puzzle',
      icon: '🧩',
      desc: 'Non-linear questions that break conversational bots',
    },
    {
      id: 'phonetic_stress',
      label: 'Phonetic Stress',
      icon: '🎙️',
      desc: 'Glottal stops & hums that break neural vocoders',
    },
    {
      id: 'semantic_inversion',
      label: 'Semantic Inversion',
      icon: '🔄',
      desc: 'Forces counter-intuitive anti-answers',
    },
  ];

  const handleCopyScript = () => {
    if (activeChallenge) {
      navigator.clipboard.writeText(activeChallenge.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Dynamic Challenge Dispatcher
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            ANTI-DEEPFAKE PROTOCOL
          </span>
        </div>

        {/* Challenge Category Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-cyber-800 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-cyber-850 border-cyber-800 text-slate-400 hover:border-cyber-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold mb-0.5">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">{cat.desc}</span>
              </button>
            );
          })}
        </div>

        {/* High Risk Toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-cyber-850 rounded-lg border border-cyber-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono text-slate-300">Elevated Entropy Mode</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={forceHighRisk}
              onChange={(e) => setForceHighRisk(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-cyber-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Agent Teleprompter Card */}
        <div className="bg-cyber-950 rounded-lg border border-cyan-500/30 p-4 mb-4 relative shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" />
              Agent Teleprompter Script (Read Aloud)
            </span>
            {activeChallenge && (
              <span className="text-[10px] font-mono text-slate-400">
                Max Lag: <span className="text-amber-400 font-semibold">{activeChallenge.maxToleratedLagMs}ms</span>
              </span>
            )}
          </div>

          <div className="min-h-[72px] flex items-center">
            {activeChallenge ? (
              <p className="text-sm font-medium text-slate-100 font-sans leading-relaxed">
                "{activeChallenge.promptText}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Select challenge category above and click "Dispatch Verification Challenge" to arm the teleprompter.
              </p>
            )}
          </div>

          {activeChallenge && (
            <div className="mt-3 pt-2.5 border-t border-cyber-850 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="text-slate-400">
                Expected phonetic cues:{' '}
                <span className="text-cyan-300 font-bold">
                  {activeChallenge.expectedTokens.join(', ')}
                </span>
              </div>
              <button
                onClick={handleCopyScript}
                className="text-slate-400 hover:text-white transition-colors underline"
              >
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onTriggerChallenge(selectedCategory, forceHighRisk)}
        disabled={isTriggering}
        className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50"
      >
        {isTriggering ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating Dynamic Challenge...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Dispatch Verification Challenge
          </>
        )}
      </button>
    </div>
  );
};

