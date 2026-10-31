import Redis from 'ioredis';
import { CallSession, VerificationChallenge, AcousticAnomalyMetrics } from './types.js';
import { config } from './config.js';

export class SessionManager {
  private redisClient: Redis | null = null;
  private localMemoryStore: Map<string, CallSession> = new Map();
  private isRedisConnected = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    try {
      this.redisClient = new Redis(config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        retryStrategy: () => null, // Do not spam retries if Redis is not running
        enableOfflineQueue: false,
      });

      this.redisClient.on('connect', () => {
        console.log('[SessionManager] Connected to Redis cluster for state caching & pub/sub');
        this.isRedisConnected = true;
      });

      let loggedWarning = false;
      this.redisClient.on('error', (err) => {
        if (!this.isRedisConnected && !loggedWarning) {
          console.warn(`[SessionManager] Redis not reachable (${err.message || 'offline'}). Operating in high-speed local memory fallback mode.`);
          loggedWarning = true;
        }
        this.isRedisConnected = false;
      });

      await this.redisClient.connect().catch(() => {
        // Handled by event listener
      });
    } catch {
      console.warn('[SessionManager] Initializing in local memory fallback mode.');
    }
  }

  public async createSession(callId: string, callerId: string, agentId: string): Promise<CallSession> {
    const session: CallSession = {
      callId,
      callerId,
      agentId,
      startTime: Date.now(),
      status: 'active',
      activeChallenge: null,
      latestMetrics: null,
      compositeRiskScore: 5, // Baseline baseline score (5%)
      history: [],
    };

    this.localMemoryStore.set(callId, session);

    if (this.isRedisConnected && this.redisClient) {
      await this.redisClient.setex(`session:${callId}`, 3600, JSON.stringify(session)).catch(() => {});
    }

    return session;
  }

  public async getSession(callId: string): Promise<CallSession | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(`session:${callId}`);
        if (raw) return JSON.parse(raw);
      } catch {
        // Fall back to local memory store
      }
    }
    return this.localMemoryStore.get(callId) || null;
  }

  public async updateSession(session: CallSession): Promise<void> {
    this.localMemoryStore.set(session.callId, session);

    if (this.isRedisConnected && this.redisClient) {
      await this.redisClient.setex(`session:${session.callId}`, 3600, JSON.stringify(session)).catch(() => {});
    }
  }

  public async attachChallenge(callId: string, challenge: VerificationChallenge): Promise<CallSession | null> {
    const session = await this.getSession(callId);
    if (!session) return null;

    session.activeChallenge = challenge;
    session.status = 'evaluating';
    await this.updateSession(session);
    return session;
  }

  public async recordAcousticMetrics(callId: string, metrics: AcousticAnomalyMetrics): Promise<CallSession | null> {
    const session = await this.getSession(callId);
    if (!session) return null;

    session.latestMetrics = metrics;

    // Recalculate composite risk score based on weighted vectors:
    // 45% Acoustic/Vocoder Anomalies + 35% Reaction Latency Anomaly + 20% Pitch Quantization
    const syntheticProbabilityWeight = metrics.syntheticVoiceProbability * 45;
    const vocoderWeight = metrics.vocoderArtifactScore * 35;
    const pitchWeight = metrics.pitchQuantizationScore * 20;

    const weightedScore = Math.round(syntheticProbabilityWeight + vocoderWeight + pitchWeight);
    session.compositeRiskScore = Math.min(100, Math.max(0, weightedScore));

    if (session.compositeRiskScore > config.riskAlertThreshold) {
      session.status = 'flagged';
    } else if (metrics.verdict === 'AUTHENTIC_HUMAN' && session.status !== 'flagged') {
      session.status = 'verified';
    }

    session.history.push({
      timestamp: Date.now(),
      challengeId: session.activeChallenge?.id,
      riskScore: session.compositeRiskScore,
      metrics: {
        syntheticVoiceProbability: metrics.syntheticVoiceProbability,
        latencyMs: metrics.latencyMs,
        vocoderArtifactScore: metrics.vocoderArtifactScore,
      },
    });

    // Keep history bounded to avoid memory bloating
    if (session.history.length > 50) {
      session.history.shift();
    }

    await this.updateSession(session);
    return session;
  }

  public isRedisReady(): boolean {
    return this.isRedisConnected;
  }
}

