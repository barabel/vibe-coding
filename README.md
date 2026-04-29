# vibe-coding

Скиллы и скрипты для вайб кодинга на Claude Code.

Основной вайб кодинг идет по этому великолепному господину [Matt Pocock](https://github.com/mattpocock/skills) качаешь его скрипты и кайфуешь (см [VIBE-CODING.md](./VIBE-CODING.md))

На проектах, где нет тестов, Matt tdd нельзя будет заюзать, поэтому был написан скрипт, вдохновленный [snarktank/ralp](https://github.com/snarktank/ralph)

В папке skills находятся мои скилы, которые я решил оставить

## Установка

setup-junctions.bat на винде

Создаёт ярлыки из `~\.claude\skills\<skill>` → папки этого репо. Если добавился новый скилл, опять жмякаем, если отредачился, то впринципе можно просто git pull

---

## Скиллы

| Скилл | Что делает |
|---|---|
| `/vibe` | По описанию ситуации показывает нужный пайплайн скиллов |
| `/readme-from-screen` | Генерирует `readme.md` для UI-компонентов со скриншотом `screen.jpg` |

---

## Скрипты

### `scripts/claude-ralph/`

Автономный агент-исполнитель. Читает PRD и прогресс, берёт следующую issue и реализует её.

```sh
bash scripts/claude-ralph/loop.sh <feature-slug>
```

Повторяешь итерации пока Claude не ответит `<promise>COMPLETE</promise>`. Подробнее — в [scripts/claude-ralph/README.md](scripts/claude-ralph/README.md).
