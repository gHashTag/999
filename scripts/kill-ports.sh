#!/bin/bash
# Script to kill processes listening on specified ports
# Version 3: Uses kill -9, verifies port release with lsof

PORTS_TO_KILL=(8288 8289 4173 3000 5000 8484) # Ensure 3000 is included
MAX_WAIT_SECONDS=5 # Max time to wait for port to free up

echo "🧹 Cleaning up ports: ${PORTS_TO_KILL[*]}..."

for PORT in "${PORTS_TO_KILL[@]}"; do
  # Use lsof to find the PID(s) listening on the TCP port
  PIDS=$(lsof -t -i TCP:"$PORT" || true)

  if [ -n "$PIDS" ]; then
    echo "   Killing processes on port $PORT: $PIDS"
    # Loop through each PID found for the port
    for PID in $PIDS; do
      # Check if PID is actually a number before attempting to kill
      if [[ "$PID" =~ ^[0-9]+$ ]]; then 
        echo "      ↳ Forcefully killing PID $PID (kill -9)..."
        # Use kill command; add -9 for forceful kill if needed
        kill -9 "$PID" 2>/dev/null || echo "      ↳ Failed to kill PID $PID (maybe already stopped?)"
      else
         echo "      ↳ Found non-PID output for port $PORT: $PID (ignoring)"
      fi
    done

    # Wait and verify port is free
    echo -n "      ↳ Waiting for port $PORT to free up... "
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT_SECONDS ]; do
        CURRENT_PIDS=$(lsof -t -i TCP:"$PORT" || true)
        if [ -z "$CURRENT_PIDS" ]; then
            echo "OK."
            break
        fi
        sleep 1
        echo -n "."
        ((WAIT_COUNT++))
    done

    if [ $WAIT_COUNT -eq $MAX_WAIT_SECONDS ]; then
        echo "TIMEOUT! Port $PORT might still be in use."
    fi

  else
    echo "   💨 Port $PORT is already free."
  fi
done

echo "✅ Port cleanup finished." 