#!/bin/bash
# Script to kill processes listening on specified ports
# Version 2: Handles multiple PIDs per port

PORTS_TO_KILL=(8288 8289 4173 3000) # Ensure 3000 is included

echo "🧹 Cleaning up ports: ${PORTS_TO_KILL[*]}..."

for PORT in "${PORTS_TO_KILL[@]}"; do
  # Use lsof to find the PID(s) listening on the TCP port
  PIDS=$(lsof -t -i TCP:"$PORT" || true)

  if [ -n "$PIDS" ]; then
    # Loop through each PID found for the port
    for PID in $PIDS; do
      # Check if PID is actually a number before attempting to kill
      if [[ "$PID" =~ ^[0-9]+$ ]]; then 
        echo "   🔪 Found process PID $PID on port $PORT. Terminating..."
        # Use kill command; add -9 for forceful kill if needed
        kill "$PID" 
        if [ $? -ne 0 ]; then
            echo "   ⚠️ Failed to kill PID $PID (maybe already stopped or requires sudo?)"
        fi
      else
         echo "   ❓ Found non-PID output for port $PORT: $PID (ignoring)"
      fi
    done
    sleep 0.5 # Give a moment for the port to be released
  else
    echo "   💨 Port $PORT is already free."
  fi
done

echo "✅ Port cleanup finished." 