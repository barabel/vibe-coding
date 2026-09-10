# Синхронизация служебных файлов проектов

Проверено 2026-09-10. Рекомендация: отдельный Git-репозиторий и chezmoi. Это готовая CLI для хранения выбранных файлов отдельно и применения их на нескольких машинах; Windows поддерживается. Установка: `winget install twpayne.chezmoi`. [Назначение](https://www.chezmoi.io/), [установка](https://www.chezmoi.io/install/).

## Схема

Настроить `destDir = "C:/_coding"`, `sourceDir = "C:/project-support"` в конфиге chezmoi. Тогда проекты сохраняют относительные пути, например `nazare-front/docs/`. На другой машине `destDir` может отличаться. Это применение документированных `destDir`/`sourceDir` к данному сценарию, а не отдельная функция «проекты». [Переменные конфигурации](https://www.chezmoi.io/reference/configuration-file/variables/).

В Git у chezmoi собственное представление имён: `.scratch` хранится как `dot_scratch`; после применения снова получается `.scratch`. [Атрибуты source state](https://www.chezmoi.io/reference/source-state-attributes/).

## Команды-пример

Предполагаются настроенные пути выше, существующие выбранные файлы, установленный Git и отдельный созданный remote. Команды здесь приведены для настройки, не исполнялись.

Первое добавление и повторное сохранение изменений, включая новые файлы в каталогах:

```powershell
chezmoi init
chezmoi add C:/_coding/nazare-front/docs C:/_coding/nazare-front/scripts C:/_coding/nazare-front/.scratch C:/_coding/nazare-front/CLAUDE.md C:/_coding/nazare-front/CONTEXT.md
git -C C:/project-support add .
git -C C:/project-support diff --cached
git -C C:/project-support commit -m "Обновить nazare-front"
git -C C:/project-support push
```

Remote настраивается обычным `git remote add origin <URL>`; первый push при необходимости `git push -u origin HEAD`. В `add` включаются только реально нужные пути; для scripts можно выбрать отдельные подкаталоги. `add` обновляет существующие и рекурсивно добавляет новые файлы. [add](https://www.chezmoi.io/reference/commands/add/), [Git workflow](https://www.chezmoi.io/user-guide/frequently-asked-questions/usage/).

На второй машине после настройки локальных путей:

```powershell
chezmoi init <URL>
chezmoi diff
chezmoi apply
```

Перед следующей работой:

```powershell
chezmoi update --apply=false
chezmoi diff
chezmoi apply
```

`update` по умолчанию делает pull с rebase/autostash и сразу применяет результат; `--apply=false` разделяет получение и применение для просмотра. [update](https://www.chezmoi.io/reference/commands/update/), [перенос на новую машину](https://www.chezmoi.io/quick-start/).

## Ограничения

- Обычный `re-add` обновляет уже управляемые файлы, поэтому для новых файлов в обычных каталогах нужен повторный `add` выбранных каталогов. [re-add](https://www.chezmoi.io/reference/commands/re-add/), [обсуждение разработчика](https://github.com/twpayne/chezmoi/issues/2298).
- Не использовать `add --exact` для вложенных каталогов проекта без отдельной проверки: он может сделать родительские каталоги exact, после чего `apply` удалит остальные файлы проекта. Документация прямо предупреждает об этом. [add, Notes](https://www.chezmoi.io/reference/commands/add/#notes).
- Обычный режим не является полным зеркалированием с автоматическим переносом удалений. Удаление из управления задаётся отдельно; `forget` убирает файл из source state, оставляя рабочий файл. [forget](https://www.chezmoi.io/reference/commands/forget/).
- Перед получением удалённых изменений незаписанные локальные правки служебных файлов нужно сохранить через `add` и commit; иначе локальная папка проекта и source state расходятся. Это следствие раздельных source/destination и Git workflow. [Ежедневная работа](https://www.chezmoi.io/user-guide/frequently-asked-questions/usage/).
- Для локального исключения служебных файлов использовать `.git/info/exclude` каждого проекта. Это не меняет общий `.gitignore`. Уже отслеживаемые файлы игнорирование не исключает из Git. [gitignore](https://git-scm.com/docs/gitignore).

## Альтернативы

| Вариант | Применимость |
| --- | --- |
| Свой небольшой CLI + отдельный Git | Если нужны ровно команды сохранения/получения проекта, обычные имена и автоматические удаления. Потребуется определить конфликты, удаления и список путей. Это архитектурная оценка. |
| Git + ссылки | GNU Stow раскладывает symlink; Windows `mklink` поддерживает ссылки файлов и junction каталогов. Можно редактировать непосредственно содержимое отдельного репозитория через ссылки, но надо перестроить существующие пути. [Stow](https://www.gnu.org/software/stow/stow.html), [mklink](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mklink). |
| Syncthing | Автоматически синхронизирует файлы напрямую между устройствами, когда они одновременно онлайн; Git-коммитов не заменяет. Для попеременно выключенных машин понадобится доступный промежуточный узел. [FAQ](https://docs.syncthing.net/users/faq.html). |
| yadm | Управляет файлами через Git на месте, требует Bash и Git. Для native PowerShell менее удобен, чем chezmoi; оценка по зависимостям и основному workflow. [yadm](https://yadm.io/), [установка](https://yadm.io/docs/install). |

## Практика: удалить файл на обеих машинах

`forget` только прекращает управление. `destroy` удаляет файл из локального source state, рабочей папки и локального состояния; это не правило удаления на другой машине. Для распространения удаления служит `.chezmoiremove`, который применяется при `apply`. [forget](https://www.chezmoi.io/reference/commands/forget/), [destroy](https://www.chezmoi.io/reference/commands/destroy/), [.chezmoiremove](https://www.chezmoi.io/reference/special-files/chezmoiremove/).

Для уже управляемого `nazare-front/docs/old.md`:

```powershell
chezmoi forget C:/_coding/nazare-front/docs/old.md
```

Затем добавить отдельную строку в `C:/project-support/.chezmoiremove`:

```text
nazare-front/docs/old.md
```

Выполнить `chezmoi diff`, проверить удаляемый путь, затем `chezmoi apply`. Закоммитить изменение source state и `.chezmoiremove`, отправить в remote. На второй машине получить изменения и выполнить `diff`/`apply`. Удаляемый путь не должен одновременно оставаться обычным управляемым файлом. Это комбинация документированных операций; относительный путь соответствует `destDir`. [Специальные файлы](https://www.chezmoi.io/reference/special-files/), [пример конфликта двух записей об одном пути](https://github.com/twpayne/chezmoi/discussions/5074).

Сохранять запись в `.chezmoiremove`, пока файл должен отсутствовать. Для возврата файла сначала убрать запись об удалении, затем добавить файл обычным `chezmoi add`. Это следствие декларативного списка удаляемых целей. [.chezmoiremove](https://www.chezmoi.io/reference/special-files/chezmoiremove/).

## Практика: изменения на обеих машинах

Обычное правило: получение и применение перед началом работы, `add`/commit/push после. Если локальные служебные файлы уже редактировались, а удалённые изменения ещё не получены, сначала сохранить локальные файлы через повторный `add` выбранных путей и Git commit, затем выполнить `chezmoi update --apply=false`. Так изменения обеих машин встречаются в Git. [Работа с изменениями](https://www.chezmoi.io/user-guide/frequently-asked-questions/usage/), [update](https://www.chezmoi.io/reference/commands/update/).

Если pull/rebase остановился на конфликте, разрешать его в `C:/project-support`: отредактировать конфликтующие файлы, выполнить `git add <исправленные пути>` и `git rebase --continue`. Только после успешного завершения — `chezmoi diff` и `chezmoi apply`. `git rebase --abort` отменяет незавершённый rebase. [Git rebase](https://git-scm.com/docs/git-rebase).

Если remote уже получен в source state, а локальный файл проекта отличается и содержит нужные изменения, не запускать слепо повторный `add`: он заменяет source state локальной версией. Сначала объединить версии. `chezmoi merge <путь>` запускает настроенный merge tool, по умолчанию `vimdiff`; он сравнивает рабочий файл, source и вычисленный target. Это не Git merge с общим историческим предком. Альтернатива — вручную объединить содержимое, после чего сохранить итог через `add` и commit. Для просмотра перед заменой подходит `chezmoi apply --interactive`. [merge](https://www.chezmoi.io/reference/commands/merge/), [интерактивное применение и инструменты](https://www.chezmoi.io/user-guide/tools/merge/).
