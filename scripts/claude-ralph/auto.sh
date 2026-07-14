#!/bin/bash
# Usage: ./scripts/claude-ralph/auto.sh <task> [max_iterations] [--tdd]

set -e

TASK=""
MAX_ITERATIONS=10
USE_TDD=false
MODEL=""

for arg in "$@"; do
  case "$arg" in
    --tdd) USE_TDD=true ;;
    --sonnet) MODEL="--model sonnet" ;;
    *)
      if [ -z "$TASK" ]; then TASK="$arg"
      else MAX_ITERATIONS="$arg"
      fi
      ;;
  esac
done

if [ -z "$TASK" ]; then
  echo "Usage: $0 <task> [max_iterations] [--tdd]"
  exit 1
fi

PRD=".scratch/${TASK}/PRD.md"
SPEC=".scratch/${TASK}/spec.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
export PROGRESS=".scratch/${TASK}/progress.txt"
if [ "$USE_TDD" = true ]; then
  PROMPT="scripts/claude-ralph/auto-prompt-tdd.md"
else
  PROMPT="scripts/claude-ralph/auto-prompt.md"
fi

mkdir -p ".scratch/${TASK}"
touch "${PROGRESS}"

SOURCES=()
[ -f "${PRD}" ] && SOURCES+=("${PRD}")
[ -f "${SPEC}" ] && SOURCES+=("${SPEC}")

if [ ${#SOURCES[@]} -eq 0 ]; then
  echo "Error: neither PRD nor SPEC found in .scratch/${TASK}/ (expected PRD.md or spec.md)"
  exit 1
fi

if [ ! -f "${PROMPT}" ]; then
  echo "Error: Prompt not found at ${PROMPT}"
  exit 1
fi

TDD_SUFFIX=""
if [ "$USE_TDD" = true ]; then
  TDD_SUFFIX=" - через tdd"
fi
echo "Starting auto-ralph - Task: $TASK - Max iterations: $MAX_ITERATIONS${TDD_SUFFIX}"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  PROMPT_TEXT=$(envsubst < "${PROMPT}")

  OUTPUT=$({ cat "${SOURCES[@]}" "${PROGRESS}"; echo "${PROMPT_TEXT}"; } | claude --dangerously-skip-permissions $MODEL --print 2>&1 | tee /dev/stderr) || true

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
