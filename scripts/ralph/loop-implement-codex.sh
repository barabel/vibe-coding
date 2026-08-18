#!/bin/bash
# Usage: ./scripts/ralph/loop-implement-codex.sh <task> [--bp] [--terra]

set -e

TASK=""
PERMISSION_ARGS=(--sandbox workspace-write --ask-for-approval on-request)
MODEL_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --bp) PERMISSION_ARGS=(--dangerously-bypass-approvals-and-sandbox) ;;
    --terra) MODEL_ARGS=(--model gpt-5.6-terra) ;;
    --*)
      echo "Error: unknown option: $arg"
      exit 1
      ;;
    *)
      if [ -z "$TASK" ]; then
        TASK="$arg"
      else
        echo "Error: unexpected argument: $arg"
        exit 1
      fi
      ;;
  esac
done

if [ -z "$TASK" ]; then
  echo "Usage: $0 <task> [--bp] [--terra]"
  exit 1
fi

PRD=".scratch/${TASK}/PRD.md"
SPEC=".scratch/${TASK}/spec.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
PROMPT="scripts/ralph/prompt-implement.md"

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
  echo "Error: prompt not found at ${PROMPT}"
  exit 1
fi

PROMPT_TEXT=$(envsubst < "${PROMPT}")
PROMPT_INPUT='$implement'
PROMPT_INPUT+=$'\n\nПрочитай контекст задачи в файлах:'
for source in "${SOURCES[@]}"; do
  PROMPT_INPUT+=$'\n'
  PROMPT_INPUT+="- ${source}"
done
PROMPT_INPUT+=$'\n\n'
PROMPT_INPUT+="${PROMPT_TEXT}"

codex \
  "${PERMISSION_ARGS[@]}" \
  "${MODEL_ARGS[@]}" \
  "${PROMPT_INPUT}"
