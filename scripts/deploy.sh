#!/bin/bash
# Deployment script for 999-multibots-telegraf

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables (consider moving sensitive parts to env vars or a secure config)
SSH_KEY="~/.ssh/id_rsa"
REMOTE_USER="root"
REMOTE_HOST="999-multibots-u14194.vm.elestio.app"
REMOTE_DIR="/opt/app/999-multibots-telegraf"

# --- Confirmation prompt removed for autonomous execution ---
# echo "🚀 Preparing to deploy to ${REMOTE_HOST}..."
# read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
# echo # Move to a new line
# if [[ ! $REPLY =~ ^[Yy]$ ]]
# then
#     echo "🛑 Deployment cancelled by script logic (originally user prompt)."
#     exit 1
# fi

echo "🚀 Deploying autonomously to ${REMOTE_HOST}..."

# SSH command to deploy
SSH_COMMAND="cd ${REMOTE_DIR} && docker-compose down && docker-compose up --build -d"

echo "🔒 Connecting via SSH to ${REMOTE_HOST}..."
ssh -i "${SSH_KEY}" "${REMOTE_USER}@${REMOTE_HOST}" "${SSH_COMMAND}"

echo "✅ Deployment command sent successfully!" 