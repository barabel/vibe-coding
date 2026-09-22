#!/bin/bash
# Usage: ./scripts/ralph/loop-implement-claude.sh <task> [--bp] [--sonnet]

set -e

TASK=""
PERMISSION_ARGS=(--permission-mode acceptEdits)
MODEL_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --bp) PERMISSION_ARGS=(--dangerously-skip-permissions) ;;
    --sonnet) MODEL_ARGS=(--model sonnet) ;;
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
  echo "Usage: $0 <task> [--bp] [--sonnet]"
  exit 1
fi

PRD=".scratch/${TASK}/PRD.md"
SPEC=".scratch/${TASK}/spec.md"
export ISSUES_DIR=".scratch/${TASK}/issues"
PROMPT="scripts/ralph/prompt-implement.md"
export CODE_REVIEW='Сабагентов code-review (Standards, Spec) запускать через `subagent_type: code-reviewer` (Opus, high effort). Не использовать general-purpose и не переопределять `model`.'
# агент code-reviewer задаётся здесь, чтобы не ставить его на каждой машине
CODE_REVIEWER_AGENT='{"code-reviewer":{"description":"Code reviewer for the code-review skill: reviews a git diff along one axis (Standards or Spec) given in the prompt.","prompt":"You are a senior code reviewer. Follow the brief in the task prompt exactly: review only the given diff along the requested axis, cite the rule or spec line for every finding, and separate hard violations from judgement calls. Do not edit files. Answer in Russian, concisely.","model":"opus","effort":"high"}}'

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

# envsubst из mingw портит кириллицу в значениях переменных (пишет cp1251)
PROMPT_TEXT=$(<"${PROMPT}")
PROMPT_TEXT=${PROMPT_TEXT//'${ISSUES_DIR}'/"${ISSUES_DIR}"}
PROMPT_TEXT=${PROMPT_TEXT//'${CODE_REVIEW}'/"${CODE_REVIEW}"}
PROMPT_INPUT="/implement"
for source in "${SOURCES[@]}"; do
  PROMPT_INPUT+=" @${source}"
done
PROMPT_INPUT+=" ${PROMPT_TEXT}"

claude "${PERMISSION_ARGS[@]}" "${MODEL_ARGS[@]}" --agents "${CODE_REVIEWER_AGENT}" "${PROMPT_INPUT}"
