#!/usr/bin/env bash

echo "Stopping VoxCivis services..."
pkill -f "python3 run.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
echo "VoxCivis stopped successfully."
