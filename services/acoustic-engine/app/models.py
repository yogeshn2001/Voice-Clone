from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class AudioChunkPayload(BaseModel):
    call_id: str
    chunk_index: int
    sample_rate: int = 16000
    audio_base64: Optional[str] = None
    challenge_id: Optional[str] = None
    elapsed_since_challenge_ms: Optional[float] = None

class AcousticFeatures(BaseModel):
    spectral_rolloff_hz: float
    spectral_flatness: float
    zero_crossing_rate: float
    pitch_jitter_pct: float
    harmonic_to_noise_ratio_db: float
    silence_floor_std_db: float

class AnomalyInferenceResult(BaseModel):
    call_id: str
    timestamp: float
    chunk_index: int
    synthetic_probability: float = Field(..., ge=0.0, le=1.0)
    vocoder_artifact_score: float = Field(..., ge=0.0, le=1.0)
    pitch_quantization_score: float = Field(..., ge=0.0, le=1.0)
    latency_ms: float
    pacing_anomaly: bool
    verdict: Literal["AUTHENTIC_HUMAN", "SUSPICIOUS_ANOMALY", "SYNTHETIC_DEEPFAKE_ALERT"]
    features: AcousticFeatures

