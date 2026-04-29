#!/bin/bash
# Usage: ./scripts/claude-ralph/loop.sh refactor-use-view-items-animations

TASK="${1}"
export PRD=".scratch/${TASK}/PRD.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
export PROGRESS=".scratch/${TASK}/progress.txt"
PROMPT="scripts/claude-ralph/prompt.md"

mkdir -p ".scratch/${TASK}"
touch "${PROGRESS}"

PROMPT_TEXT=$(envsubst < "${PROMPT}")

claude --permission-mode acceptEdits "@${PRD} @${PROGRESS} ${PROMPT_TEXT}"
