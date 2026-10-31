import numpy as np
from scipy import signal
from app.models import AcousticFeatures, AnomalyInferenceResult

class RealTimeAcousticAnalyzer:
    """
    Sub-millisecond audio feature extractor & neural vocoder artifact detector.
    Analyzes 16-bit linear PCM audio buffers (16kHz standard telephony).
    """

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate

    def parse_pcm16(self, raw_bytes: bytes) -> np.ndarray:
        """Converts raw byte stream into normalized float32 audio vector [-1.0, 1.0]."""
        if len(raw_bytes) < 2:
            return np.zeros(160, dtype=np.float32)
        int16_data = np.frombuffer(raw_bytes, dtype=np.int16)
        return int16_data.astype(np.float32) / 32768.0

    def compute_features(self, audio: np.ndarray) -> AcousticFeatures:
        """Extracts frequency and temporal features from audio chunk."""
        if len(audio) < 128:
            return AcousticFeatures(
                spectral_rolloff_hz=0.0,
                spectral_flatness=0.0,
                zero_crossing_rate=0.0,
                pitch_jitter_pct=0.0,
                harmonic_to_noise_ratio_db=0.0,
                silence_floor_std_db=0.0,
            )

        # 1. Zero Crossing Rate (ZCR)
        zero_crossings = np.sum(np.abs(np.diff(np.sign(audio)))) / (2 * len(audio))

        # 2. Short-Time Fourier Transform (STFT)
        freqs, psd = signal.welch(audio, fs=self.sample_rate, nperseg=min(len(audio), 512))
        psd_sum = np.sum(psd) + 1e-12

        # 3. Spectral Roll-off (85% cumulative energy threshold)
        cumulative_energy = np.cumsum(psd)
        rolloff_idx = np.searchsorted(cumulative_energy, 0.85 * cumulative_energy[-1])
        spectral_rolloff_hz = float(freqs[min(rolloff_idx, len(freqs) - 1)])

        # 4. Spectral Flatness (Wiener entropy: geometric mean / arithmetic mean)
        geom_mean = np.exp(np.mean(np.log(psd + 1e-12)))
        arith_mean = np.mean(psd) + 1e-12
        spectral_flatness = float(geom_mean / arith_mean)

        # 5. Autocorrelation & Pitch Jitter (F0 Micro-tremor analysis)
        autocorr = np.correlate(audio, audio, mode='full')[len(audio) - 1 :]
        # Search range for human pitch: 80Hz (sample_rate / 80) to 400Hz (sample_rate / 400)
        min_lag = int(self.sample_rate / 400)
        max_lag = int(self.sample_rate / 80)

        pitch_jitter = 0.05
        hnr = 15.0
        if len(autocorr) > max_lag:
            peak_lag = min_lag + np.argmax(autocorr[min_lag:max_lag])
            peak_val = autocorr[peak_lag]
            zero_lag_val = autocorr[0] + 1e-12
            # Harmonic-to-Noise Ratio proxy
            hnr = float(10 * np.log10(max(1e-4, peak_val / max(1e-4, zero_lag_val - peak_val))))
            # Micro-prosody perturbation
            pitch_jitter = float(abs(peak_val / zero_lag_val - 0.75))

        # 6. Silence Noise-Floor Variance (Artificial silence vs ambient human background)
        rms_energy = np.sqrt(np.mean(audio**2) + 1e-12)
        silence_std = float(np.std(audio[: min(len(audio), 256)]))

        return AcousticFeatures(
            spectral_rolloff_hz=round(spectral_rolloff_hz, 2),
            spectral_flatness=round(spectral_flatness, 4),
            zero_crossing_rate=round(float(zero_crossings), 4),
            pitch_jitter_pct=round(min(1.0, pitch_jitter), 3),
            harmonic_to_noise_ratio_db=round(hnr, 2),
            silence_floor_std_db=round(silence_std, 5),
        )

    def analyze_chunk(
        self,
        call_id: str,
        chunk_index: int,
        raw_pcm: bytes,
        elapsed_latency_ms: float = 240.0,
        expected_latency_max_ms: float = 450.0,
    ) -> AnomalyInferenceResult:
        audio = self.parse_pcm16(raw_pcm)
        features = self.compute_features(audio)

        # Anomaly scoring vectors:
        # A. Vocoder Artifact Score:
        # Neural vocoders (HiFi-GAN, WaveGlow) often show sharp cut-off near 7.5kHz or phase smearing
        vocoder_score = 0.05
        if features.spectral_rolloff_hz > 7200 and features.spectral_flatness < 0.015:
            vocoder_score += 0.35
        if features.harmonic_to_noise_ratio_db > 28.0: # Unnaturally clean / lack of human oral cavity noise
            vocoder_score += 0.30

        # B. Pitch Quantization Score:
        # Synthetic speech lacks micro-prosody and human sub-glottal jitter
        pitch_quantization = 0.05
        if features.pitch_jitter_pct < 0.02 or features.pitch_jitter_pct > 0.6:
            pitch_quantization += 0.40

        # C. Latency & Pacing Anomaly:
        pacing_anomaly = elapsed_latency_ms > expected_latency_max_ms
        latency_penalty = 0.0
        if pacing_anomaly:
            excess = elapsed_latency_ms - expected_latency_max_ms
            latency_penalty = min(0.45, excess / 500.0)

        # Composite Synthetic Probability
        composite_prob = min(0.99, (vocoder_score * 0.35) + (pitch_quantization * 0.30) + (latency_penalty * 0.35))
        composite_prob = round(float(composite_prob), 3)

        # Determine Verdict
        if composite_prob > 0.65:
            verdict = "SYNTHETIC_DEEPFAKE_ALERT"
        elif composite_prob > 0.35 or pacing_anomaly:
            verdict = "SUSPICIOUS_ANOMALY"
        else:
            verdict = "AUTHENTIC_HUMAN"

        import time
        return AnomalyInferenceResult(
            call_id=call_id,
            timestamp=time.time(),
            chunk_index=chunk_index,
            synthetic_probability=composite_prob,
            vocoder_artifact_score=round(float(min(1.0, vocoder_score)), 3),
            pitch_quantization_score=round(float(min(1.0, pitch_quantization)), 3),
            latency_ms=round(elapsed_latency_ms, 1),
            pacing_anomaly=pacing_anomaly,
            verdict=verdict,
            features=features,
        )

