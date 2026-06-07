# Project Rules

## Стек проекта

Проект использует:

- Vite
- Pug
- SCSS
- JavaScript modules

Агент должен сохранять этот стек и текущую архитектуру.

## Базовая структура

```txt
src/
  assets/
    fonts/
    img/
  components/
    sections/
    mixins/
  layouts/
  pages/
  scripts/
    components/
    pages/
    utils/
    main.js
  styles/
    components/
    fonts.scss
    mixins.scss
    reset.scss
    styles.scss
    variables.scss
public/
  robots.txt
```

## Assets

Изображения размещаются только здесь:

```txt
src/assets/img/
```

Шрифты размещаются только здесь:

```txt
src/assets/fonts/
```

Папка `public/` должна содержать только:

```txt
public/robots.txt
```

Не копировать изображения, шрифты и другие ассеты в `public/`.

## Fonts

Все шрифты должны быть локальными.

Подключение шрифтов выполняется только в:

```txt
src/styles/fonts.scss
```

Запрещено использовать Google Fonts, Adobe Fonts, CDN и внешние URL для шрифтов, если пользователь явно не попросил обратное.

## Создание новой секции

Каждая новая секция сначала создается как отдельный Pug-файл в:

```txt
src/components/sections/
```

Пример:

```txt
src/components/sections/hero.pug
src/components/sections/about.pug
src/components/sections/gallery.pug
```

Секция подключается на нужной странице через `include`.

Пример:

```pug
include ../components/sections/hero.pug
include ../components/sections/about.pug
```

После создания секции обязательно создать SCSS-файл с таким же именем в:

```txt
src/styles/components/
```

Пример:

```txt
src/components/sections/hero.pug
src/styles/components/hero.scss
```

И подключить его в:

```txt
src/styles/styles.scss
```

## Переиспользуемые секции

Если секция должна повторяться на других страницах с другим контентом — фото, текстом, ссылками, карточками или другими данными — ее нужно перенести из:

```txt
src/components/sections/
```

в:

```txt
src/components/mixins/
```

и оформить как Pug mixin.

Миксин подключается один раз в layout или в нужной странице и вызывается через `+MixinName(...)`.

## Переиспользуемые блоки

Каждый переиспользуемый блок должен иметь:

- отдельный Pug mixin или отдельный Pug-файл;
- отдельный SCSS-файл;
- человекочитаемое название;
- один корневой BEM-класс.

## Запрет на дублирование

Не дублировать верстку, стили и JS-логику.

Если кусок разметки повторяется или потенциально будет повторяться — вынести его в Pug mixin.

Если JS-логика повторяется — вынести ее в `src/scripts/utils/` или `src/scripts/components/`.

## Обязательная проверка перед завершением

Перед финальным ответом агент должен проверить:

1. Файлы созданы в правильных папках.
2. Pug-разметка не дублируется без необходимости.
3. Секции подключены через `include` или `mixin`.
4. Для новых секций и блоков есть SCSS-файлы.
5. SCSS-файлы подключены в `styles.scss`.
6. Цвета и брейкпоинты вынесены в переменные.
7. Медиазапросы написаны через миксины.
8. JS разделен на модули.
9. Assets лежат только в разрешенных папках.
10. `public/` не содержит ничего кроме `robots.txt`.
