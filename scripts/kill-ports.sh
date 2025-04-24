#!/bin/bash
# Script to kill processes listening on specified ports

PORTS_TO_KILL=(8288 8289 4173)

echo "🧹 Cleaning up ports: ${PORTS_TO_KILL[*]}..."

for PORT in "${PORTS_TO_KILL[@]}"; do
  # Use lsof to find the PID listening on the TCP port
  # -t outputs only PIDs
  # -i TCP:$PORT specifies the TCP port
  # || true prevents the script from exiting if lsof finds nothing
  PID=$(lsof -t -i TCP:"$PORT" || true)

  if [ -n "$PID" ]; then
    echo "   🔪 Found process PID $PID on port $PORT. Terminating..."
    # Kill the process(es). Use kill -9 for forceful termination if needed.
    kill "$PID" || echo "   ⚠️ Failed to kill PID $PID (maybe already stopped?)"
    sleep 0.5 # Give a moment for the port to be released
  else
    echo "   💨 Port $PORT is already free."
  fi
done

echo "✅ Port cleanup finished." 