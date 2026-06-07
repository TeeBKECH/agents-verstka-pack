# SCSS Rules

## Общие правила

Все стили пишутся на SCSS.

Основные файлы:

```txt
src/styles/variables.scss
src/styles/mixins.scss
src/styles/fonts.scss
src/styles/reset.scss
src/styles/styles.scss
src/styles/components/
```

## Порядок подключения в styles.scss

Рекомендуемый порядок:

```scss
@import 'aos/dist/aos.css';
@import 'swiper/css';
@import 'swiper/css/navigation';
@import 'swiper/css/pagination';
@import 'swiper/css/thumbs';
@import '@fancyapps/ui/dist/fancybox/fancybox.css';

@use 'variables' as *;
@use 'mixins' as *;
@use 'reset';
@use 'fonts';

@use 'components/section';
@use 'components/header';
@use 'components/footer';
```

Новые компонентные SCSS-файлы подключаются ниже базовых компонентов.

## Переменные

Основные цвета, брейкпоинты, размеры и повторяемые значения хранить в:

```txt
src/styles/variables.scss
```

Пример:

```scss
$color-white: #ffffff;
$color-black: #000000;
$color-text: #1f1f1f;
$color-bg: #f7f3ec;
$color-accent: #c7a76c;

$breakpoint-xl: 1440px;
$breakpoint-lg: 1200px;
$breakpoint-md: 992px;
$breakpoint-sm: 768px;
$breakpoint-xs: 576px;

$img: '@/assets/img';
$fonts: '@/assets/fonts';
```

Не хардкодить повторяющиеся цвета внутри компонентных файлов.

## Миксины медиазапросов

Медиазапросы писать только через миксины из:

```txt
src/styles/mixins.scss
```

Пример:

```scss
@mixin mediaMax($width) {
  @media (max-width: $width) {
    @content;
  }
}

@mixin mediaMin($width) {
  @media (min-width: $width) {
    @content;
  }
}

@mixin onlyDescHover() {
  @media (hover: hover), (-ms-high-contrast: none) {
    @content;
  }
}
```

Использование:

```scss
.hero {
  padding: 120px 0;

  @include mediaMax($breakpoint-md) {
    padding: 80px 0;
  }
}
```

## Секции и блоки

`section.scss` отвечает только за общий блок `.section`:

- отступы секции;
- фон секции;
- контейнер секции;
- модификаторы секции `.section--hero`, `.section--about` и т.д.

Компонентный SCSS-файл отвечает за один BEM-блок.

Пример:

```txt
src/styles/components/hero.scss → .hero
src/styles/components/card.scss → .card
```

## BEM и вложенность

Использовать человекочитаемые селекторы.

Хорошо:

```scss
.hero {
  $hero: &;

  &_content {}
  &_title {}
  &_text {}
  &_button {}

  &--dark {
    #{$hero}_title {}
  }
}
```

Плохо:

```scss
.h {}
.h_t {}
.block1 {}
.item2 {}
```

## Правила вложенности

1. Вложенность писать через `&`.
2. Элементы писать через `&_element`.
3. Модификаторы писать через `&--modifier` или `&-modifier`.
4. Модификатор применяется к родительскому классу, а дочерние элементы используют базовый класс.
5. Интерполяцию `#{$block}_element` использовать только внутри модификатора блока, когда нужно обратиться к элементу базового блока.

## Assets в SCSS

Пути к картинкам в `url()` писать через алиас:

```scss
$img: '@/assets/img';

.hero {
  background-image: url('#{$img}/hero/bg.jpg');
}
```

Запрещено:

```scss
background-image: url('../../assets/img/bg.jpg');
```

## Запрещено

- Писать медиазапросы напрямую без миксина.
- Дублировать стили секции в компонентных файлах.
- Писать стили блока внутри `.section--name`.
- Использовать нечитаемые классы.
- Хардкодить повторяющиеся цвета.
- Использовать относительные пути к assets в `url()`.
