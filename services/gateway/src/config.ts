import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  acousticEngineUrl: process.env.ACOUSTIC_ENGINE_URL || 'http://localhost:8001',
  acousticEngineWsUrl: process.env.ACOUSTIC_ENGINE_WS_URL || 'ws://localhost:8001/ws/analyze',
  
  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '120', 10), // Max requests per window
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute window

  // Security & Webhook Signatures
  hmacSecret: process.env.HMAC_SECRET || 'voice-clone-enterprise-secure-hmac-key',
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],

  // Telephony Audio Parameters
  sampleRate: 16000,
  frameDurationMs: 20, // 20ms audio frames (standard VoIP/WebRTC)
  bytesPerSample: 2,   // 16-bit linear PCM
  channels: 1,

  // Latency & Risk Thresholds
  humanBaselineLatencyMinMs: 200,
  humanBaselineLatencyMaxMs: 450,
  deepfakeLatencyAlertThresholdMs: 650,
  riskAlertThreshold: 65, // Composite score > 65% triggers fraud alert
};

