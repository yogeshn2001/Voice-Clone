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
  entropyScore: number;
  createdAt: number;
  expiresAt: number;
}

export interface AcousticAnomalyMetrics {
  callId: string;
  timestamp: number;
  chunkIndex: number;
  syntheticVoiceProbability: number;
  vocoderArtifactScore: number;
  pitchQuantizationScore: number;
  noiseFloorContinuity: number;
  latencyMs: number;
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
  compositeRiskScore: number;
  history: Array<{
    timestamp: number;
    challengeId?: string;
    riskScore: number;
    metrics: Partial<AcousticAnomalyMetrics>;
  }>;
}

export interface SiemLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  callerId: string;
  riskScore: number;
  latencyMs: number;
  integrityHash: string;
  summary: string;
}

