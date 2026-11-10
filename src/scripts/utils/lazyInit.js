// Ленивый запуск компонентов по селектору.
// registry: { '[data-slider]': () => import('../components/initSliders.js') }
// eager: true — грузить сразу, не дожидаясь, пока блок подойдёт к экрану.
export function initLazyComponents(registry, { rootMargin = '300px 0px', eager = false } = {}) {
  Object.entries(registry).forEach(([selector, loader]) => {
    const elements = [...document.querySelectorAll(selector)]
    if (!elements.length) return

    let started = false
    const start = () => {
      if (started) return
      started = true
      loader()
        .then((mod) => (mod.init || mod.default)?.(elements))
        .catch((error) => console.error(`[lazyInit] ${selector}:`, error))
    }

    if (eager || !('IntersectionObserver' in window)) {
      start()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          start()
        }
      },
      { rootMargin },
    )
    elements.forEach((el) => observer.observe(el))
  })
}
