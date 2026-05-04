#!/bin/bash
# Usage: ./scripts/claude-ralph/auto.sh <task> [max_iterations]

set -e

TASK="${1}"
MAX_ITERATIONS="${2:-10}"

if [ -z "$TASK" ]; then
  echo "Usage: $0 <task> [max_iterations]"
  exit 1
fi

export PRD=".scratch/${TASK}/PRD.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
export PROGRESS=".scratch/${TASK}/progress.txt"
PROMPT="scripts/claude-ralph/auto-prompt.md"

mkdir -p ".scratch/${TASK}"
touch "${PROGRESS}"

if [ ! -f "${PRD}" ]; then
  echo "Error: PRD not found at ${PRD}"
  exit 1
fi

if [ ! -f "${PROMPT}" ]; then
  echo "Error: Prompt not found at ${PROMPT}"
  exit 1
fi

echo "Starting auto-ralph - Task: $TASK - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  PROMPT_TEXT=$(envsubst < "${PROMPT}")

  OUTPUT=$({ cat "${PRD}" "${PROGRESS}"; echo "${PROMPT_TEXT}"; } | claude --dangerously-skip-permissions --print 2>&1 | tee /dev/stderr) || true

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS) without completing."
echo "Check $PROGRESS for status."
exit 1
