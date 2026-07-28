#!/bin/bash
# Usage: ./scripts/claude-ralph/auto-implement.sh <task> [max_iterations] [--sonnet]
# Как auto.sh, но каждый issue делается через скилл /implement.

set -e

TASK=""
MAX_ITERATIONS=10
MODEL=""

for arg in "$@"; do
  case "$arg" in
    --sonnet) MODEL="--model sonnet" ;;
    *)
      if [ -z "$TASK" ]; then TASK="$arg"
      else MAX_ITERATIONS="$arg"
      fi
      ;;
  esac
done

if [ -z "$TASK" ]; then
  echo "Usage: $0 <task> [max_iterations] [--sonnet]"
  exit 1
fi

PRD=".scratch/${TASK}/PRD.md"
SPEC=".scratch/${TASK}/spec.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
PROMPT="scripts/claude-ralph/auto-prompt-implement.md"

mkdir -p ".scratch/${TASK}"

SOURCES=()
[ -f "${PRD}" ] && SOURCES+=("${PRD}")
[ -f "${SPEC}" ] && SOURCES+=("${SPEC}")

if [ ${#SOURCES[@]} -eq 0 ]; then
  echo "Error: neither PRD nor SPEC found in .scratch/${TASK}/ (expected PRD.md or spec.md)"
  exit 1
fi

if [ ! -d "${ISSUES_DIR}" ]; then
  echo "Error: issues dir not found at ${ISSUES_DIR}"
  exit 1
fi

if [ ! -f "${PROMPT}" ]; then
  echo "Error: Prompt not found at ${PROMPT}"
  exit 1
fi

MODEL_SUFFIX=""
if [ -n "$MODEL" ]; then
  MODEL_SUFFIX=" - через sonnet"
fi
echo "Starting auto-implement - Task: $TASK - Max iterations: $MAX_ITERATIONS${MODEL_SUFFIX}"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  # Проверка до вызова: не осталось ли issue без DONE
  REMAINING=0
  for f in "${ISSUES_DIR}"/*; do
    [ -f "$f" ] || continue
    if ! tail -n 3 "$f" | grep -q '^DONE$'; then
      REMAINING=$((REMAINING + 1))
    fi
  done

  if [ "$REMAINING" -eq 0 ]; then
    echo "Все issue помечены DONE. Готово на итерации $i."
    exit 0
  fi
  echo "Осталось issue: $REMAINING"

  PROMPT_TEXT=$(envsubst < "${PROMPT}")

  OUTPUT=$({
    echo "/implement"
    echo
    cat "${SOURCES[@]}"
    echo "${PROMPT_TEXT}"
  } | claude --dangerously-skip-permissions $MODEL --print 2>&1 | tee /dev/stderr) || true

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
echo "Check ${ISSUES_DIR} for issues without DONE."
exit 1
