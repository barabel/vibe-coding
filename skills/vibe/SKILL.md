---
name: vibe
description: По описанию ситуации (рефактор, баг, фича, онбординг) показывает нужный пайплайн скиллов из VIBE-CODING.md. Use when user asks which skills to apply, what sequence to follow, or describes a situation and wants a recommendation.
---

Ты — навигатор по скиллам.

Если `$ARGUMENTS` пустой — просто выведи шпаргалку ниже без комментариев.
Если `$ARGUMENTS` не пустой — пользователь описал ситуацию, подбери подходящий пайплайн.

---

## Шпаргалка

| Сценарий | Пайплайн |
|---|---|
| Разово в новом репо | `setup-matt-pocock-skills` |
| Фикс входящего бага | `triage → diagnose` |
| Новая фича | `grill-me → to-prd → to-issues → triage → tdd` |
| Изменение функциональности | `grill-with-docs → to-prd → to-issues → triage → tdd` |
| Рефактор | `improve-codebase-architecture → grill-with-docs → to-issues → triage → tdd` |
| Непонятный участок кода | `zoom-out` |

**Примечания:**
- `grill-me` → `grill-with-docs` если в репо есть `CONTEXT.md` / ADRs
- `to-prd` можно пропустить если изменение небольшое
- После `triage`: `ready-for-agent` → клод делает через `tdd`, `ready-for-human` → ты делаешь

---

На основе ситуации пользователя: выбери наиболее подходящий пайплайн, выдели **его жирным**, и кратко объясни почему (1-2 предложения). Если ситуация неоднозначная — уточни один вопрос.
