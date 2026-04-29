---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues using tracer-bullet vertical slices, saved as local markdown files. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets), saved as local `.md` files.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a file path as an argument, read it.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Write issues to disk

Determine the output directory:
- If the user specified a path — use it.
- Otherwise derive a slug from the plan/feature title (lowercased, spaces → hyphens) and use `docs/issues/<slug>/`.

Create the directory if it does not exist.

For each approved slice, write a file named `<NNN>-<slug>.md` where `NNN` is a zero-padded sequence number (001, 002, …) and `slug` is the title lowercased with spaces replaced by hyphens.

Write files in dependency order (blockers first) so you can reference real file names in the "Blocked by" field.

<issue-template>
# <Title>

**Type:** HITL / AFK
**Blocked by:** `<filename>` / None — can start immediately

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
</issue-template>

After writing all files, print a summary table:

| File | Type | Blocked by |
|------|------|------------|
| 001-slug.md | AFK | None |
| 002-slug.md | HITL | 001-slug.md |
