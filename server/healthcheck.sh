#!/bin/bash
ROLE="${SERVICE_ROLE:-all}"
PORT="${PORT:-3001}"

if [ "$ROLE" = "worker" ]; then
  # Worker role: verify the worker node process is alive
  pgrep -f "server/worker.js" >/dev/null 2>&1 || exit 1
  exit 0
elif [ "$ROLE" = "web" ]; then
  # Web role: verify the Express HTTP server is responding
  curl -f "http://localhost:${PORT}/api/health" >/dev/null 2>&1 || exit 1
  exit 0
else
  # Combined role (all): verify HTTP healthcheck and worker process
  curl -f "http://localhost:${PORT}/api/health" >/dev/null 2>&1 || exit 1
  pgrep -f "server/worker.js" >/dev/null 2>&1 || exit 1
  exit 0
fi
