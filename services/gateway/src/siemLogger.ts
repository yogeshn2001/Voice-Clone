import crypto from 'crypto';
import { TelemetryEvent, AcousticAnomalyMetrics, CallSession } from './types.js';

export class SiemAuditLogger {
  private serviceName = 'VoiceCloneVerificationProtocol';
  private version = '1.0.0';

  /**
   * Generates a tamper-evident SHA-256 fingerprint for audit records.
   */
  private generateEventHash(eventPayload: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(eventPayload)).digest('hex');
  }

  /**
   * Formats event for Enterprise SIEM (Splunk, Elastic, Datadog) in structured JSON.
   */
  public logSecurityEvent(
    eventType: TelemetryEvent['eventType'],
    session: Partial<CallSession>,
    details: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const eventId = `sec_${crypto.randomUUID()}`;

    const rawPayload = {
      event_id: eventId,
      timestamp,
      service: this.serviceName,
      version: this.version,
      event_type: eventType,
      session_id: session.callId || 'unknown_session',
      caller_id: session.callerId || 'anonymous',
      agent_id: session.agentId || 'system',
      session_status: session.status || 'evaluating',
      composite_risk_score: session.compositeRiskScore ?? 0,
      details,
    };

    const integrityHash = this.generateEventHash(rawPayload);
    const finalizedLog = {
      ...rawPayload,
      integrity_hash: integrityHash,
    };

    // Standard SIEM JSON output stream (ingested by FluentBit/Filebeat/Vector)
    console.log(`[SIEM_AUDIT] ${JSON.stringify(finalizedLog)}`);

    // In Common Event Format (CEF) for legacy ArcSight/QRadar:
    const cefSeverity = (session.compositeRiskScore ?? 0) > 65 ? 8 : (session.compositeRiskScore ?? 0) > 35 ? 5 : 2;
    const cefLog = `CEF:0|EnterpriseSecurity|${this.serviceName}|${this.version}|${eventType}|Voice Verification Event|${cefSeverity}|src=${session.callerId} cs1=${session.callId} cs2=${session.status} cn1=${session.compositeRiskScore} msg=${JSON.stringify(details)}`;
    
    // Debug output or secondary SIEM sink
    if (process.env.DEBUG_CEF) {
      console.log(`[CEF_LOG] ${cefLog}`);
    }
  }

  public logAnomalyAlert(metrics: AcousticAnomalyMetrics, session: CallSession): void {
    this.logSecurityEvent('ANOMALY_DETECTED', session, {
      synthetic_voice_probability: metrics.syntheticVoiceProbability,
      vocoder_artifact_score: metrics.vocoderArtifactScore,
      pitch_quantization_score: metrics.pitchQuantizationScore,
      latency_ms: metrics.latencyMs,
      verdict: metrics.verdict,
      alert_triggered: metrics.syntheticVoiceProbability > 0.65,
    });
  }
}

