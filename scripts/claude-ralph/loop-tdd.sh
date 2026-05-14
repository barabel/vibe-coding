#!/bin/bash
# Usage: ./scripts/claude-ralph/loop-tdd.sh refactor-use-view-items-animations [--bp]

TASK=""
PERMISSION_FLAG="--permission-mode acceptEdits"

for arg in "$@"; do
  case "$arg" in
    --bp) PERMISSION_FLAG="--dangerously-skip-permissions" ;;
    *) if [ -z "$TASK" ]; then TASK="$arg"; fi ;;
  esac
done

export PRD=".scratch/${TASK}/PRD.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
export PROGRESS=".scratch/${TASK}/progress.txt"
PROMPT="scripts/claude-ralph/prompt-tdd.md"

mkdir -p ".scratch/${TASK}"
touch "${PROGRESS}"

PROMPT_TEXT=$(envsubst < "${PROMPT}")

claude $PERMISSION_FLAG "@${PRD} @${PROGRESS} ${PROMPT_TEXT}"
