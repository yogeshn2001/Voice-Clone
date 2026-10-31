#!/usr/bin/env bash

# VERIVOX // Multi-Service Start Script
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_ROOT/.pids"

echo "=========================================================="
echo " Starting VERIVOX Voice-Clone Verification Protocol Stack"
echo "=========================================================="

# Check if already running
if [ -f "$PID_FILE" ]; then
    echo "[!] Existing .pids file found. Running stop script first..."
    "$PROJECT_ROOT/stop.sh"
fi

rm -f "$PID_FILE"
touch "$PID_FILE"

# 1. Start Python Acoustic Engine (Port 8001)
echo ">>> [1/3] Starting Python Acoustic Engine on :8001..."
cd "$PROJECT_ROOT/services/acoustic-engine"
if [ ! -d "venv" ]; then
    echo "    📦 Setting up Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip > /dev/null 2>&1
    ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 > "$PROJECT_ROOT/acoustic.log" 2>&1 &
ACOUSTIC_PID=$!
echo $ACOUSTIC_PID >> "$PID_FILE"
echo "    ✓ Acoustic Engine started (PID: $ACOUSTIC_PID)"

# 2. Start Gateway Service (Port 8000)
echo ">>> [2/3] Starting Node.js Fastify Gateway on :8000..."
cd "$PROJECT_ROOT/services/gateway"
if [ ! -d "node_modules" ]; then
    echo "    📦 Installing Gateway dependencies..."
    npm install
fi
if [ ! -d "dist" ]; then
    echo "    🔨 Building Gateway TypeScript..."
    npm run build
fi
node dist/server.js > "$PROJECT_ROOT/gateway.log" 2>&1 &
GATEWAY_PID=$!
echo $GATEWAY_PID >> "$PID_FILE"
echo "    ✓ Gateway started (PID: $GATEWAY_PID)"

# 3. Start Frontend Dashboard (Port 5173)
echo ">>> [3/3] Starting React Vite Frontend on :5173..."
cd "$PROJECT_ROOT/services/frontend"
if [ ! -d "node_modules" ]; then
    echo "    📦 Installing Frontend dependencies..."
    npm install
fi
npx vite --host 0.0.0.0 --port 5173 > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$PID_FILE"
echo "    ✓ Frontend started (PID: $FRONTEND_PID)"

echo "=========================================================="
echo " VERIVOX Stack is LIVE and Running!"
echo " - Agent Command Center : http://localhost:5173"
echo " - Gateway WebSocket API: http://localhost:8000"
echo " - Acoustic Engine API  : http://localhost:8001/docs"
echo "=========================================================="
echo "To stop the stack, run: ./stop.sh"

