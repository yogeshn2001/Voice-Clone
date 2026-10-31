import Fastify, { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { WebSocket } from 'ws';
import { config } from './config.js';
import { DynamicChallengeEngine } from './challengeEngine.js';
import { SessionManager } from './sessionManager.js';
import { SiemAuditLogger } from './siemLogger.js';
import { AcousticAnomalyMetrics, VerificationChallenge } from './types.js';

const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

const challengeEngine = new DynamicChallengeEngine();
const sessionManager = new SessionManager();
const siemLogger = new SiemAuditLogger();

// Store active agent WebSocket client connections per callId
const agentClients: Map<string, Set<WebSocket>> = new Map();

// Helper to broadcast telemetry to connected agents for a specific callId
function broadcastToAgents(callId: string, event: Record<string, unknown>) {
  const clients = agentClients.get(callId);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function start() {
  // 1. CORS plugin
  await server.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 2. Strict Rate Limiting (Protects telephony webhooks & agent endpoints)
  await server.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });

  // 3. WebSocket plugin
  await server.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB frame limit for audio chunks
    },
  });

  // 4. REST Routes
  server.get('/api/health', async () => {
    return {
      status: 'healthy',
      service: 'voice-clone-gateway',
      timestamp: new Date().toISOString(),
      redisConnected: sessionManager.isRedisReady(),
    };
  });

  server.post<{
    Body: { callId?: string; callerId?: string; agentId?: string };
  }>('/api/sessions', async (request, reply) => {
    const { callId = `call_${Date.now()}`, callerId = '+1-800-555-0199', agentId = 'agent_704' } = request.body || {};
    const session = await sessionManager.createSession(callId, callerId, agentId);

    siemLogger.logSecurityEvent('SESSION_INIT', session, {
      initiatedBy: agentId,
      callerId,
      timestamp: session.startTime,
    });

    return reply.status(201).send(session);
  });

  server.get<{
    Params: { callId: string };
  }>('/api/sessions/:callId', async (request, reply) => {
    const session = await sessionManager.getSession(request.params.callId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    return reply.send(session);
  });

  // Agent triggers a dynamic challenge
  server.post<{
    Body: { callId: string; category?: any; forceHighRisk?: boolean };
  }>('/api/challenges/trigger', async (request, reply) => {
    const { callId, category, forceHighRisk } = request.body;
    const session = await sessionManager.getSession(callId);
    if (!session) {
      return reply.status(404).send({ error: 'Call session not found' });
    }

    const challenge = challengeEngine.generateChallenge(category, forceHighRisk);
    await sessionManager.attachChallenge(callId, challenge);

    siemLogger.logSecurityEvent('CHALLENGE_ISSUED', session, {
      challengeId: challenge.id,
      category: challenge.category,
      difficulty: challenge.difficulty,
      entropyScore: challenge.entropyScore,
      expectedLatencyMinMs: challenge.expectedLatencyMinMs,
      expectedLatencyMaxMs: challenge.expectedLatencyMaxMs,
    });

    // Notify connected agent UI immediately
    broadcastToAgents(callId, {
      type: 'CHALLENGE_TRIGGERED',
      callId,
      challenge,
      timestamp: Date.now(),
    });

    return reply.status(200).send({ success: true, challenge });
  });

  // Agent records manual disposition / override
  server.post<{
    Params: { callId: string };
    Body: { action: 'PASS' | 'STEP_UP' | 'FLAG_FRAUD' | 'TERMINATE'; notes?: string };
  }>('/api/sessions/:callId/verdict', async (request, reply) => {
    const { callId } = request.params;
    const { action, notes } = request.body;
    const session = await sessionManager.getSession(callId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (action === 'PASS') session.status = 'verified';
    if (action === 'FLAG_FRAUD' || action === 'TERMINATE') session.status = 'flagged';
    if (action === 'STEP_UP') session.status = 'evaluating';

    await sessionManager.updateSession(session);

    siemLogger.logSecurityEvent('AGENT_OVERRIDE', session, {
      action,
      notes: notes || 'Manual agent decision',
      riskScoreAtDecision: session.compositeRiskScore,
    });

    broadcastToAgents(callId, {
      type: 'SESSION_STATUS_UPDATED',
      callId,
      status: session.status,
      action,
      timestamp: Date.now(),
    });

    return reply.send({ success: true, session });
  });

  // 5. WebSocket Route: Agent Command Center UI
  server.get('/ws/agent/:callId', { websocket: true }, (socket, req) => {
    const params = req.params as { callId: string };
    const callId = params.callId;

    if (!agentClients.has(callId)) {
      agentClients.set(callId, new Set());
    }
    agentClients.get(callId)!.add(socket);

    server.log.info(`[AgentWS] Agent connected for call ${callId}`);

    // Send initial session snapshot
    sessionManager.getSession(callId).then((sess) => {
      if (sess && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'SESSION_SNAPSHOT', session: sess }));
      }
    });

    socket.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'TRIGGER_CHALLENGE') {
          const chg = challengeEngine.generateChallenge(msg.category, msg.forceHighRisk);
          await sessionManager.attachChallenge(callId, chg);
          broadcastToAgents(callId, { type: 'CHALLENGE_TRIGGERED', callId, challenge: chg });
        }
      } catch (err) {
        server.log.error(err, '[AgentWS] Error parsing agent message');
      }
    });

    socket.on('close', () => {
      agentClients.get(callId)?.delete(socket);
      server.log.info(`[AgentWS] Agent disconnected for call ${callId}`);
    });
  });

  // 6. WebSocket Route: Inbound Telephony Audio Stream (Twilio Media Streams / FreeSWITCH / WebRTC)
  server.get('/ws/telephony/:callId', { websocket: true }, (socket, req) => {
    const params = req.params as { callId: string };
    const callId = params.callId;
    let chunkCounter = 0;
    let challengeStartTime = 0;

    server.log.info(`[TelephonyWS] Inbound audio stream started for call ${callId}`);

    socket.on('message', async (data: Buffer | string, isBinary: boolean) => {
      chunkCounter++;

      // Telephony audio could arrive as raw 16-bit linear PCM binary chunks
      // or JSON-wrapped base64 packets (e.g., Twilio Media Stream `media` events)
      let pcmLength = 0;
      if (isBinary && Buffer.isBuffer(data)) {
        pcmLength = data.length;
      } else {
        try {
          const jsonPkt = JSON.parse(data.toString());
          if (jsonPkt.event === 'media' && jsonPkt.media?.payload) {
            pcmLength = Buffer.from(jsonPkt.media.payload, 'base64').length;
          }
        } catch {
          // Plain text or unparsed
        }
      }

      const session = await sessionManager.getSession(callId);
      if (!session) return;

      // Simulated acoustic anomaly evaluation if standalone, or bridge to Python engine
      // Here we provide the low-latency real-time evaluation logic:
      const activeChg = session.activeChallenge;
      if (activeChg && !challengeStartTime) {
        challengeStartTime = activeChg.createdAt;
      }

      const now = Date.now();
      const currentLatency = activeChg ? now - challengeStartTime : 180 + Math.floor(Math.random() * 40);

      // Analyze acoustic properties
      // In production, this forwards via Redis Pub/Sub / UDP to the Python acoustic worker
      const metrics: AcousticAnomalyMetrics = calculateHeuristicAnomaly(
        callId,
        chunkCounter,
        currentLatency,
        activeChg
      );

      // Update session metrics in Redis/Store
      const updatedSession = await sessionManager.recordAcousticMetrics(callId, metrics);

      if (updatedSession) {
        // Stream telemetry event to connected agent UI
        broadcastToAgents(callId, {
          type: 'TELEMETRY_UPDATE',
          callId,
          metrics,
          compositeRiskScore: updatedSession.compositeRiskScore,
          sessionStatus: updatedSession.status,
          timestamp: now,
          audioChunkSize: pcmLength,
        });

        // Log SIEM anomaly alert if threshold crossed
        if (metrics.syntheticVoiceProbability > 0.65) {
          siemLogger.logAnomalyAlert(metrics, updatedSession);
        }
      }
    });

    socket.on('close', () => {
      server.log.info(`[TelephonyWS] Telephony stream disconnected for call ${callId}`);
    });
  });

  await server.listen({ port: config.port, host: config.host });
  console.log(`[Gateway] Voice-Clone Gateway running on http://${config.host}:${config.port}`);
}

