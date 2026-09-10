# chezmoi: дом ↔ офис

Один chezmoi и один отдельный Git-репозиторий для вспомогательных файлов всех проектов. Команды ниже — для PowerShell.

- Проекты: `C:\_coding`.
- Локальное хранилище: `C:\project-support`.
- Удалённое хранилище: отдельный репозиторий `project-support` на доступном с обеих машин Git-сервере.

Редактируешь файлы в проектах. `add` / `re-add` копируют изменения в локальное хранилище. Git отправляет их на сервер. `update` скачивает изменения и применяет их к проектам.

## Ежедневная памятка

Предполагается, что обе машины настроены по инструкции ниже. Команды сохранения обновляют уже добавленные файлы всех проектов. **Если создал новые файлы, сначала добавь их по разделу «Новые файлы и проекты».**

### Закончил дома — завтра на работу

```powershell
chezmoi re-add
git -C C:/project-support add .
git -C C:/project-support commit -m "Обновить файлы проектов"
git -C C:/project-support push
```

### Пришёл на работу

Перед редактированием файлов:

```powershell
chezmoi update
```

### Закончил в офисе — идёшь домой

```powershell
chezmoi re-add
git -C C:/project-support add .
git -C C:/project-support commit -m "Обновить файлы проектов"
git -C C:/project-support push
```

### Пришёл домой

Перед редактированием файлов:

```powershell
chezmoi update
```

`update` делает Git pull и затем apply. Отдельный `apply` ничего не скачивает: применяет локальное хранилище. Если хочешь сначала увидеть изменения:

```powershell
chezmoi update --apply=false
chezmoi diff
```

После просмотра:

```powershell
chezmoi apply
```

Если изменений нет, Git может ответить `nothing to commit` — это нормально. При ошибке команды сначала разберись с ней, затем продолжай. Если уже редактировал файлы до получения обновлений, сначала сохрани их через `add` / `re-add` и локальный commit, затем получай обновления и разрешай возможные Git-конфликты в хранилище.

[Документация re-add](https://www.chezmoi.io/reference/commands/re-add/), [update](https://www.chezmoi.io/reference/commands/update/).

## Установка на обеих машинах

Нужны Git и доступ к удалённому репозиторию с каждой машины. Проверь Git:

```powershell
git --version
```

Установи chezmoi:

```powershell
winget install twpayne.chezmoi
```

Открой новый терминал и проверь:

```powershell
chezmoi --version
```

Если Winget отсутствует, другие способы установки есть в [официальной инструкции](https://www.chezmoi.io/install/).

Создай каталог конфигурации и открой файл:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.config\chezmoi" | Out-Null
notepad "$env:USERPROFILE\.config\chezmoi\chezmoi.toml"
```

Сохрани в нём:

```toml
sourceDir = "C:/project-support"
destDir = "C:/_coding"
```

Это настройка для новой установки chezmoi со стандартным расположением конфига. `sourceDir` — хранилище; `destDir` — корень проектов. На другой машине корень может отличаться, например `D:/projects`, но относительные пути проектов должны совпадать: `nazare-front/docs` и т. п.

[Конфигурационный файл](https://www.chezmoi.io/reference/configuration-file/), [параметры путей](https://www.chezmoi.io/reference/configuration-file/variables/).

## Первое заполнение хранилища — только на одной машине

Создай пустой удалённый репозиторий `project-support`, без README и других начальных файлов. В командах ниже замени `URL_РЕПОЗИТОРИЯ` его SSH- или HTTPS-адресом.

После установки и настройки конфига:

```powershell
chezmoi init
```

Добавь выбранные файлы первого проекта:

```powershell
Set-Location C:\_coding\nazare-front
chezmoi add ./docs ./scripts ./.scratch ./CLAUDE.md ./CONTEXT.md
```

Перечисляй только существующие и нужные пути. Если нужна лишь часть `scripts`, укажи конкретные подпапки. `AGENTS.md`, `.agents` или `agents` добавляются так же, если есть в проекте. **Не выполняй `chezmoi add .` в корне проекта: он выберет весь проект.**

Подключи удалённый репозиторий и посмотри содержимое первого коммита:

```powershell
git -C C:/project-support remote add origin "URL_РЕПОЗИТОРИЯ"
git -C C:/project-support add .
git -C C:/project-support diff --cached
```

После просмотра:

```powershell
git -C C:/project-support commit -m "Добавить файлы проектов"
git -C C:/project-support push -u origin HEAD
```

Успешный push означает, что файлы доступны для второй машины. Эти Git-команды работают с `project-support`, а не с репозиториями проектов.

[Документация init](https://www.chezmoi.io/reference/commands/init/), [add](https://www.chezmoi.io/reference/commands/add/).

## Подключение второй машины

Сначала установи chezmoi и создай конфиг, как описано выше. Затем клонируй уже заполненное хранилище:

```powershell
chezmoi init "URL_РЕПОЗИТОРИЯ"
chezmoi diff
```

Посмотри разницу с существующими файлами. Если на второй машине есть собственные правки, объедини их с полученными перед применением.

```powershell
chezmoi apply
```

Проверь выбранные файлы в `C:\_coding\nazare-front`. Дальше используй ежедневную памятку. Повторно создавать remote и выполнять первое заполнение здесь не нужно.

## Новые файлы и проекты

`re-add` обновляет уже управляемые обычные файлы. Новые файлы в обычных каталогах добавляй перед ежедневным сохранением. Можно указать конкретный файл или повторно добавить всю выбранную папку:

```powershell
chezmoi add C:/_coding/nazare-front/docs
```

Это заберёт и новые файлы внутри `docs`. Для нового проекта, заменив имя на реальное:

```powershell
chezmoi add C:/_coding/another-project/docs
chezmoi add C:/_coding/another-project/CLAUDE.md
```

После этого — обычные commit и push хранилища. На второй машине — `chezmoi update`.

Хранилище будет содержать отдельные папки проектов. Каталоги с точкой имеют специальное представление: `.scratch` хранится как `dot_scratch`, но в проекте после применения снова получается `.scratch`. [Правила имён](https://www.chezmoi.io/reference/source-state-attributes/).

## Удаления и исключения Git

Простое удаление файла в проекте не переносится этим циклом автоматически. Чтобы удалить конкретный файл на обеих машинах:

1. Выполни `chezmoi forget C:/_coding/nazare-front/docs/old.md`, подставив нужный файл.
2. Добавь строку `nazare-front/docs/old.md` в `C:/project-support/.chezmoiremove`.
3. Выполни `chezmoi diff`, затем `chezmoi apply`.
4. Закоммить и отправь изменения хранилища. На другой машине выполни `chezmoi update`.

`forget` сам по себе оставляет рабочий файл на месте; удаление при применении задаёт `.chezmoiremove`. [forget](https://www.chezmoi.io/reference/commands/forget/), [.chezmoiremove](https://www.chezmoi.io/reference/special-files/chezmoiremove/).

Не используй `add --exact` для каталогов существующих проектов: он может пометить родительские каталоги как exact и привести к удалению файлов, не включённых в хранилище. [Предупреждение документации](https://www.chezmoi.io/reference/commands/add/#notes).

chezmoi не исключает файлы из Git рабочих проектов. Для локальных исключений подходит `.git/info/exclude` каждого проекта. Уже отслеживаемые `docs` и `CONTEXT.md` нужно отдельно убрать из отслеживания; ignore на них не действует. При таком переходе на второй машине сначала обнови код проекта, затем восстанови вспомогательные файлы через `chezmoi apply`. [Правила Git](https://git-scm.com/docs/gitignore).
