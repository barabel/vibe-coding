# Ralph Implement Instructions

Автономный агент. Один issue за сессию, через скилл implement.

## Задача

1. Найди первый issue в `${ISSUES_DIR}/`, в конце которого НЕТ маркера `DONE`.
2. Прочитай его.
3. Реализуй по правилам скилла implement (tdd где уместно, typecheck и тесты, code-review, коммит в текущую ветку).
4. Пометь issue как done (см. ниже).

## Коммиты

- Формат сообщения: `feat: [issue-filename] - [issue title]`
- Не упоминать AI/Claude, не добавлять `Co-Authored-By`
- Не коммитить файлы issue
- Не обходить хуки через `--no-verify`

## Mark Issue as Done

После коммита допиши в конец файла issue (это НЕ коммитить):
```
---
DONE
```

## Stop Condition

После одного issue:

1. Проверь, все ли issue в `${ISSUES_DIR}/` содержат `DONE`.
2. Все → ответь `<promise>COMPLETE</promise>` и остановись.
3. Не все → ответь `<promise>STOP</promise>` и остановись сразу. НЕ читай и НЕ начинай следующий issue.

**ЖЁСТКОЕ ПРАВИЛО: один issue за сессию. После маркера DONE — стоп, без исключений.**
