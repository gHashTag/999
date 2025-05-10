# Use an official Node.js runtime as a parent image (specify a version, e.g., LTS)
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Install pnpm globally
RUN npm install -g bun typescript ts-node

# Copy package.json and pnpm-lock.yaml first to leverage Docker cache
COPY package.json ./
RUN bun install

# Install project dependencies
# Consider running this step when the container starts if caching node_modules locally is preferred
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# [Optional] Build the project if needed (e.g., if not using Vite directly)
# RUN pnpm run build

# Define the command to run when the container starts
# Using tail -f /dev/null keeps the container running for interactive use or background tasks
# Alternatively, define an entrypoint script later.
CMD ["bun", "run", "index.ts"] 