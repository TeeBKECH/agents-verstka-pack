import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import AOS from 'aos'

import '@/styles/styles.scss'

function getPageIdFromUrl() {
  const path = window.location.pathname.replace(/\/+/g, '/').replace(/^\/|\/$/g, '') // убираем ведущий/замыкающий слеш
  if (!path || path === '') return 'index'
  // /about -> about, /about/index.html -> about/index
  return path.replace(/\.html$/i, '') // about или about/index
}

const pageModules = import.meta.glob('./pages/**/*.js') // создаст ленивые загрузчики

async function boot() {
  const pageId = getPageIdFromUrl()
  // Пытаемся найти модуль страницы по двум конвенциям:
  // 1) ./pages/${pageId}.js (например, pages/media.js)
  // 2) ./pages/${lastSegment}/index.js (например, pages/media/index.js)
  const last = pageId.split('/').pop()
  const candidates = [`./pages/${pageId}.js`, `./pages/${last}/index.js`]

  for (const key of candidates) {
    const loader = pageModules[key]
    if (loader) {
      const mod = await loader()
      // вызываем init() или default(), если есть
      if (typeof mod.init === 'function') await mod.init()
      else if (typeof mod.default === 'function') await mod.default()
      break
    }
  }
}
boot()

document.addEventListener('DOMContentLoaded', (e) => {})
