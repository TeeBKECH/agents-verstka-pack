# SCSS Rules

## Общие правила

Все стили пишутся на SCSS.

```txt
src/styles/core.scss         variables + mixins одной строкой (@forward)
src/styles/variables.scss    только значения, CSS не выводит
src/styles/mixins.scss       миксины
src/styles/base.scss         токены :root, body, .page, .page-scale
src/styles/fonts.scss        @font-face
src/styles/reset.scss
src/styles/styles.scss       точка подключения
src/styles/components/       один BEM-блок — один файл
```

## Подключение переменных и миксинов

Каждый SCSS-файл подключает их сам, первой строкой:

```scss
@use '../core' as *;   // в styles/components/*.scss
@use 'core' as *;      // в styles/*.scss
```

Автоматической подстановки нет: без этой строки переменные в файле не видны.

## styles.scss

Сначала база, затем компоненты:

```scss
@use 'core' as *;

@use 'reset';
@use 'base';
@use 'fonts';

@use 'components/section';
@use 'components/header';
@use 'components/footer';
@use 'components/hero';   // новые компоненты — ниже
```

CSS библиотек (Swiper, Fancybox) сюда **не** подключать: он импортируется в JS-модуле блока и грузится только на страницах, где этот блок есть (см. `js-rules.md`).

## Переменные

Все повторяемые значения — в `variables.scss`:

- макет: `$design-desktop`, `$design-mobile`;
- масштаб десктопа: `$use-desktop-scale`, `$scale-from`, `$scale-to`;
- брейкпоинты: `$breakpoint-xl` (1279), `$breakpoint-lg` (1023), `$breakpoint-md` (767), `$breakpoint-sm` (479);
- сетка: `$page-gutter*`, `$section-py*`;
- цвета `$color-*`, шрифт `$font-main`, движение `$duration`, `$easing`, слои `$z-*`;
- пути: `$img`, `$fonts`.

Не хардкодить повторяющиеся цвета и размеры внутри компонентных файлов.

## Миксины

| Миксин | Зачем |
|---|---|
| `mediaMax($bp)`, `mediaMin($bp)`, `mediaBetween($a, $b)` | медиазапросы — только через них |
| `onlyDescHover` | `:hover` только на устройствах с мышью |
| `withMotion`, `reducedMotion` | анимации с учётом «уменьшить движение» |
| `container` | колонка контента: `max-width: var(--page-max)`, поля `var(--page-gutter)` |
| `pageZoom` | масштаб десктопа (уже стоит на main, подвале и шапке — руками обычно не нужен) |
| `fontFace($family, $file, $weight, $style)` | `@font-face` с woff2 и `font-display: swap` |
| `visuallyHidden`, `focusRing`, `cover` | служебные |

```scss
.hero {
  padding: 120px 0;

  @include mediaMax($breakpoint-md) {
    padding: 80px 0;
  }
}
```

## Десктоп: пиксели макета

На десктопе (от `$scale-from`) все размеры — в пикселях макета, как в дизайне: масштаб делает `zoom` (правило `desktop-scale.mdc`). Не писать для десктопа `vw`, `clamp()` и формулы от ширины экрана. Ниже `$scale-from` — обычный адаптив через `mediaMax`.

Токены страницы (`base.scss`): `--page-max`, `--page-gutter`, `--section-py`, `--page-zoom`, `--section-bleed`.

## Секции и блоки

`section.scss` отвечает только за общий блок `.section`: отступы, фон, `&_container`, модификаторы секций. Компонентный файл отвечает за один BEM-блок: `hero.scss → .hero`, `card.scss → .card`.

## BEM и вложенность

```scss
.hero {
  $hero: &;

  &_content {}
  &_title {}
  &_text {}

  &--dark {
    #{$hero}_title {}
  }
}
```

1. Вложенность — через `&`.
2. Элементы — `&_element`.
3. Модификаторы — `&--modifier` или `&-modifier`.
4. Модификатор применяется к родительскому классу, дочерние элементы используют базовый класс.
5. Интерполяция `#{$block}_element` — только внутри модификатора блока.

Не использовать нечитаемые классы: `.h`, `.block1`, `.item2`.

## Assets в SCSS

Пути к картинкам и шрифтам в `url()` — через переменные-алиасы:

```scss
.hero {
  background-image: url('#{$img}/hero/bg.jpg');
}
```

Запрещено: `url('../../assets/img/bg.jpg')`.

## Запрещено

- Медиазапросы без миксина.
- Стили секции в компонентных файлах и стили блока внутри `.section--name`.
- CSS библиотек в `styles.scss`.
- `vw`/`clamp()` под ширину экрана для десктопа.
- Нечитаемые классы, хардкод повторяющихся цветов, относительные пути к assets.
