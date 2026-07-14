#!/bin/bash
# Usage: ./scripts/claude-ralph/loop.sh refactor-use-view-items-animations [--bp]

TASK=""
PERMISSION_FLAG="--permission-mode acceptEdits"
MODEL=""

for arg in "$@"; do
  case "$arg" in
    --bp) PERMISSION_FLAG="--dangerously-skip-permissions" ;;
    --sonnet) MODEL="--model sonnet" ;;
    *) if [ -z "$TASK" ]; then TASK="$arg"; fi ;;
  esac
done

PRD=".scratch/${TASK}/PRD.md"
SPEC=".scratch/${TASK}/spec.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
export PROGRESS=".scratch/${TASK}/progress.txt"
PROMPT="scripts/claude-ralph/prompt.md"

mkdir -p ".scratch/${TASK}"
touch "${PROGRESS}"

FILE_REFS=""
[ -f "${PRD}" ] && FILE_REFS="${FILE_REFS} @${PRD}"
[ -f "${SPEC}" ] && FILE_REFS="${FILE_REFS} @${SPEC}"

if [ -z "${FILE_REFS}" ]; then
  echo "Error: neither PRD nor SPEC found in .scratch/${TASK}/ (expected PRD.md or spec.md)"
  exit 1
fi

PROMPT_TEXT=$(envsubst < "${PROMPT}")

claude $PERMISSION_FLAG $MODEL "${FILE_REFS} @${PROGRESS} ${PROMPT_TEXT}"
