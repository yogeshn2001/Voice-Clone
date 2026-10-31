import { v4 as uuidv4 } from 'uuid';
import { VerificationChallenge, ChallengeCategory } from './types.js';

interface ChallengeTemplate {
  category: ChallengeCategory;
  difficulty: 'standard' | 'elevated' | 'high_risk';
  entropyScore: number;
  expectedLatencyMinMs: number;
  expectedLatencyMaxMs: number;
  maxToleratedLagMs: number;
  generate: () => { prompt: string; agentInstruction: string; expectedTokens: string[] };
}

export class DynamicChallengeEngine {
  private templates: ChallengeTemplate[] = [
    // 1. Pacing & Reflex Disruption (Targets LLM/TTS Pipeline Latency Budget)
    {
      category: 'pacing_disruption',
      difficulty: 'standard',
      entropyScore: 0.88,
      expectedLatencyMinMs: 180,
      expectedLatencyMaxMs: 400,
      maxToleratedLagMs: 580,
      generate: () => {
        const triggers = ['BEEP', 'NOW', 'JUMP', 'FLASH'];
        const responses = ['HALT', 'BLUE', 'FAST', 'NINE'];
        const trigger = triggers[Math.floor(Math.random() * triggers.length)];
        const response = responses[Math.floor(Math.random() * responses.length)];
        return {
          prompt: `Immediately after you hear me say '${trigger}', shout '${response}'. Ready... ${trigger}!`,
          agentInstruction: `Read prompt with a 1-second pause before the trigger word '${trigger}'. Measure immediate caller reaction reflex.`,
          expectedTokens: [response.toLowerCase()],
        };
      },
    },
    {
      category: 'pacing_disruption',
      difficulty: 'elevated',
      entropyScore: 0.92,
      expectedLatencyMinMs: 250,
      expectedLatencyMaxMs: 500,
      maxToleratedLagMs: 650,
      generate: () => {
        const digits = [
          Math.floor(Math.random() * 9) + 1,
          Math.floor(Math.random() * 9) + 1,
          Math.floor(Math.random() * 9) + 1,
        ];
        return {
          prompt: `Please say the digits ${digits.join(', ')} with an exact one-second silence between each digit.`,
          agentInstruction: `Verify caller cadence. Generative speech models struggle with intentional inter-token silence pacing.`,
          expectedTokens: digits.map(String),
        };
      },
    },

    // 2. Cognitive & Non-Linear Logic (Breaks Generative Conversational Bots)
    {
      category: 'cognitive_puzzle',
      difficulty: 'elevated',
      entropyScore: 0.95,
      expectedLatencyMinMs: 400,
      expectedLatencyMaxMs: 900,
      maxToleratedLagMs: 1400,
      generate: () => {
        const words = ['CLOUD', 'TIGER', 'BRICK', 'OCEAN', 'SOLAR'];
        const selected = words[Math.floor(Math.random() * words.length)];
        const reversed = selected.split('').reverse().join('');
        return {
          prompt: `To verify your line, please spell the word '${selected}' backwards phonetically.`,
          agentInstruction: `Listen for immediate human mental reversal (${reversed}). AI bots incur heavy token-generation and correction delays.`,
          expectedTokens: reversed.split('').map((c) => c.toLowerCase()),
        };
      },
    },
    {
      category: 'semantic_inversion',
      difficulty: 'high_risk',
      entropyScore: 0.98,
      expectedLatencyMinMs: 350,
      expectedLatencyMaxMs: 850,
      maxToleratedLagMs: 1200,
      generate: () => {
        const scenarios = [
          { q: 'What color is fresh grass?', anti: 'BLUE', forbidden: 'GREEN' },
          { q: 'Is ice hot or cold?', anti: 'BOILING', forbidden: 'COLD' },
          { q: 'Does an elephant fly or walk?', anti: 'SWIM', forbidden: 'WALK' },
        ];
        const item = scenarios[Math.floor(Math.random() * scenarios.length)];
        return {
          prompt: `Answer this question with an intentionally WRONG answer: ${item.q}`,
          agentInstruction: `Caller must say an incorrect answer. Standard AI voice agents defaults to factually correct answers (${item.forbidden}).`,
          expectedTokens: [item.anti.toLowerCase()],
        };
      },
    },

    // 3. Phonetic Stress & Glottal Shock (Exposes Neural Vocoder Artifacts)
    {
      category: 'phonetic_stress',
      difficulty: 'high_risk',
      entropyScore: 0.91,
      expectedLatencyMinMs: 300,
      expectedLatencyMaxMs: 700,
      maxToleratedLagMs: 1000,
      generate: () => {
        const phrases = [
          { text: 'Hum for one second, then sharply say: Pop-Tart Pack', cues: ['hum', 'pop', 'tart', 'pack'] },
          { text: 'Whisper the word "Quiet", then immediately cough once', cues: ['quiet', 'cough'] },
          { text: 'Say "Red Leather, Yellow Leather" as fast as possible', cues: ['red', 'leather', 'yellow'] },
        ];
        const chosen = phrases[Math.floor(Math.random() * phrases.length)];
        return {
          prompt: `Security protocol check: Please ${chosen.text}.`,
          agentInstruction: `Listen for organic glottal stops, non-speech vocal tract transitions, and room reverberation.`,
          expectedTokens: chosen.cues,
        };
      },
    },
  ];

