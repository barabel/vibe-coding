# Vibe Coding Guide

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
