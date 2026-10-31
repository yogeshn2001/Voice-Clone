import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { SiemLogEntry } from '../types.js';

interface SiemAuditLogProps {
  logs: SiemLogEntry[];
}

export const SiemAuditLog: React.FC<SiemAuditLogProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<SiemLogEntry | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: SiemLogEntry['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">CRIT</span>;
      case 'WARN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">WARN</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">INFO</span>;
    }
  };

  return (
    <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Enterprise SIEM Security Stream (CEF / JSON)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-cyber-850 hover:bg-cyber-800 text-slate-300 border border-cyber-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Real-time log list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-56 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 italic">
            Awaiting verification events...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              className={`p-2 rounded border cursor-pointer transition-all ${
                selectedLog?.id === log.id
                  ? 'bg-cyber-800 border-cyan-500/50 text-white'
                  : 'bg-cyber-950/70 border-cyber-850 text-slate-300 hover:border-cyber-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(log.severity)}
                  <span className="font-semibold text-slate-200">{log.eventType}</span>
                </div>
                <span className="text-[10px] text-slate-500">{log.timestamp.split('T')[1]?.replace('Z', '')}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{log.summary}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                <span>Risk: <strong className="text-slate-300">{log.riskScore}%</strong></span>
                <span className="font-mono text-cyan-400/80">sha256:{log.integrityHash.substring(0, 10)}...</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Log Inspector */}
      {selectedLog && (
        <div className="mt-3 p-3 bg-cyber-950 border border-cyber-800 rounded-lg">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-cyan-400">
            <span>RAW SIEM AUDIT JSON</span>
            <span className="text-slate-500">Tamper-evident record</span>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto p-2 bg-black/50 rounded max-h-28">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

