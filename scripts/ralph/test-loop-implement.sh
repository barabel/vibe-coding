#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "${TEST_DIR}"' EXIT

fail() {
  echo "FAIL: $1"
  exit 1
}

assert_eq() {
  local expected="$1"
  local actual="$2"

  if [ "${actual}" != "${expected}" ]; then
    fail "expected '${expected}', got '${actual}'"
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"

  if [[ "${haystack}" != *"${needle}"* ]]; then
    fail "expected value to contain '${needle}'"
  fi
}

mkdir -p "${TEST_DIR}/scripts/ralph" "${TEST_DIR}/bin"
cp "${ROOT_DIR}/scripts/ralph/loop-implement-claude.sh" "${TEST_DIR}/scripts/ralph/"
cp "${ROOT_DIR}/scripts/ralph/loop-implement-codex.sh" "${TEST_DIR}/scripts/ralph/"
cp "${ROOT_DIR}/scripts/ralph/prompt-implement.md" "${TEST_DIR}/scripts/ralph/"

cat > "${TEST_DIR}/bin/claude" <<'EOF'
#!/bin/bash
printf '%s\0' "$@" > "${RALPH_CAPTURE}"
EOF
cp "${TEST_DIR}/bin/claude" "${TEST_DIR}/bin/codex"
chmod +x "${TEST_DIR}/bin/claude" "${TEST_DIR}/bin/codex"

cd "${TEST_DIR}"
mkdir -p ".scratch/demo/issues"
touch ".scratch/demo/PRD.md"

RALPH_CAPTURE="${TEST_DIR}/claude-default.args" \
  PATH="${TEST_DIR}/bin:${PATH}" \
  bash scripts/ralph/loop-implement-claude.sh demo
mapfile -d '' -t ARGS < "${TEST_DIR}/claude-default.args"
assert_eq "--permission-mode" "${ARGS[0]}"
assert_eq "acceptEdits" "${ARGS[1]}"
assert_contains "${ARGS[2]}" "/implement @.scratch/demo/PRD.md"
assert_contains "${ARGS[2]}" '.scratch/demo/issues'

RALPH_CAPTURE="${TEST_DIR}/claude-flags.args" \
  PATH="${TEST_DIR}/bin:${PATH}" \
  bash scripts/ralph/loop-implement-claude.sh --sonnet demo --bp
mapfile -d '' -t ARGS < "${TEST_DIR}/claude-flags.args"
assert_eq "--dangerously-skip-permissions" "${ARGS[0]}"
assert_eq "--model" "${ARGS[1]}"
assert_eq "sonnet" "${ARGS[2]}"

RALPH_CAPTURE="${TEST_DIR}/codex-default.args" \
  PATH="${TEST_DIR}/bin:${PATH}" \
  bash scripts/ralph/loop-implement-codex.sh demo
mapfile -d '' -t ARGS < "${TEST_DIR}/codex-default.args"
assert_eq "--sandbox" "${ARGS[0]}"
assert_eq "workspace-write" "${ARGS[1]}"
assert_eq "--ask-for-approval" "${ARGS[2]}"
assert_eq "on-request" "${ARGS[3]}"
assert_contains "${ARGS[4]}" '$implement'
assert_contains "${ARGS[4]}" '.scratch/demo/PRD.md'
assert_contains "${ARGS[4]}" '.scratch/demo/issues'

RALPH_CAPTURE="${TEST_DIR}/codex-flags.args" \
  PATH="${TEST_DIR}/bin:${PATH}" \
  bash scripts/ralph/loop-implement-codex.sh --bp --terra demo
mapfile -d '' -t ARGS < "${TEST_DIR}/codex-flags.args"
assert_eq "--sandbox" "${ARGS[0]}"
assert_eq "workspace-write" "${ARGS[1]}"
assert_eq "--ask-for-approval" "${ARGS[2]}"
assert_eq "never" "${ARGS[3]}"
assert_eq "--model" "${ARGS[4]}"
assert_eq "gpt-5.6-terra" "${ARGS[5]}"
assert_contains "${ARGS[6]}" '$implement'

if bash scripts/ralph/loop-implement-claude.sh >/dev/null 2>&1; then
  fail "Claude launcher accepted an empty task"
fi

if bash scripts/ralph/loop-implement-codex.sh demo --unknown >/dev/null 2>&1; then
  fail "Codex launcher accepted an unknown option"
fi

if bash scripts/ralph/loop-implement-codex.sh demo another >/dev/null 2>&1; then
  fail "Codex launcher accepted a second task"
fi

echo "PASS"
