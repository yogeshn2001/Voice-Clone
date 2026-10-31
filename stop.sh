#!/usr/bin/env bash

# VERIVOX // Multi-Service Stop Script
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_ROOT/.pids"

echo "=========================================================="
echo " Stopping VERIVOX Voice-Clone Verification Protocol Stack"
echo "=========================================================="

if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "Killing process PID: $pid"
            kill "$pid" 2>/dev/null
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Fallback: kill by port binding to ensure clean shutdown
echo "Ensuring ports 8000, 8001, and 5173 are released..."
for port in 8000 8001 5173; do
    pids=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "Releasing port :$port (PIDs: $pids)"
        kill -9 $pids 2>/dev/null
    fi
done

echo "=========================================================="
echo " VERIVOX Stack successfully stopped."
echo "=========================================================="

