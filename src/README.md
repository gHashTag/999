# Source Directory (`src`)

This directory contains the core source code for the application.

## Structure

Following the strict directory structure rule:

- `index.ts`: The main entry point for the application/server.
- `README.md`: This file, providing an overview of the `src` directory.
- `agents/`: Contains definitions and logic for different AI agents (Tester, Coder, Critic).
- `definitions/`: Contains higher-level definitions or configurations related to agents or workflow (e.g., `agentDefinitions.ts`).
- `inngest/`: Contains Inngest-specific utilities and configurations (e.g., sandbox management).
- `network/`: Defines the agent network and routing logic (`network.ts`).
- `tools/`: Contains definitions for tools used by agents (`toolDefinitions.ts`).
- `tutorials/`: Holds tutorial or example code (`tutorial.ts`).
- `types/`: Contains all shared TypeScript type definitions, organized by domain (agents, events, network).
- `utils/`: Contains general utility functions (e.g., logging).

## 🧭 Compass Reminder

- **Consult Regularly:** Refer to this document and the READMEs within subdirectories to understand the project structure.
- **Keep Updated:** If you add new top-level directories or significantly change the purpose of existing ones, **update this README accordingly**.

_Ом Шанти._ 🙏
