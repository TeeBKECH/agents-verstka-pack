# JavaScript Rules

## Общие правила

JavaScript должен быть модульным.

Структура:

```txt
src/scripts/
  components/
  pages/
  utils/
  main.js
```

## main.js

`main.js` — точка входа.

В `main.js` разрешено:

- импортировать модули;
- запускать инициализацию;
- подключать глобальные библиотеки;
- вызывать функции инициализации.

Не писать в `main.js` большие независимые куски логики.

## Components

Логика переиспользуемых UI-компонентов находится в:

```txt
src/scripts/components/
```

Пример:

```txt
src/scripts/components/initSliders.js
src/scripts/components/initModals.js
src/scripts/components/initTabs.js
```

## Pages

Логика конкретных страниц находится в:

```txt
src/scripts/pages/
```

Пример:

```txt
src/scripts/pages/homePage.js
src/scripts/pages/contactsPage.js
```

## Utils

Вспомогательные функции находятся в:

```txt
src/scripts/utils/
```

Пример:

```txt
src/scripts/utils/dom.js
src/scripts/utils/media.js
```

## Пример подключения

```js
import { initSliders } from './components/initSliders.js';
import { initTabs } from './components/initTabs.js';

initSliders();
initTabs();
```

## Запрещено

- Смешивать всю логику в одном `main.js`.
- Дублировать одинаковую JS-логику в разных файлах.
- Создавать модуль без необходимости.
- Писать page-specific код в `components/`, если он нужен только одной странице.
