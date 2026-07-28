# Ralph Loop

Автономный агент: читает PRD и issues, реализует по одной задаче за сессию, коммитит, обновляет прогресс.

## Структура задачи

```
.scratch/{task}/
  PRD.md          # описание задачи (PRD.md и/или spec.md — нужен хотя бы один)
  spec.md         # спецификация (опционально; читается вместе с PRD.md, если есть)
  issues/         # файлы задач (одна задача = один файл)
  progress.txt    # лог выполнения (создаётся автоматически; не используется в *-implement.sh)
```

Issues считаются выполненными когда в конце файла есть маркер `DONE`.

---

## Подготовка (один раз)

1. Открой **Git Bash** — правой кнопкой в папке проекта → *Git Bash Here*, или выбери Git Bash как терминал в VS Code
2. Убедись что `claude` доступен: `claude --version`
3. Убедись что `envsubst` доступен: `envsubst --version` (входит в Git Bash)
4. Создай структуру задачи: `PRD.md` и файлы issues в `.scratch/{task}/issues/`

---

## Запуск

### Одна итерация (loop.sh)

```sh
bash scripts/claude-ralph/loop.sh имя-задачи
bash scripts/claude-ralph/loop.sh имя-задачи --bp       # пропустить все подтверждения
bash scripts/claude-ralph/loop.sh имя-задачи --sonnet   # запустить на модели sonnet
```

По умолчанию Claude запускается в режиме `acceptEdits` — правки файлов применяются автоматически, shell-команды (git, tsc и т.д.) требуют подтверждения.

`--bp` переключает в `--dangerously-skip-permissions` — всё применяется без подтверждения.

`--sonnet` запускает Claude на модели sonnet. Без флага — текущая (дефолтная) модель.

**Что происходит:**
1. Claude читает PRD и прогресс из контекста
2. Находит первый незавершённый issue в `issues/`
3. Реализует, прогоняет typecheck/lint, коммитит
4. Помечает issue как `DONE`, дописывает лог в `progress.txt`
5. Завершает сессию

| Ответ Claude | Значение |
|---|---|
| `<promise>STOP</promise>` | issue выполнен, остались ещё — запускай снова |
| `<promise>COMPLETE</promise>` | все issues выполнены, задача завершена |

**Если что-то пошло не так:**
- Прервать сессию — `Ctrl+C`
- Откатить коммит — `git reset --soft HEAD~1`
- Исправить вручную и запустить снова

### Одна итерация через TDD (loop-tdd.sh)

```sh
bash scripts/claude-ralph/loop-tdd.sh имя-задачи
bash scripts/claude-ralph/loop-tdd.sh имя-задачи --bp       # пропустить все подтверждения
bash scripts/claude-ralph/loop-tdd.sh имя-задачи --sonnet   # запустить на модели sonnet
```

Аналог `loop.sh`, но Claude реализует issue через скилл `/tdd` (red→green→refactor). Поддерживает те же флаги `--bp` и `--sonnet`.

### Одна итерация через скилл implement (loop-implement.sh)

```sh
bash scripts/claude-ralph/loop-implement.sh имя-задачи
bash scripts/claude-ralph/loop-implement.sh имя-задачи --bp       # пропустить все подтверждения
bash scripts/claude-ralph/loop-implement.sh имя-задачи --sonnet   # запустить на модели sonnet
```

Аналог `loop.sh`, но issue реализуется скиллом `/implement` (внутри него — tdd где уместно, typecheck/тесты, `/code-review`, коммит). Промпт короткий: [prompt-implement.md](prompt-implement.md). Флаги `--bp` и `--sonnet` те же.

**Не использует `progress.txt`** — состояние держится только на маркерах `DONE` в файлах issues. Требуется непустая папка `issues/` и скилл `implement` в `~/.claude/skills/`.

| Ответ Claude | Значение |
|---|---|
| `<promise>STOP</promise>` | issue выполнен, остались ещё — запускай снова |
| `<promise>COMPLETE</promise>` | все issues выполнены, задача завершена |

### Автономный режим (auto.sh)

```sh
bash scripts/claude-ralph/auto.sh имя-задачи
bash scripts/claude-ralph/auto.sh имя-задачи 20            # кастомный лимит итераций (default: 10)
bash scripts/claude-ralph/auto.sh имя-задачи --tdd        # реализация через скилл /tdd
bash scripts/claude-ralph/auto.sh имя-задачи --sonnet     # запустить на модели sonnet
bash scripts/claude-ralph/auto.sh имя-задачи 20 --tdd --sonnet  # все флаги
```

Claude запускается с `--dangerously-skip-permissions` — все правки и команды применяются без подтверждения.

`--tdd` переключает на prompt с `/tdd` скиллом (red→green→refactor) вместо стандартной реализации.

`--sonnet` запускает Claude на модели sonnet. Без флага — текущая (дефолтная) модель.

**Что происходит:**
1. Скрипт запускает Claude в цикле (до `max_iterations` раз)
2. Каждая итерация: один issue → реализация → коммит → `DONE`
3. Если Claude выводит `<promise>COMPLETE</promise>` — скрипт завершается
4. Если лимит итераций исчерпан без `COMPLETE` — выход с ошибкой

**Требования:** до запуска должен существовать `PRD.md` и/или `spec.md`.

**Если что-то пошло не так:**
- Прервать весь цикл — `Ctrl+C`
- Посмотреть что успело выполниться — `progress.txt`
- Исправить вручную и запустить снова (скрипт подхватит с первого незавершённого issue)

### Автономный режим через скилл implement (auto-implement.sh)

```sh
bash scripts/claude-ralph/auto-implement.sh имя-задачи
bash scripts/claude-ralph/auto-implement.sh имя-задачи 20           # кастомный лимит итераций (default: 10)
bash scripts/claude-ralph/auto-implement.sh имя-задачи --sonnet     # запустить на модели sonnet
bash scripts/claude-ralph/auto-implement.sh имя-задачи 20 --sonnet  # все флаги
```

Аналог `auto.sh`, но каждый issue реализуется скиллом `/implement` (внутри него — tdd где уместно, typecheck/тесты, `/code-review`, коммит). Промпт короткий: [auto-prompt-implement.md](auto-prompt-implement.md).

Отличия от `auto.sh`:
- **не использует `progress.txt`** — состояние держится только на маркерах `DONE` в файлах issues
- нет флага `--tdd` — tdd уже внутри скилла
- перед каждой итерацией скрипт сам считает issues без `DONE` и выходит, если не осталось (страховка, если Claude не выведет `COMPLETE`)

**Что происходит:**
1. Скрипт считает оставшиеся issues без `DONE`; если 0 — выход
2. Запускает Claude со слэш-командой `/implement` и контекстом PRD/spec
3. Claude делает один issue → коммит → `DONE` в конец файла issue
4. `<promise>COMPLETE</promise>` или пустой список issues — скрипт завершается
5. Лимит итераций исчерпан — выход с ошибкой

**Требования:** `PRD.md` и/или `spec.md`, непустая папка `issues/`, скилл `implement` в `~/.claude/skills/`.

**Если что-то пошло не так:**
- Прервать весь цикл — `Ctrl+C`
- Посмотреть что успело выполниться — `git log` и маркеры `DONE` в `issues/`
- Исправить вручную и запустить снова (скрипт подхватит с первого issue без `DONE`)
