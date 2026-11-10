// Слайдеры Swiper. Разметка:
// div(data-slider='{"slidesPerView": 3, "spaceBetween": 24}')
//   .swiper
//     .swiper-wrapper
//       .swiper-slide …
//   button(data-slider-prev) / button(data-slider-next) / div(data-slider-pagination)
// Опции — JSON в data-slider (необязательно), полный список — swiperjs.com/swiper-api
import Swiper from 'swiper'
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

function parseOptions(value) {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    console.warn('[slider] data-slider: неверный JSON', value)
    return {}
  }
}

export function init(roots) {
  roots.forEach((root) => {
    const el = root.querySelector('.swiper') || root
    if (el.swiper) return

    const prevEl = root.querySelector('[data-slider-prev]')
    const nextEl = root.querySelector('[data-slider-next]')
    const paginationEl = root.querySelector('[data-slider-pagination]')

    new Swiper(el, {
      modules: [A11y, Keyboard, Navigation, Pagination],
      keyboard: { enabled: true, onlyInViewport: true },
      ...(prevEl || nextEl ? { navigation: { prevEl, nextEl } } : {}),
      ...(paginationEl ? { pagination: { el: paginationEl, clickable: true } } : {}),
      ...parseOptions(root.dataset.slider),
    })
  })
}
