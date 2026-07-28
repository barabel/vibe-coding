#!/bin/bash
# Usage: ./scripts/claude-ralph/loop-implement.sh <task> [--bp] [--sonnet]
# Как loop.sh, но issue делается через скилл /implement.

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
PROMPT="scripts/claude-ralph/prompt-implement.md"

mkdir -p ".scratch/${TASK}"

FILE_REFS=""
[ -f "${PRD}" ] && FILE_REFS="${FILE_REFS} @${PRD}"
[ -f "${SPEC}" ] && FILE_REFS="${FILE_REFS} @${SPEC}"

if [ -z "${FILE_REFS}" ]; then
  echo "Error: neither PRD nor SPEC found in .scratch/${TASK}/ (expected PRD.md or spec.md)"
  exit 1
fi

if [ ! -d "${ISSUES_DIR}" ]; then
  echo "Error: issues dir not found at ${ISSUES_DIR}"
  exit 1
fi

PROMPT_TEXT=$(envsubst < "${PROMPT}")

claude $PERMISSION_FLAG $MODEL "/implement ${FILE_REFS} ${PROMPT_TEXT}"
