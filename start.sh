#!/usr/bin/env bash

# VoxCivis Launcher
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=================================================="
echo " Starting VoxCivis Municipal Portal"
echo " Project Directory: $PROJECT_DIR"
echo "=================================================="

# Stop previous instances
pkill -f "python3 run.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# 1. Start Backend with nohup
echo "-> Starting Backend API (FastAPI) on http://127.0.0.1:8000..."
cd "$PROJECT_DIR/backend" || exit 1
nohup python3 run.py > /tmp/voxcivis_backend.log 2>&1 &

# Wait for backend
sleep 2

# 2. Start Frontend with nohup
echo "-> Starting Frontend Web App (React + Vite) on http://localhost:5173..."
cd "$PROJECT_DIR/frontend" || exit 1
nohup npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/voxcivis_frontend.log 2>&1 &

sleep 2

echo "=================================================="
echo " VoxCivis is LIVE!"
echo " Open in your browser: http://localhost:5173"
echo " Backend API Docs:     http://127.0.0.1:8000/docs"
echo "=================================================="
echo "To stop VoxCivis anytime, run: ./stop.sh"