  /**
   * Generates a dynamic challenge tailored to the caller's current risk level.
   */
  public generateChallenge(categoryPreference?: ChallengeCategory, forceHighRisk = false): VerificationChallenge {
    let pool = this.templates;
    if (categoryPreference) {
      pool = pool.filter((t) => t.category === categoryPreference);
    }
    if (forceHighRisk) {
      const highRiskPool = pool.filter((t) => t.difficulty === 'high_risk');
      if (highRiskPool.length > 0) pool = highRiskPool;
    }

    const template = pool[Math.floor(Math.random() * pool.length)] || this.templates[0];
    const generated = template.generate();
    const now = Date.now();
    const ttlMs = 45000; // 45-second challenge validity window

    return {
      id: `chg_${uuidv4().substring(0, 8)}`,
      category: template.category,
      promptText: generated.prompt,
      instructionForAgent: generated.agentInstruction,
      expectedTokens: generated.expectedTokens,
      expectedLatencyMinMs: template.expectedLatencyMinMs,
      expectedLatencyMaxMs: template.expectedLatencyMaxMs,
      maxToleratedLagMs: template.maxToleratedLagMs,
      difficulty: template.difficulty,
      entropyScore: template.entropyScore,
      createdAt: now,
      expiresAt: now + ttlMs,
    };
  }

  /**
   * Evaluates reaction timing against the challenge window.
   */
  public evaluateTiming(
    challenge: VerificationChallenge,
    observedLatencyMs: number
  ): {
    timingVerdict: 'NORMAL_HUMAN' | 'ANOMALOUS_DELAY' | 'PRE_CACHED_OR_TOO_FAST';
    timingConfidenceScore: number; // 0 (likely bot) to 1.0 (authentic human timing)
    latencyDeltaMs: number;
  } {
    // If response was issued faster than human physical reflex (<120ms), it's likely automated or premature
    if (observedLatencyMs < 120) {
      return {
        timingVerdict: 'PRE_CACHED_OR_TOO_FAST',
        timingConfidenceScore: 0.2,
        latencyDeltaMs: observedLatencyMs - challenge.expectedLatencyMinMs,
      };
    }

    // Typical human reflex and processing window
    if (observedLatencyMs <= challenge.expectedLatencyMaxMs) {
      return {
        timingVerdict: 'NORMAL_HUMAN',
        timingConfidenceScore: 0.95,
        latencyDeltaMs: 0,
      };
    }

    // Elevated delay (could be hesitation or pipeline buffer)
    if (observedLatencyMs <= challenge.maxToleratedLagMs) {
      const penalty = (observedLatencyMs - challenge.expectedLatencyMaxMs) / (challenge.maxToleratedLagMs - challenge.expectedLatencyMaxMs);
      return {
        timingVerdict: 'ANOMALOUS_DELAY',
        timingConfidenceScore: Math.max(0.4, 0.9 - penalty * 0.5),
        latencyDeltaMs: observedLatencyMs - challenge.expectedLatencyMaxMs,
      };
    }

    // Beyond max tolerated lag: typical signature of LLM + TTS synthesis chain
    return {
      timingVerdict: 'ANOMALOUS_DELAY',
      timingConfidenceScore: 0.15,
      latencyDeltaMs: observedLatencyMs - challenge.maxToleratedLagMs,
    };
  }
}

