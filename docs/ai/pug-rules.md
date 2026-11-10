# Pug Rules

## Общие правила

Вся разметка проекта пишется на Pug: `extends`, `block`, `include`, `mixin`, переменные, `each`, `if`. Исходную разметку в `.html` не писать.

## Что доступно в любом шаблоне

| Имя | Что это |
|---|---|
| `page` | мета страницы: `page.title`, `page.description`, `page.name`, `page.page_class`… |
| `pages` | все страницы проекта: `{ name, href, title, description }` |
| `data` | данные из `src/data/*.json`: `data.site`, `data.offices`… |
| `asset(path)` | путь к файлу из `src/assets`: `asset('img/logo.svg')` |
| `hasAsset(path)` | есть ли такой файл в `src/assets` |
| `isProd` | `true` при сборке |

## Layouts

Layout-файлы — в `src/layouts/`, страницы используют их через `extends`:

```pug
extends ../layouts/default.pug

block content
  include ../components/sections/hero.pug
```

Блоки layout: `head` (доп. теги в `<head>`), `content` (main), `modals` (окна и всё с `position: fixed` — вне масштаба страницы).

## Sections

Обычные секции — в `src/components/sections/`, каждая отдельным файлом:

```pug
section.section.section--hero
  .section_container
    .hero
      h1.hero_title Заголовок
      p.hero_text Текст секции
```

Подключение на странице: `include ../components/sections/hero.pug`.

## Mixins

Повторяющиеся блоки с разным контентом — в `src/components/mixins/`, один миксин — один файл. **Подключать не нужно**: layout подключает все файлы папки сам (`_all.pug` собирает сборка, на диске его нет). Вызов — `+имяМиксина(...)`.

```pug
mixin infoSection(item)
  section.section(class=item.sectionClass)
    .section_container
      .info-section
        if item.title
          //- CMS: заголовок записи
          h2.info-section_title= item.title
        if item.text
          p.info-section_text= item.text
        if item.image
          +picture({ src: item.image, alt: item.imageAlt || '', w: 720, h: 480 })(class="info-section_image")
```

```pug
each item in data.about
  +infoSection(item)
```

Где выводятся данные будущей CMS — комментарий `//- CMS: <поле>`.

## Первый экран

Секция первого экрана — с атрибутом `data-intro`, страница без него — `//- @has_intro: false` в мета (подробно — `project-rules.md`, «Шапка и первый экран»):

```pug
section.section.section--intro(data-intro)
  .section_container
    h1.intro_title Заголовок
```

## Картинки

Только через миксин `+picture` (или `asset()` для svg/иконок):

```pug
+picture({ src: 'hero/main.jpg', alt: 'Описание', w: 1440, h: 800 })
+picture({ src: 'hero/main.jpg', mobile: 'hero/main-mobile.jpg', alt: '', w: 1440, h: 800, eager: true, cls: 'hero_picture' })(class="hero_img")
img.header_logo(src=asset('img/logo.svg') alt="Логотип" width="120" height="32")
```

- `src`, `mobile` — путь от `src/assets/img`;
- `w`, `h` — обязательны (против сдвига вёрстки);
- `eager: true` — только для картинки первого экрана, остальные грузятся лениво;
- `alt` — смысловой у содержательных, пустой у декоративных;
- webp/avif подставляются сами, если рядом лежат пары (`npm run images`).

## Данные

Списки, карточки, цены, пункты меню — в `src/data/*.json`, в разметке — `each` по `data.*`. Не вписывать повторяющийся контент руками в разметку.

## Поведение блоков

JS находит блоки по data-атрибутам, а не по id и порядку элементов: `div(data-slider)`, `a(data-fancybox="gallery")`, `div(data-reveal)`. Так блок работает в любой CMS, которая добавляет свои обёртки.

## Запрещено

- Дублировать одинаковую разметку на разных страницах.
- Создавать HTML-файлы вместо Pug.
- Писать большую секцию прямо внутри страницы.
- Писать пути `/src/assets/…` или `/assets/…` руками — только `asset()` / `+picture`.
- Вписывать повторяющийся контент в разметку вместо `src/data`.
- Использовать нечитаемые классы.
