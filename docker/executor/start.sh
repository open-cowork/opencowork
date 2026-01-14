#!/bin/bash
set -e

# Start the original sandbox service (web UI on 8080) in background
/opt/gem/run.sh &

# Wait for gem user to be created by run.sh
sleep 2

cd /app

# Run executor as gem user (non-root) to allow bypassPermissions mode
exec su gem -c "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"
