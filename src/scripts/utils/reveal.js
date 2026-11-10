// Появление блоков с атрибутом data-reveal при прокрутке. Стили — styles/components/reveal.scss.
export function initReveal(selector = '[data-reveal]') {
  const elements = document.querySelectorAll(selector)
  if (!elements.length) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-revealed'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  elements.forEach((el) => observer.observe(el))
}
