#!/bin/bash
# Script to display the development log file

LOG_FILE="logs/dev.log"

if [ -f "$LOG_FILE" ]; then
  # Use tail to show the last N lines, adjust N as needed
  # Using cat for now to show the whole log, can be changed
  cat "$LOG_FILE"
else
  echo "Log file not found: $LOG_FILE"
  exit 1
fi 