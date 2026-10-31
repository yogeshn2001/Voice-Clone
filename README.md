# Voice-Clone Consent Verification Protocol (VERIVOX)
> Real-Time Challenge-Response Anti-Deepfake Verification Platform for Enterprise Call Centers

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Fastify](https://img.shields.io/badge/Fastify-v4-black.svg)](https://www.fastify.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.111-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

VERIVOX is an enterprise-grade challenge-response verification system engineered to detect and neutralize zero-shot generative AI voice clones (ElevenLabs, CosyVoice, VALL-E), automated conversational speech bots, and real-time voice conversion (RVC) impersonators during live customer support and banking calls.

---

## 🚀 Key Architectural Pillars

* **Dynamic Challenge Engine**: Generates unpredictable cognitive, phonetic, and pacing challenges that exploit the mechanical latency and acoustic bottlenecks of generative speech pipelines.
* **Real-Time Acoustic Anomaly Pipeline**: Sub-30ms audio processing detecting neural vocoder artifacts (HiFi-GAN 7.5 kHz phase cutoff smearing), pitch quantization ($F_0$ smoothing), and unnatural digital zero noise gating.
* **Agent Command Center**: Dark-mode, uncluttered, high-contrast mission control dashboard featuring real-time risk gauges, dual-channel audio canvas, millisecond turn-taking reflex tracker, and 1-click agent teleprompter.
* **Enterprise Security & SIEM Stream**: Common Event Format (CEF) and JSON audit streaming with tamper-evident SHA-256 integrity hashes for Splunk, Elastic, and Datadog.

---

## 📋 System Prerequisites

Before cloning and running the project, ensure your machine has the following tools installed:

| Requirement | Minimum Version | Check Command | Installation Guide |
| :--- | :--- | :--- | :--- |
| **Git** | Any modern version | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Node.js** | `v18.0.0+` (v20+ recommended) | `node -v` | [nodejs.org](https://nodejs.org/) or via `nvm` |
| **npm** | `v9.0.0+` | `npm -v` | Bundled with Node.js |
| **Python** | `3.10+` | `python3 --version` | [python.org](https://www.python.org/) or via `brew install python@3.10` |
| **Docker & Compose** *(Optional)* | `v20.10+` | `docker --version` | [docker.com](https://www.docker.com/) (Required only for containerized deployment) |

---

## 📥 Step-by-Step GitHub Setup Guide

### 1. Clone the Repository

```bash
# Clone the repository via Git
git clone https://github.com/your-org/Voice-Clone.git

# Enter the project directory
cd Voice-Clone
```

---

### 2. Launch the Stack

You can launch the stack using either the automated **1-Click Shell Script** (recommended for local development) or **Docker Compose** (recommended for production/containers):

#### Option A: 1-Click Automated Script (Recommended)

The provided `start.sh` script automatically detects missing dependencies, sets up the Python virtual environment, installs npm packages, builds TypeScript, and launches all 3 background services:

```bash
# Ensure execution permissions (only required once)
chmod +x start.sh stop.sh

# Start the complete stack
./start.sh
```

#### What this script does automatically:
1. Provisions the Python virtual environment in `services/acoustic-engine/venv` and installs PyPI requirements.
2. Installs gateway dependencies and compiles TypeScript into `services/gateway/dist`.
3. Installs frontend dependencies and launches the Vite dev server on port `5173`.
4. Tracks active process IDs in `.pids` and routes logs to `gateway.log`, `acoustic.log`, and `frontend.log`.

---

#### Option B: Docker Compose (All Containers)

If you prefer running everything in isolated Docker containers:

```bash
# Build and start all 4 containers (Redis, Gateway, Acoustic Engine, Frontend)
docker-compose up --build

# Or run in detached background mode:
docker-compose up -d --build
```

---

#### Option C: Manual Setup (Separate Terminals)

If you prefer to start each service manually in separate terminal windows:

##### Terminal 1: In-Memory Redis (Optional - Gateway falls back to memory if skipped)
```bash
docker run -d -p 6379:6379 --name redis-voice redis:7-alpine
```

##### Terminal 2: Python Acoustic Analysis Engine
```bash
cd services/acoustic-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

##### Terminal 3: Node.js Fastify Gateway
```bash
cd services/gateway
npm install
npm run dev
```

##### Terminal 4: React Agent Dashboard
```bash
cd services/frontend
npm install
npm run dev
```

---

## 🌐 Live Service Endpoints

Once the stack is running, access the interfaces:

| Interface | URL | Description |
| :--- | :--- | :--- |
| **Agent Command Center** | **[http://localhost:5173](http://localhost:5173)** | High-contrast SaaS mission control dashboard with real-time waveform canvas, circular risk gauges, and teleprompter. |
| **Audio Streaming Gateway** | **[http://localhost:8000](http://localhost:8000)** | Fastify WebSocket audio streaming mesh. (Health probe: [`/api/health`](http://localhost:8000/api/health)) |
| **Acoustic Analysis API** | **[http://localhost:8001/docs](http://localhost:8001/docs)** | Interactive Swagger UI for the sub-15ms NumPy/SciPy audio feature extractor. |

---

## 🧪 Testing the Verification Protocol

The Agent Dashboard includes a built-in **Interactive Telephony Simulator** that allows developers and security analysts to test the defense mechanics without an active telecom PBX or SIP trunk:

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. Click **"Interactive Simulator"** in the top navigation bar.
3. Test the three realistic attack and authentic profiles:
   * **Scenario A (Authentic Human Caller)**: Injects an organic reflex timing ($235\text{ ms}$) and natural glottal micro-prosody. The system verifies identity with $<10\%$ risk score.
   * **Scenario B (LLM + Neural Voice Clone Attack)**: Simulates a $780\text{ ms}$ bot pipeline latency buffer (ASR + LLM generation + ElevenLabs TTS synthesis) and a $7.8\text{ kHz}$ vocoder phase cutoff. Triggers a **$91\%$ Crimson Deepfake Alert**.
   * **Scenario C (Real-Time Voice Changer / RVC)**: Simulates human-fast conversational reflex ($320\text{ ms}$), but triggers pitch quantization and spectral phase smearing alerts ($61\%$ risk score).
4. Use the bottom action buttons or hotkeys (`[P]` Pass, `[S]` Step-Up, `[F]` Terminate) to record agent dispositions and observe the real-time SIEM audit log stream.

---

## 🛑 How to Stop the Project

### If running via `./start.sh`:
```bash
./stop.sh
```
*Gracefully terminates all background services and releases ports `5173`, `8000`, and `8001`.*

### If running via Docker Compose:
```bash
docker-compose down
```

---

## ⚙️ Environment Configuration

Default configuration works out of the box for local development. For production deployments, configure environment variables:

### Gateway (`services/gateway/.env`)
```ini
PORT=8000
HOST=0.0.0.0
REDIS_URL=redis://localhost:6379
ACOUSTIC_ENGINE_URL=http://localhost:8001
RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW_MS=60000
HMAC_SECRET=your-enterprise-hmac-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Acoustic Engine (`services/acoustic-engine/.env`)
```ini
SAMPLE_RATE=16000
REDIS_URL=redis://localhost:6379
```

---

## 📂 Repository Structure & File Dictionary

> 📖 **Full Technical File Dictionary**: For an exhaustive, file-by-file breakdown of all 37 files, their architectural mechanics, and security responsibilities, refer to [SYSTEM_ARCHITECTURE_BOILERPLATE_GUIDE.md](SYSTEM_ARCHITECTURE_BOILERPLATE_GUIDE.md#6-comprehensive-file-by-file-functional-dictionary).

```
├── .gitignore                               # Git ignore rules for node_modules, venv, logs, and artifacts
├── SYSTEM_ARCHITECTURE_BOILERPLATE_GUIDE.md # Exhaustive file-by-file dictionary & system blueprint
├── docker-compose.yml                       # Multi-service container orchestration
├── start.sh                                 # 1-Click stack launch script (automated dependencies)
├── stop.sh                                  # 1-Click stack shutdown script (clean port release)
├── docs/
│   ├── ARCHITECTURE.md                      # Latency budgets, threat models & SIEM specifications
│   └── SYSTEM_ARCHITECTURE_BOILERPLATE_GUIDE.md # Documentation mirror
├── services/
│   ├── gateway/                             # Node.js Fastify WebSocket Audio Gateway
│   │   ├── src/
│   │   │   ├── challengeEngine.ts           # Dynamic challenge generation & entropy scoring
│   │   │   ├── sessionManager.ts            # Redis state store with zero-downtime memory fallback
│   │   │   ├── siemLogger.ts                # Structured CEF & JSON audit logger with SHA-256 signatures
│   │   │   ├── config.ts                    # Rate limits, HMAC secrets, VoIP frame settings
│   │   │   ├── types.ts                     # Protocol data models & session contracts
│   │   │   └── server.ts                    # Fastify WebSocket server & REST endpoints
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── acoustic-engine/                     # Real-Time DSP & Vocoder Anomaly Microservice (Python/FastAPI)
│   │   ├── app/
│   │   │   ├── analyzer.py                  # STFT, Wiener flatness, rolloff, pitch jitter detection
│   │   │   ├── models.py                    # Pydantic schemas for audio frames & metrics
│   │   │   └── main.py                      # FastAPI WebSocket & REST audio inference endpoints
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── frontend/                            # Agent Command Center (React 18 + Vite + Tailwind CSS)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Header.tsx               # Call status, ANI metadata, duration timer
│       │   │   ├── RiskGauge.tsx            # Dynamic SVG circular risk gauge (0-100%)
│       │   │   ├── AudioVisualizer.tsx      # HTML5 Canvas real-time waveform & anomaly heatmap
│       │   │   ├── LatencyGraph.tsx         # Millisecond turn-taking line graph (Human vs AI threshold)
│       │   │   ├── ChallengePanel.tsx       # 1-click challenge dispatcher & agent teleprompter
│       │   │   ├── FeatureMeter.tsx         # DSP feature vectors (Vocoder, Pitch, Noise Floor)
│       │   │   ├── SiemAuditLog.tsx         # Real-time streaming SIEM audit log
│       │   │   └── CallSimulatorModal.tsx   # Interactive test suite (Human vs Clone vs RVC)
│       │   ├── App.tsx                      # 12-column responsive mission control dashboard
│       │   └── types.ts
│       ├── nginx.conf                       # Production reverse proxy configuration
│       ├── Dockerfile
│       └── package.json
```

---

## 🔧 Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Permission denied: ./start.sh` | Missing execute bit on scripts | Run `chmod +x start.sh stop.sh` |
| `listen EADDRINUSE: 0.0.0.0:8000` | Port `8000`, `8001`, or `5173` in use | Run `./stop.sh` to release the ports |
| `Redis not reachable (offline)` | Redis container not running | Safe to ignore. The gateway automatically operates in high-speed in-memory fallback mode. |
| Python audio build error on macOS | Missing FFmpeg C libraries | Run `brew install ffmpeg` |

---

## 📄 License
This project is licensed under the MIT License.
