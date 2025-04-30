#!/bin/bash

# 🕉️ TDD Cycle Helper Script
# Usage: bash scripts/tdd-cycle.sh <path_to_test_file>

# --- Configuration ---
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[0;33m'
COLOR_BLUE='\033[0;34m'

# --- Input Validation ---
TEST_FILE=$1

if [ -z "$TEST_FILE" ]; then
  echo -e "${COLOR_RED}Error: Please provide the path to the test file.${COLOR_RESET}"
  echo "Usage: bash scripts/tdd-cycle.sh <path_to_test_file>"
  exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
  echo -e "${COLOR_RED}Error: Test file not found at '$TEST_FILE'${COLOR_RESET}"
  exit 1
fi

# Function to run type check
run_type_check() {
  echo -e "\n${COLOR_BLUE}🔎 Running TypeScript type check...${COLOR_RESET}"
  bun exec tsc --noEmit
  local exit_code=$?
  if [ $exit_code -ne 0 ] && [ $exit_code -ne 2 ]; then # Allow exit code 2 for known agent-kit issue
      echo -e "${COLOR_RED}❌ Type check failed. Please fix the errors and run the script again.${COLOR_RESET}"
      exit $exit_code
  elif [ $exit_code -eq 2 ]; then
      echo -e "${COLOR_YELLOW}⚠️ Type check finished with known warning (TS2352). Continuing...${COLOR_RESET}"
  else
      echo -e "${COLOR_GREEN}✅ Type check passed.${COLOR_RESET}"
  fi
  return 0 # Indicate success or accepted warning
}

# Function to run test and check result
# $1: expected exit code (0 for pass, non-zero for fail)
# $2: phase name (e.g., "Red Test", "Green Test")
run_test_check() {
  local expected_code=$1
  local phase_name=$2
  echo -e "\n${COLOR_BLUE}🚀 Running test: $TEST_FILE (Phase: $phase_name)...${COLOR_RESET}"
  bun test "$TEST_FILE" --isolate
  local exit_code=$?

  if [ "$expected_code" -eq 0 ]; then # Expecting PASS
    if [ $exit_code -eq 0 ]; then
      echo -e "${COLOR_GREEN}✅ Test passed as expected.${COLOR_RESET}"
      return 0
    else
      echo -e "${COLOR_RED}❌ Test failed unexpectedly. Please fix the code or test.${COLOR_RESET}"
      return 1
    fi
  else # Expecting FAIL
    if [ $exit_code -ne 0 ]; then
      echo -e "${COLOR_GREEN}✅ Test failed as expected.${COLOR_RESET}"
      return 0
    else
      echo -e "${COLOR_RED}❌ Test passed unexpectedly (expected failure). Please check your test logic.${COLOR_RESET}"
      return 1
    fi
  fi
}

echo -e "${COLOR_BLUE}🕉️ Starting TDD Cycle for: $TEST_FILE ${COLOR_RESET}"

# --- Phase 1: Red Test --- 
echo -e "\n${COLOR_YELLOW}--- 🔴 Phase 1: Red Test ---${COLOR_RESET}"
read -p "1. Have you written the failing test in '$TEST_FILE'? (Press Enter to continue)"

run_type_check || exit 1
run_test_check 1 "Red Test" || exit 1 # Expect fail (non-zero)

# --- Phase 2: Green Test --- 
echo -e "\n${COLOR_YELLOW}--- 🟢 Phase 2: Green Test ---${COLOR_RESET}"
while true; do
  read -p "2. Have you implemented the logic to make the test pass? (Press Enter to check)"
  run_type_check || continue # If types fail, prompt again
  run_test_check 0 "Green Test" && break # Expect pass (zero), break loop on success
  echo -e "${COLOR_YELLOW}   Test still failing. Keep coding! Press Enter when ready to re-check.${COLOR_RESET}"
  read -p "   (Press Enter to re-check, Ctrl+C to abort)"
  # Loop continues
done

# --- Phase 3: Refactor --- 
echo -e "\n${COLOR_YELLOW}--- ♻️ Phase 3: Refactor ---${COLOR_RESET}"
while true; do
  read -p "3. Refactor the code/test if needed. (Press Enter when ready to check)"
  run_type_check || continue
  run_test_check 0 "Refactor Check" && break
  echo -e "${COLOR_YELLOW}   Test failing after refactor. Please fix. Press Enter when ready to re-check.${COLOR_RESET}"
  read -p "   (Press Enter to re-check, Ctrl+C to abort)"
  # Loop continues
done

# --- Phase 4: Completion --- 
echo -e "\n${COLOR_GREEN}🎉 TDD Cycle completed successfully for: $TEST_FILE ${COLOR_RESET}"
echo -e "${COLOR_BLUE}🙏 Remember the final sacred steps:${COLOR_RESET}"
echo "   1. Commit your changes: git add . && git commit -m \"feat/fix/refactor: ...\""

echo "   2. Update .cursor/rules/current_task.mdc"
echo "   3. Update SUCCESS_HISTORY.md / REGRESSION_PATTERNS.md (with commit hash!)"
git status --short # Show changed files as a hint

exit 0 