import React, { useEffect, useState } from 'react';
import { ShieldCheck, PhoneCall, Radio, Clock, UserCheck, PlayCircle } from 'lucide-react';
import { CallSession } from '../types.js';

interface HeaderProps {
  session: CallSession;
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, onOpenSimulator }) => {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - session.startTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      setDuration(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [session.startTime]);

  const getStatusBadge = () => {
    switch (session.status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            VERIFIED HUMAN
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            SYNTHETIC CLONE DETECTED
          </span>
        );
      case 'evaluating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            ACTIVE CHALLENGE EVAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            MONITORING STREAM
          </span>
        );
    }
  };

  return (
    <header className="border-b border-cyber-800 bg-cyber-900/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider uppercase text-white font-mono">
                VERIVOX <span className="text-cyan-400 text-xs font-normal">PROTOCOL</span>
              </h1>
              <span className="text-[10px] bg-cyber-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-cyber-700">
                v1.2-ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-slate-400">Voice-Clone Consent Verification & Pacing Defense</p>
          </div>
        </div>

        {/* Live Call Telephony Metadata */}
        <div className="flex items-center gap-5 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2 bg-cyber-850 px-3 py-1.5 rounded-md border border-cyber-800">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Caller:</span>
            <span className="font-semibold text-white">{session.callerId}</span>
          </div>

          <div className="flex items-center gap-2 bg-cyber-850 px-3 py-1.5 rounded-md border border-cyber-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Duration:</span>
            <span className="font-semibold text-cyan-300">{duration}</span>
          </div>

          <div className="flex items-center gap-2 bg-cyber-850 px-3 py-1.5 rounded-md border border-cyber-800">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Audio:</span>
            <span className="text-emerald-400 font-semibold">16kHz PCM (VoIP)</span>
          </div>

          <div className="flex items-center gap-2 bg-cyber-850 px-3 py-1.5 rounded-md border border-cyber-800">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Agent:</span>
            <span className="text-slate-200">{session.agentId}</span>
          </div>
        </div>

        {/* Status Badge & Simulator Button */}
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-md hover:shadow-cyan-500/20 active:scale-95"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Interactive Simulator
          </button>
        </div>
      </div>
    </header>
  );
};

