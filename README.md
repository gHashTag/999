# 999 - Standalone NeuroCoder Agent

This project contains a standalone NeuroCoder agent powered by the Inngest Agent Kit.

## Development Setup

1.  **Clone the repository.**
2.  **Install dependencies:** `pnpm install` (This will also install Husky hooks via the `prepare` script).
3.  **Set up environment variables:** Create a `.env` file based on `.env.example` (if it exists) and fill in your API keys (`DEEPSEEK_API_KEY`, `E2B_API_KEY`).

## Available Scripts

- `pnpm run build`: Compile TypeScript code to `dist/`.
- `pnpm run dev`: **The primary command for development.** Runs `kill-ports.sh` and then starts both the Inngest dev server (`dev:serve`) and the Vite preview server for test reports (`dev:test-report`) concurrently with colored logs.
- `pnpm run dev:build-watch`: Compile TypeScript in watch mode (the old `dev` behavior).
- `pnpm run dev:serve`: Start only the Inngest dev server.
- `pnpm run dev:test-report`: Start only the Vite preview server for test reports.
- `pnpm run start`: Run the compiled code from `dist/`.
- `pnpm run test`: Run all tests once using Vitest.
- `pnpm run test:watch`: Run tests in watch mode.
- `pnpm run test:ui`: Run tests with the interactive Vitest UI (<http://localhost:51204/__vitest__/>).
- `pnpm run coverage`: Run tests and generate a coverage report (check `coverage/` and `html/` directories).
- `pnpm run lint`: Check code for linting errors using ESLint.
- `pnpm run lint:fix`: Attempt to automatically fix linting errors.
- `pnpm run format`: Format code using Prettier.
- `pnpm run format:check`: Check if code formatting matches Prettier rules.

## Code Quality Tools

This project uses several tools to ensure code quality and consistency:

- **TypeScript:** For static typing.
- **Vitest:** For unit and integration testing.
- **Vitest UI:** Interactive UI for viewing and running tests (`pnpm run test:ui`).
- **HTML Reporter:** Generates static HTML test reports (`html/index.html` after running `pnpm run test` or `pnpm run coverage`).
- **ESLint:** For identifying and reporting on patterns in ECMAScript/JavaScript code.
- **Prettier:** For automatic code formatting.
- **Husky:** For managing Git hooks.
- **lint-staged:** For running linters/formatters on staged files before committing.

### Pre-commit Hook

A pre-commit hook is configured using Husky and lint-staged. Before each commit, it automatically runs `eslint --fix` and `prettier --write` on all staged `.ts` files. This helps prevent committing code with linting errors or inconsistent formatting.

## Running the Agent

1.  **Install dependencies:** `pnpm install`
2.  **Set up environment variables:** Create a `.env` file based on `.env.example` (if it exists) and fill in your API keys (`DEEPSEEK_API_KEY`, `E2B_API_KEY`).
3.  **Start the development environment:**
    ```bash
    pnpm run dev
    ```
    This will automatically:
    - Stop processes on required ports (8288, 8289, 4173).
    - Start the Inngest Dev Server (API at `http://localhost:8288`).
    - Start the Vite preview server for the HTML test report (usually at `http://localhost:4173`).

## Running Tests

Run unit and integration tests using Vitest:

```bash
pnpm run test
```

## Common Testing Issues & Solutions 🧘‍♂️

This section documents common issues encountered during testing and development, along with their solutions.

### 1. TypeScript Error TS2835: Missing File Extension in Imports

- **Symptom:** `tsc` fails with `error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './path/to/file.js'?`
- **Context:** This occurs when using `"module": "node16"` or `"nodenext"` in `tsconfig.json`. TypeScript requires explicit `.js` extensions for relative imports in the output JavaScript code, even when importing `.ts` files.
- **Solution:** Add the `.js` extension to all relative import paths in your TypeScript code.

  ```typescript
  // Incorrect:
  // import { someFunction } from "./myModule";

  // Correct:
  import { someFunction } from "./myModule.js"
  ```

### 2. Vitest: Errors Accessing `mock.calls` with `vi.spyOn`

- **Symptom:** Tests fail with `TypeError: Cannot read properties of undefined (reading '0')` or `TypeError: Cannot read properties of undefined (reading 'find')` when trying to access `spy.mock.calls` after using `vi.spyOn` on a method of a mocked object passed into an asynchronous function (like an Inngest handler).
  ```typescript
  // Problematic pattern:
  const mockObject = { run: async (name: string, fn: any) => { /* ... */ } };
  const stepRunSpy = vi.spyOn(mockObject, 'run');
  await handler({ step: mockObject });
  expect(stepRunSpy.mock.calls[0][0]).toBe(...); // Fails!
  ```
- **Context:** This can happen due to the way spies interact with object references and asynchronous operations. The spy might lose its connection to the actual calls made within the handler.
- **Solution:** Instead of spying on an existing method, create the mock function directly using `vi.fn()` and assign it to the relevant property of the mock object passed to the handler. Assert directly on the `vi.fn()` instance.
  ```typescript
  // Recommended pattern:
  const mockStepRun = vi.fn(async (name: string, fn: any) => {
      // ... mock implementation ...
      return "mock-result";
  });
  const mockStepObject = { run: mockStepRun };
  await handler({ step: mockStepObject });
  expect(mockStepRun.mock.calls[0][0]).toBe(...); // Works!
  ```
  This approach ensures the mock function instance you are asserting against is the same one that was called.

# 999

# NeuroCoder TDD Orchestration Example

This project demonstrates a standalone NeuroCoder agent using the Inngest Agent Kit, focusing on a Test-Driven Development (TDD) orchestration pattern with multiple agents (Tester, Coder, Critic).

## Overview

The goal is to create a system where a task is passed through a network of agents:

1.  **Tester:** Writes tests for the task.
2.  **Coder:** Writes implementation code based on the tests.
3.  **Critic:** Reviews both tests and code, providing feedback or approving the result.

This cycle utilizes E2B sandboxes for code execution and Inngest for managing the agent workflows and state.

## Project Structure

```
.
├── src/                # Source code
│   ├── agents/         # Agent definitions (prompts, tools, logic) (placeholder)
│   ├── tools/          # Tool definitions for agents (placeholder)
│   ├── index.ts        # Main Inngest function definition and Express server setup
│   ├── network.ts      # Definition of the TDD agent network and router
│   ├── agentDefinitions.ts # Functions to create agent instances
│   ├── toolDefinitions.ts  # Functions to create tool instances
│   ├── types.ts        # TypeScript types and interfaces
│   └── inngest/        # Inngest specific utilities (e.g., sandbox management)
├── scripts/            # Utility shell scripts
├── dist/               # Compiled JavaScript output (from TypeScript)
├── artifacts/          # Directory for downloaded E2B artifacts (.gitignore-d)
├── html/               # Directory for Vitest HTML report output (.gitignore-d)
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vitest.config.ts    # Vitest configuration
├── README.md           # This file
└── ROADMAP.md          # Detailed plan and progress tracking
```

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:** Requires Node.js and pnpm.
    ```bash
    pnpm install
    ```
3.  **Configure Environment Variables:**
    - Copy `.env.example` to `.env`.
    - Fill in your `E2B_API_KEY` and `DEEPSEEK_API_KEY`. You might need to adjust `DEEPSEEK_MODEL` if you prefer a different DeepSeek model.
    ```bash
    cp .env.example .env
    # Edit .env with your keys
    ```
4.  **Setup Git Hooks (Optional but Recommended):**
    ```bash
    pnpm prepare
    # or directly: npx husky install
    ```

## Development Environment

The primary command for local development is:

```bash
pnpm run dev
```

This command performs several actions using `concurrently`:

1.  **Cleans Ports:** Runs `scripts/kill-ports.sh` to free up potentially conflicting ports (8288, 8289, 4173, 3000, 5000, 8484).
2.  **Build Watch:** Runs `tsc --watch` to continuously compile TypeScript files into the `dist/` directory.
3.  **Inngest Dev Server:** Runs `npx inngest-cli dev -u http://localhost:8484/api/inngest`. This is the core Inngest development server that listens for events and triggers function runs. It connects to the application server running on port 8484.
4.  **Test Report Server:** Runs `npx vite preview --outDir html` to serve the Vitest HTML coverage report (usually accessible at `http://localhost:4173`).

**Important Notes:**

- The `dev` script **does not** run `node dist/index.js` directly anymore. The `inngest-cli dev` server handles the execution of Inngest functions defined in `dist/index.js`.
- The `--raw` flag is passed to `concurrently` to preserve color output from the individual processes.

**Troubleshooting:**

- **Port Conflicts (`EADDRINUSE`):** If `pnpm run dev` fails due to port conflicts even after the `kill-ports.sh` script, some processes might not have terminated correctly. You can manually kill them using `pkill`. Open a separate terminal and run:
  ```bash
  # Stop all related dev processes forcefully
  pkill -f 'pnpm run dev' && pkill -f 'inngest-cli dev' && pkill -f 'vite preview' && pkill -f 'tsc --watch' && pkill -f 'nodemon'
  # Run this command a couple of times if needed, then try 'pnpm run dev' again.
  ```
- **Stale Commands/Behavior:** If `pnpm run dev` seems to be running an old version of the script (e.g., still trying to launch `nodemon`), try cleaning the pnpm cache:
  ```bash
  pnpm store prune
  ```
  If that doesn't work, try a full reinstall:
  ```bash
  rm -rf node_modules
  pnpm install
  ```
  Then, use the `pkill` command above before running `pnpm run dev` again.

## Sending Test Events

To trigger the `coding-agent/run` function during development, use the provided script:

```bash
# Ensure 'pnpm run dev' is running in another terminal

# Send event with default task
node scripts/send-test-event.mjs

# Send event with a custom task string
node scripts/send-test-event.mjs "Implement a function that calculates Fibonacci sequence"

# Send event with custom JSON data (pass as a single string argument)
node scripts/send-test-event.mjs '{"input": "Refactor this code to use async/await", "context": "some existing code..."}'
```

## Running Tests

- **Run all tests once:** `pnpm test`
- **Run tests in watch mode with UI and coverage:** `pnpm run test:watch` (Access UI typically at `http://localhost:51204/__vitest__/`)
- **Generate coverage report:** `pnpm run coverage` (HTML report available in `html/` directory, view with `pnpm run dev:test-report`)

## Linting and Formatting

- **Check formatting:** `pnpm run format:check`
- **Apply formatting:** `pnpm run format`
- **Check linting:** `pnpm run lint`
- **Apply linting fixes:** `pnpm run lint:fix`

These checks are also run automatically on staged files before committing if you've set up Husky hooks (`pnpm prepare`).

## Building for Production

```bash
pnpm run build
```

This compiles TypeScript code to the `dist/` directory.

## Starting in Production Mode

```bash
node dist/index.js
```

This starts the Express server which serves the Inngest functions. Ensure necessary environment variables are set.
