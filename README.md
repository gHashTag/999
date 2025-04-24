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
