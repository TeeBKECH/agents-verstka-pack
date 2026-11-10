# JavaScript Rules

## Структура

```txt
src/scripts/
  components/   модули блоков: init(elements)
  pages/        скрипты страниц: pages/<data-page>.js
  utils/        lazyInit, pageScript, reveal, scale…
  main.js       точка входа
```

## main.js

Только подключение и запуск: стили, `initReveal()`, реестр ленивых компонентов, `initPageScript()`. Логику сюда не писать.

## Компоненты: ленивая загрузка

Модуль блока (и его библиотека с CSS) грузится, только если блок есть на странице, и только когда он подходит к экрану. Регистрация — в `main.js`:

```js
initLazyComponents({
  '[data-slider]': () => import('./components/initSliders.js'),
  '[data-fancybox]': () => import('./components/initGallery.js'),
  '[data-tabs]': () => import('./components/initTabs.js'),
})
```

Модуль экспортирует `init(elements)` — массив найденных элементов:

```js
// components/initTabs.js
export function init(roots) {
  roots.forEach((root) => {
    // …
  })
}
```

- Библиотеки (Swiper, Fancybox и т. п.) и их CSS импортируются **только** в модуле блока, никогда в `main.js` или `styles.scss`.
- Блок находится по data-атрибуту. Не привязываться к id и порядку элементов: CMS добавляет свои обёртки.
- Модуль должен выдерживать повторный вызов (проверять, что блок уже инициализирован).
- Если блок нужен сразу на первом экране — `initLazyComponents({...}, { eager: true })` отдельным вызовом.

## Скрипт страницы

`<body data-page="contacts">` → `src/scripts/pages/contacts.js` (или `pages/contacts/index.js`), экспорт `init()`. Имя берётся из атрибута, а не из адреса: в CMS адреса другие, атрибут выставляет шаблон.

Сюда — только то, что нужно одной странице. Всё, что может повториться, — в `components/`.

## Утилиты

| Файл | Что |
|---|---|
| `components/initHeader.js` | прозрачная шапка поверх `[data-intro]`, класс `is-solid` (не ленивый — подключён в `main.js`) |
| `utils/lazyInit.js` | `initLazyComponents(registry, options)` |
| `utils/pageScript.js` | запуск `pages/<data-page>.js` |
| `utils/reveal.js` | появление `[data-reveal]` при прокрутке |
| `utils/scale.js` | `getPageZoom(el)` — масштаб десктопа для расчётов |

## Масштаб десктопа в JS

Внутри `.page-scale` действует `zoom` (правило `desktop-scale.mdc`):

- `getBoundingClientRect()` — пиксели окна, уже с масштабом;
- `offsetWidth`, `clientWidth`, `scrollLeft`, значения из CSS — пиксели макета;
- не смешивать в одной формуле; перевод — делением на `getPageZoom(el)`;
- окна, тултипы, `position: fixed` — создавать в `body` (блок `modals` в layout), не внутри `.page-scale`.

## Запрещено

- Писать логику в `main.js`.
- Импортировать библиотеки глобально.
- Дублировать одинаковую логику в разных файлах.
- Искать элементы по id и порядку, если блок может повториться или попасть в CMS.
- Писать page-specific код в `components/`.
