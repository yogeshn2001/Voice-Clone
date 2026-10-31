import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { RiskGauge } from './components/RiskGauge.js';
import { AudioVisualizer } from './components/AudioVisualizer.js';
import { LatencyGraph } from './components/LatencyGraph.js';
import { ChallengePanel } from './components/ChallengePanel.js';
import { FeatureMeter } from './components/FeatureMeter.js';
import { SiemAuditLog } from './components/SiemAuditLog.js';
import { CallSimulatorModal } from './components/CallSimulatorModal.js';
import { Check, ShieldX, ArrowUpRight, Wifi, WifiOff } from 'lucide-react';
import { CallSession, AcousticAnomalyMetrics, VerificationChallenge, SiemLogEntry, ChallengeCategory } from './types.js';

export const App: React.FC = () => {
  const [session, setSession] = useState<CallSession>({
    callId: 'call_live_9082',
    callerId: '+1 (415) 890-2134',
    agentId: 'AGENT_704 (J. Miller)',
    startTime: Date.now() - 38000,
    status: 'evaluating',
    activeChallenge: {
      id: 'chg_init',
      category: 'pacing_disruption',
      promptText: "Security Protocol Check: When I say 'BEEP', please immediately shout 'HALT'. Ready... BEEP!",
      instructionForAgent: "Read prompt with 1-second cadence before the trigger word 'BEEP'. Verify instantaneous human reflex.",
      expectedTokens: ['halt'],
      expectedLatencyMinMs: 180,
      expectedLatencyMaxMs: 420,
      maxToleratedLagMs: 580,
      difficulty: 'standard',
      entropyScore: 0.89,
      createdAt: Date.now() - 12000,
      expiresAt: Date.now() + 33000,
    },
    latestMetrics: {
      callId: 'call_live_9082',
      timestamp: Date.now(),
      chunkIndex: 42,
      syntheticVoiceProbability: 0.08,
      vocoderArtifactScore: 0.06,
      pitchQuantizationScore: 0.07,
      noiseFloorContinuity: 0.94,
      latencyMs: 245,
      packetJitterMs: 4,
      verdict: 'AUTHENTIC_HUMAN',
    },
    compositeRiskScore: 12,
    history: [],
  });

  const [metrics, setMetrics] = useState<AcousticAnomalyMetrics>(session.latestMetrics!);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ timestamp: number; latencyMs: number }>>([
    { timestamp: Date.now() - 10000, latencyMs: 230 },
    { timestamp: Date.now() - 8000, latencyMs: 240 },
    { timestamp: Date.now() - 6000, latencyMs: 225 },
    { timestamp: Date.now() - 4000, latencyMs: 250 },
    { timestamp: Date.now() - 2000, latencyMs: 245 },
  ]);

  const [siemLogs, setSiemLogs] = useState<SiemLogEntry[]>([
    {
      id: 'siem_001',
      timestamp: new Date(Date.now() - 35000).toISOString(),
      eventType: 'SESSION_INIT',
      severity: 'INFO',
      callerId: '+1 (415) 890-2134',
      riskScore: 5,
      latencyMs: 0,
      integrityHash: '8f7a4b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      summary: 'Inbound SIP audio stream anchored. 16-bit Linear PCM negotiated.',
    },
    {
      id: 'siem_002',
      timestamp: new Date(Date.now() - 12000).toISOString(),
      eventType: 'CHALLENGE_ISSUED',
      severity: 'INFO',
      callerId: '+1 (415) 890-2134',
      riskScore: 12,
      latencyMs: 0,
      integrityHash: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      summary: 'Dynamic pacing challenge chg_init dispatched to agent teleprompter.',
    },
  ]);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Attempt backend WebSocket connection with auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isDev = window.location.port === '5173';
        const wsHost = isDev ? `${window.location.hostname}:8000` : window.location.host;
        const wsUrl = `${protocol}//${wsHost}/ws/agent/${session.callId}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_UPDATE' && data.metrics) {
              setMetrics(data.metrics);
              setLatencyHistory((prev) => [...prev.slice(-20), { timestamp: Date.now(), latencyMs: data.metrics.latencyMs }]);
              setSession((prev) => ({
                ...prev,
                compositeRiskScore: data.compositeRiskScore,
                status: data.sessionStatus,
                latestMetrics: data.metrics,
              }));
            } else if (data.type === 'CHALLENGE_TRIGGERED' && data.challenge) {
              setSession((prev) => ({ ...prev, activeChallenge: data.challenge, status: 'evaluating' }));
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnecting after 4s
          setTimeout(connect, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        wsRef.current = ws;
      } catch {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [session.callId]);

  // Handle Triggering Challenge
  const handleTriggerChallenge = (category: ChallengeCategory, forceHighRisk: boolean) => {
    setIsTriggering(true);

    // Try posting to REST backend
    const isDev = window.location.port === '5173';
    const apiBase = isDev ? `http://${window.location.hostname}:8000` : '';
    fetch(`${apiBase}/api/challenges/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: session.callId, category, forceHighRisk }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.challenge) {
          setSession((prev) => ({ ...prev, activeChallenge: data.challenge, status: 'evaluating' }));
          addSiemLog('CHALLENGE_ISSUED', 'INFO', `Challenge ${data.challenge.id} (${category}) dispatched to line.`);
        }
      })
      .catch(() => {
        // Fallback local challenge generation if backend not currently running
        const fallbackPrompts: Record<ChallengeCategory, string> = {
          pacing_disruption: "Immediately after you hear me say 'NOW', say 'FIVE'. Ready... NOW!",
          cognitive_puzzle: "To verify identity: spell the word 'TRUST' backwards phonetically.",
          phonetic_stress: "Security check: please hum once, then say 'Tick-Tock-Pop'.",
          semantic_inversion: "What color is the clear day sky? Answer with an intentionally wrong color.",
        };
        const chg: VerificationChallenge = {
          id: `chg_${Math.floor(Math.random() * 9000 + 1000)}`,
          category,
          promptText: fallbackPrompts[category],
          instructionForAgent: "Read prompt aloud clearly. Measure millisecond speech onset.",
          expectedTokens: ['token'],
          expectedLatencyMinMs: 200,
          expectedLatencyMaxMs: 450,
          maxToleratedLagMs: forceHighRisk ? 600 : 750,
          difficulty: forceHighRisk ? 'high_risk' : 'standard',
          entropyScore: 0.94,
          createdAt: Date.now(),
          expiresAt: Date.now() + 45000,
        };
        setSession((prev) => ({ ...prev, activeChallenge: chg, status: 'evaluating' }));
        addSiemLog('CHALLENGE_ISSUED', 'INFO', `Challenge ${chg.id} dispatched in standalone fallback mode.`);
      })
      .finally(() => {
        setIsTriggering(false);
      });
  };

  const addSiemLog = (eventType: string, severity: SiemLogEntry['severity'], summary: string, risk = session.compositeRiskScore) => {
    const newEntry: SiemLogEntry = {
      id: `siem_${Math.floor(Math.random() * 90000 + 10000)}`,
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      callerId: session.callerId,
      riskScore: risk,
      latencyMs: metrics.latencyMs,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      summary,
    };
    setSiemLogs((prev) => [newEntry, ...prev]);
  };

  // Simulator Handler: Allows user to test Authentic Human vs Deepfake AI Clone
  const handleSimulateScenario = (scenario: 'HUMAN' | 'AI_CLONE' | 'VOICE_CHANGER') => {
    if (scenario === 'HUMAN') {
      const updatedMetrics: AcousticAnomalyMetrics = {
        callId: session.callId,
        timestamp: Date.now(),
        chunkIndex: metrics.chunkIndex + 1,
        syntheticVoiceProbability: 0.06,
        vocoderArtifactScore: 0.05,
        pitchQuantizationScore: 0.06,
        noiseFloorContinuity: 0.96,
        latencyMs: 235,
        packetJitterMs: 3,
        verdict: 'AUTHENTIC_HUMAN',
      };
      setMetrics(updatedMetrics);
      setSession((prev) => ({ ...prev, compositeRiskScore: 9, status: 'verified' }));
      setLatencyHistory((prev) => [...prev, { timestamp: Date.now(), latencyMs: 235 }]);
      addSiemLog('VERDICT_REACHED', 'INFO', 'Response verified: Human reflex timing (235ms) and organic glottal micro-prosody confirmed.', 9);
    } else if (scenario === 'AI_CLONE') {
      const updatedMetrics: AcousticAnomalyMetrics = {
        callId: session.callId,
        timestamp: Date.now(),
        chunkIndex: metrics.chunkIndex + 1,
        syntheticVoiceProbability: 0.94,
        vocoderArtifactScore: 0.88,
        pitchQuantizationScore: 0.79,
        noiseFloorContinuity: 0.42,
        latencyMs: 780,
        packetJitterMs: 14,
        verdict: 'SYNTHETIC_DEEPFAKE_ALERT',
      };
      setMetrics(updatedMetrics);
      setSession((prev) => ({ ...prev, compositeRiskScore: 91, status: 'flagged' }));
      setLatencyHistory((prev) => [...prev, { timestamp: Date.now(), latencyMs: 780 }]);
      addSiemLog('ANOMALY_DETECTED', 'CRITICAL', 'DEEPFAKE ALERT: LLM/TTS pipeline lag (780ms) + Neural Vocoder cutoff at 7.8kHz detected!', 91);
    } else {
      const updatedMetrics: AcousticAnomalyMetrics = {
        callId: session.callId,
        timestamp: Date.now(),
        chunkIndex: metrics.chunkIndex + 1,
        syntheticVoiceProbability: 0.58,
        vocoderArtifactScore: 0.65,
        pitchQuantizationScore: 0.72,
        noiseFloorContinuity: 0.85,
        latencyMs: 320,
        packetJitterMs: 19,
        verdict: 'SUSPICIOUS_ANOMALY',
      };
      setMetrics(updatedMetrics);
      setSession((prev) => ({ ...prev, compositeRiskScore: 61, status: 'evaluating' }));
      setLatencyHistory((prev) => [...prev, { timestamp: Date.now(), latencyMs: 320 }]);
      addSiemLog('ANOMALY_DETECTED', 'WARN', 'RVC voice changer detected: Quantized pitch curve and phase smearing.', 61);
    }
  };

  // Agent Disposition Overrides
  const handleAgentDecision = (action: 'PASS' | 'STEP_UP' | 'FLAG_FRAUD') => {
    if (action === 'PASS') {
      setSession((prev) => ({ ...prev, status: 'verified', compositeRiskScore: 5 }));
      addSiemLog('AGENT_OVERRIDE', 'INFO', 'Agent manually validated caller authenticity. Identity cleared.');
    } else if (action === 'STEP_UP') {
      handleTriggerChallenge('phonetic_stress', true);
      addSiemLog('AGENT_OVERRIDE', 'WARN', 'Agent requested step-up high-entropy phonetic stress challenge.');
    } else {
      setSession((prev) => ({ ...prev, status: 'terminated', compositeRiskScore: 99 }));
      addSiemLog('AGENT_OVERRIDE', 'CRITICAL', 'Agent confirmed fraud attempt. Call terminated and forwarded to Financial Crimes SIEM.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header session={session} onOpenSimulator={() => setIsSimulatorOpen(true)} />

      {/* Main Content Layout */}
      <main className="flex-1 p-6 max-w-[1720px] w-full mx-auto grid grid-cols-12 gap-6">
        {/* Left Column: Challenge Dispatcher & Teleprompter (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <ChallengePanel
            activeChallenge={session.activeChallenge}
            onTriggerChallenge={handleTriggerChallenge}
            isTriggering={isTriggering}
          />

          <FeatureMeter metrics={metrics} />
        </div>

        {/* Center Column: Live Real-Time Waveform & Latency Analytics (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <AudioVisualizer metrics={metrics} isActive={true} />

          <LatencyGraph
            currentLatencyMs={metrics.latencyMs}
            history={latencyHistory}
            maxToleratedLagMs={session.activeChallenge?.maxToleratedLagMs || 580}
          />

          {/* Agent Action Disposition Bar */}
          <div className="bg-cyber-900 border border-cyber-800 rounded-xl p-4 shadow-xl flex items-center justify-between gap-3">
            <button
              onClick={() => handleAgentDecision('PASS')}
              className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Verify & Clear [P]
            </button>

            <button
              onClick={() => handleAgentDecision('STEP_UP')}
              className="flex-1 py-2.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-amber-500/10 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              Step-Up Challenge [S]
            </button>

            <button
              onClick={() => handleAgentDecision('FLAG_FRAUD')}
              className="flex-1 py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-rose-500/10 active:scale-95"
            >
              <ShieldX className="w-4 h-4" />
              Flag & Terminate [F]
            </button>
          </div>
        </div>

        {/* Right Column: Composite Risk Engine & Enterprise SIEM Stream (3 Cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <RiskGauge score={session.compositeRiskScore} verdict={metrics.verdict} />

          <div className="flex-1">
            <SiemAuditLog logs={siemLogs} />
          </div>

          {/* Microservices Status Indicator */}
          <div className="px-3 py-2 rounded-lg bg-cyber-900 border border-cyber-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isConnected ? 'Gateway Mesh: LIVE' : 'Interactive Demo Mode'}</span>
            </div>
            <span className="text-slate-500">Latency: 12ms</span>
          </div>
        </div>
      </main>

      {/* Simulator Modal */}
      <CallSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulateScenario}
      />
    </div>
  );
};

