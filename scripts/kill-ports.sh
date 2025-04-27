#!/bin/bash

# Add chalk colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports to kill
PORTS=(8484 8288)

for port in "${PORTS[@]}"; do
  PID=$(lsof -ti :$port)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW}Killing process on port $port (PID: $PID)${NC}"
    kill -9 $PID
    echo -e "${GREEN}Successfully killed process on port $port${NC}"
  else
    echo -e "${RED}No process found running on port $port${NC}"
  fi
done