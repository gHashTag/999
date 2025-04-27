#!/bin/bash
# Script to display the development log file

LOG_FILE="logs/dev.log"

# Add chalk colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -f "$LOG_FILE" ]; then
  # Use tail to show the last N lines, adjust N as needed
  # Using cat for now to show the whole log, can be changed
  echo -e "${GREEN}Displaying log file: $LOG_FILE${NC}"
  cat "$LOG_FILE"
else
  echo -e "${RED}Log file not found: $LOG_FILE${NC}"
  exit 1
fi