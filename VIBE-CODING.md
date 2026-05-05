# Vibe Coding Guide

## Шпаргалка

| Сценарий | Пайплайн |
|---|---|
| Разово в новом репо | `setup-matt-pocock-skills` |
| Фикс входящего бага | `zoom-out → grill-with-docs → to-prd → to-issues → triage → tdd` |
| Новая фича | `zoom-out → grill-with-docs → to-prd → to-issues → triage → tdd` |
| Изменение функциональности | `zoom-out → grill-with-docs → to-prd → to-issues → triage → tdd` |
| Рефактор | `zoom-out → grill-with-docs → to-prd → to-issues → triage → tdd` |
| Непонятный участок кода | `zoom-out` |

**Примечания:**
- `zoom-out` — ИИ разбирается в контексте перед работой. Используй `/zoom-out посмотри этот компонент` — иначе проанализирует весь проект (много токенов)
- `to-prd` можно пропустить если изменение небольшое
- `tdd` — если тесты настроены; иначе заменить на ralph-loop
- После `triage`: `ready-for-agent` → клод делает через `tdd`, `ready-for-human` → ты делаешь
