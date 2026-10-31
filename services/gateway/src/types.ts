export type ChallengeCategory = 'pacing_disruption' | 'cognitive_puzzle' | 'phonetic_stress' | 'semantic_inversion';

export interface VerificationChallenge {
  id: string;
  category: ChallengeCategory;
  promptText: string;
  instructionForAgent: string;
  expectedTokens: string[];
  expectedLatencyMinMs: number;
  expectedLatencyMaxMs: number;
  maxToleratedLagMs: number;
  difficulty: 'standard' | 'elevated' | 'high_risk';
  entropyScore: number; // Measure of unpredictability to LLMs
  createdAt: number;
  expiresAt: number;
}

export interface AcousticAnomalyMetrics {
  callId: string;
  timestamp: number;
  chunkIndex: number;
  syntheticVoiceProbability: number; // 0.0 to 1.0
  vocoderArtifactScore: number;     // 0.0 to 1.0 (spectral rolloff / phase jitter)
  pitchQuantizationScore: number;   // 0.0 to 1.0 (unnatural F0 smoothing)
  noiseFloorContinuity: number;     // 0.0 to 1.0 (artificial silence detection)
  latencyMs: number;                // Time since challenge issuance to speech onset
  packetJitterMs: number;
  verdict: 'AUTHENTIC_HUMAN' | 'SUSPICIOUS_ANOMALY' | 'SYNTHETIC_DEEPFAKE_ALERT';
}

export interface CallSession {
  callId: string;
  callerId: string;
  agentId: string;
  startTime: number;
  status: 'active' | 'evaluating' | 'verified' | 'flagged' | 'terminated';
  activeChallenge: VerificationChallenge | null;
  latestMetrics: AcousticAnomalyMetrics | null;
  compositeRiskScore: number; // 0 to 100
  history: Array<{
    timestamp: number;
    challengeId?: string;
    riskScore: number;
    metrics: Partial<AcousticAnomalyMetrics>;
  }>;
}

export interface TelemetryEvent {
  eventType: 'SESSION_INIT' | 'CHALLENGE_ISSUED' | 'AUDIO_FRAME' | 'ANOMALY_DETECTED' | 'VERDICT_REACHED' | 'AGENT_OVERRIDE';
  callId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

