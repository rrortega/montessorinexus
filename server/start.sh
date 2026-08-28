#!/bin/bash
set -e

echo "===================================================="
echo "🚀 Ceiba Roots - Production Container Starting..."
echo "🕒 Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "📌 Service Role: ${SERVICE_ROLE:-all}"
echo "===================================================="

# Graceful termination handler
cleanup() {
  echo "🛑 Received termination signal. Shutting down all processes..."
  kill -TERM "$CHILD_PIDS" 2>/dev/null || true
  wait
  echo "👋 Container shutdown complete."
  exit 0
}

trap cleanup SIGINT SIGTERM

CHILD_PIDS=""

# Ensure required directories exist
mkdir -p /app/storage /app/server/data

# Run database migrations if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Checking and applying database migrations..."
  npx prisma db push --skip-generate || echo "⚠️ Warning: Prisma db push encountered an issue, proceeding..."
fi

# 1. Standalone Worker Role
if [ "$SERVICE_ROLE" = "worker" ]; then
  echo "⚙️  Starting BullMQ Workers with Xvfb virtual display..."
  if command -v xvfb-run >/dev/null 2>&1; then
    exec xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node server/worker.js
  else
    exec node server/worker.js
  fi

# 2. Standalone Web Role
elif [ "$SERVICE_ROLE" = "web" ]; then
  echo "🌐 Starting Express API & Web Server..."
  exec node server/index.js

# 3. Combined Role (Default: Runs Web + Worker inside single container)
else
  echo "⚙️  Starting BullMQ Workers in background (Xvfb)..."
  if command -v xvfb-run >/dev/null 2>&1; then
    xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node server/worker.js &
    WORKER_PID=$!
  else
    node server/worker.js &
    WORKER_PID=$!
  fi
  CHILD_PIDS="$WORKER_PID"

  echo "🌐 Starting Express API & Web Server..."
  node server/index.js &
  WEB_PID=$!
  CHILD_PIDS="$CHILD_PIDS $WEB_PID"

  # Wait for any process to exit
  wait -n $CHILD_PIDS
  cleanup
fi
