// Шапка поверх первого экрана (html[data-has-intro="true"]): прозрачная, пока под ней интро,
// потом — класс is-solid. Интро — элемент с data-intro, иначе первая секция в main.
// Модуль не ленивый: шапка есть на каждой странице и видна сразу.
export function initHeader() {
  const header = document.querySelector('[data-header]')
  if (!header) return

  const hasIntro = document.documentElement.dataset.hasIntro === 'true'
  const intro = hasIntro && (document.querySelector('[data-intro]') || document.querySelector('.main > :first-child'))
  if (!intro || !('IntersectionObserver' in window)) {
    header.classList.add('is-solid')
    return
  }

  let observer
  const observe = () => {
    observer?.disconnect()
    // Высота шапки в пикселях окна: интро «закончилось», когда его низ ушёл под шапку
    observer = new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting),
      { rootMargin: `-${Math.round(header.offsetHeight)}px 0px 0px 0px` },
    )
    observer.observe(intro)
  }

  observe()
  // Высота шапки меняется вместе с масштабом и брейкпоинтом
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(observe, 150)
  })
}
