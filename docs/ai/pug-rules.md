# Pug Rules

## Общие правила

Вся разметка проекта пишется на Pug.

Использовать возможности Pug:

- `extends`
- `block`
- `include`
- `mixin`
- переменные
- массивы и объекты данных
- циклы `each`
- условия `if`

Не писать исходную разметку в `.html` файлах.

## Layouts

Layout-файлы находятся в:

```txt
src/layouts/
```

Страницы должны использовать layout через `extends`.

Пример:

```pug
extends ../layouts/default.pug

block content
  include ../components/sections/hero.pug
```

## Sections

Обычные секции находятся в:

```txt
src/components/sections/
```

Каждая секция — отдельный файл.

Пример:

```txt
src/components/sections/hero.pug
```

Пример разметки:

```pug
section.section.section--hero
  .section_container
    .hero
      h1.hero_title Заголовок
      p.hero_text Текст секции
```

## Mixins

Переиспользуемые секции и блоки с разным контентом находятся в:

```txt
src/components/mixins/
```

Пример:

```pug
mixin infoSection(data)
  section.section(class=data.sectionClass ? data.sectionClass : '')
    .section_container
      .info-section
        if data.title
          h2.info-section_title= data.title
        if data.text
          p.info-section_text= data.text
        if data.image
          img.info-section_image(src=data.image alt=data.imageAlt || '')
```

Вызов:

```pug
+infoSection({
  sectionClass: 'section--about',
  title: 'О проекте',
  text: 'Описание',
  image: '/src/assets/img/about.jpg',
  imageAlt: 'О проекте'
})
```

## Include rules

Секции подключать через относительный путь от текущего Pug-файла.

Для страниц из `src/pages/`:

```pug
include ../components/sections/hero.pug
```

Для layout из `src/layouts/`:

```pug
include ../components/sections/header.pug
include ../components/sections/footer.pug
```

## Запрещено

- Дублировать одинаковую разметку на разных страницах.
- Создавать HTML-файлы вместо Pug.
- Создавать секцию прямо внутри страницы, если она должна быть отдельным компонентом.
- Использовать нечитаемые классы.
- Переносить повторяемую секцию через copy-paste вместо mixin.
