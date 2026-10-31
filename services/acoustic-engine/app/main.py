import os
import base64
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.analyzer import RealTimeAcousticAnalyzer
from app.models import AudioChunkPayload, AnomalyInferenceResult

app = FastAPI(
    title="Voice-Clone Acoustic Analysis Microservice",
    version="1.0.0",
    description="Sub-30ms audio processing microservice for neural vocoder artifact and pacing anomaly detection",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = RealTimeAcousticAnalyzer(sample_rate=16000)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "acoustic-engine",
        "sample_rate": analyzer.sample_rate,
        "engine": "NumPy/SciPy Accelerated",
    }

@app.post("/api/analyze/chunk", response_model=AnomalyInferenceResult)
async def analyze_chunk_rest(payload: AudioChunkPayload):
    try:
        raw_pcm = b""
        if payload.audio_base64:
            raw_pcm = base64.b64decode(payload.audio_base64)
        else:
            # Synthetic 20ms silence frame for testing
            raw_pcm = b"\x00" * 640

        latency = payload.elapsed_since_challenge_ms or 220.0
        result = analyzer.analyze_chunk(
            call_id=payload.call_id,
            chunk_index=payload.chunk_index,
            raw_pcm=raw_pcm,
            elapsed_latency_ms=latency,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/analyze/{call_id}")
async def websocket_acoustic_stream(websocket: WebSocket, call_id: str):
    await websocket.accept()
    chunk_counter = 0
    try:
        while True:
            # Accept raw binary PCM chunks or JSON base64 frames
            message = await websocket.receive()
            chunk_counter += 1
            raw_pcm = b""

            if "bytes" in message and message["bytes"]:
                raw_pcm = message["bytes"]
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    if "audio_base64" in data:
                        raw_pcm = base64.b64decode(data["audio_base64"])
                except Exception:
                    raw_pcm = b"\x00" * 640

            result = analyzer.analyze_chunk(
                call_id=call_id,
                chunk_index=chunk_counter,
                raw_pcm=raw_pcm,
                elapsed_latency_ms=210.0 + (chunk_counter % 5) * 12,
            )

            await websocket.send_text(result.model_dump_json())
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close(code=1011, reason=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

