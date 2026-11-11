// Точка входа: только подключение и запуск. Логика — в components/, pages/, utils/.
import '@/styles/styles.scss'

import { initHeader } from './components/initHeader.js'
import { initLazyComponents } from './utils/lazyInit.js'
import { initPageScript } from './utils/pageScript.js'
import { initReveal } from './utils/reveal.js'

initHeader()
initReveal()

// Блок → модуль. Модуль (и его библиотека с CSS) грузится, только если блок есть на странице,
// и только когда он подходит к экрану. В модуле — export function init(elements).
initLazyComponents({
  '[data-slider]': () => import('./components/initSliders.js'),
  '[data-fancybox]': () => import('./components/initGallery.js'),
  '[data-page-map]': () => import('./components/initPageMap.js'),
})

initPageScript()
