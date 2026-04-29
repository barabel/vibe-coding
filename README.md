# vibe-coding

Скиллы и скрипты для Claude Code. Вдохновленно [Matt Pocock](https://github.com/mattpocock/skills) и [snarktank/ralp](https://github.com/snarktank/ralph)

## Установка

setup-junctions.bat на винде

Создаёт ярлыки из `~\.claude\skills\<skill>` → папки этого репо. Если добавился новый скилл, опять жмякаем, если отредачился, то впринципе можно просто git pull

---

## Скиллы

| Скилл | Что делает |
|---|---|
| `/zoom-out` | Карта модулей и вызывающего кода вокруг компонента |
| `/grill-me` | Стресс-тест плана — задаёт вопросы по всем развилкам |
| `/domain-model` | Интервью по доменной модели, шарпит термины, обновляет `CONTEXT.md` и ADR |
| `/ubiquitous-language` | Формализует термины из разговора в `UBIQUITOUS_LANGUAGE.md` |
| `/write-a-prd` | Интервью → PRD в `docs/prd/` |
| `/to-prd` | Синтезирует PRD из текущего контекста разговора → `docs/prd/` |
| `/prd-to-plan` | PRD → поэтапный план вертикальными слайсами → `docs/plans/` |
| `/to-issues` | Разбивает план/PRD на независимые тикеты → `docs/issues/` |
| `/design-an-interface` | 3+ радикально разных дизайна интерфейса модуля (параллельные агенты) |
| `/triage-issue` | Исследует кодбейс, находит root cause, пишет TDD-план в `docs/issues/` |
| `/request-refactor-plan` | Интервью + план tiny commits → `docs/issues/` |
| `/tdd` | RED→GREEN→REFACTOR по плану |
| `/improve-codebase-architecture` | Ищет архитектурные проблемы, предлагает кандидатов на рефактор |
| `/readme-from-screen` | Генерирует `readme.md` для UI-компонентов со скриншотом `screen.jpg` |

Полные пайплайны — в [VIBE-CODING.md](VIBE-CODING.md).

---

## Скрипты

### `scripts/claude-ralph/`

Автономный агент-исполнитель. Читает PRD и прогресс, берёт следующую issue и реализует её.

```sh
bash scripts/claude-ralph/loop.sh <feature-slug>
```

Повторяешь итерации пока Claude не ответит `<promise>COMPLETE</promise>`. Подробнее — в [scripts/claude-ralph/README.md](scripts/claude-ralph/README.md).