/**
 * High-performance heuristic estimator bridging to acoustic analysis
 */
function calculateHeuristicAnomaly(
  callId: string,
  chunkIndex: number,
  currentLatency: number,
  activeChallenge: VerificationChallenge | null
): AcousticAnomalyMetrics {
  // If no active challenge, base on background acoustic stability
  if (!activeChallenge) {
    return {
      callId,
      timestamp: Date.now(),
      chunkIndex,
      syntheticVoiceProbability: 0.04,
      vocoderArtifactScore: 0.03,
      pitchQuantizationScore: 0.05,
      noiseFloorContinuity: 0.98,
      latencyMs: currentLatency,
      packetJitterMs: 4,
      verdict: 'AUTHENTIC_HUMAN',
    };
  }

  // Evaluate latency vs challenge expected range
  const isLate = currentLatency > activeChallenge.maxToleratedLagMs;
  const isPremature = currentLatency < 100;

  let synthProb = 0.08;
  let vocoderScore = 0.06;
  let pitchScore = 0.07;
  let verdict: AcousticAnomalyMetrics['verdict'] = 'AUTHENTIC_HUMAN';

  if (isLate) {
    synthProb = Math.min(0.96, 0.45 + (currentLatency - activeChallenge.maxToleratedLagMs) / 500);
    vocoderScore = 0.72;
    pitchScore = 0.68;
    verdict = synthProb > 0.65 ? 'SYNTHETIC_DEEPFAKE_ALERT' : 'SUSPICIOUS_ANOMALY';
  } else if (isPremature) {
    synthProb = 0.68;
    verdict = 'SUSPICIOUS_ANOMALY';
  }

  return {
    callId,
    timestamp: Date.now(),
    chunkIndex,
    syntheticVoiceProbability: parseFloat(synthProb.toFixed(3)),
    vocoderArtifactScore: parseFloat(vocoderScore.toFixed(3)),
    pitchQuantizationScore: parseFloat(pitchScore.toFixed(3)),
    noiseFloorContinuity: 0.92,
    latencyMs: currentLatency,
    packetJitterMs: Math.floor(Math.random() * 8) + 2,
    verdict,
  };
}

start().catch((err) => {
  server.log.error(err);
  process.exit(1);
});

