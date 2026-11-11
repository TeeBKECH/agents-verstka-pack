// Карта страниц: фильтр по статусу (Все / Готово / На проверке / В работе / В плане) и счётчик процентов.
export function init(roots) {
  roots.forEach((root) => {
    if (root.dataset.ready) return
    root.dataset.ready = 'true'

    const filters = [...root.querySelectorAll('[data-map-filter]')]
    const groups = [...root.querySelectorAll('[data-map-group]')]
    filters.forEach((button) =>
      button.addEventListener('click', () => {
        const status = button.dataset.mapFilter
        filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
        groups.forEach((group) => {
          let visible = 0
          group.querySelectorAll('[data-status]').forEach((item) => {
            const show = status === 'all' || item.dataset.status === status
            item.hidden = !show
            if (show) visible++
          })
          group.hidden = visible === 0
        })
      }),
    )

    // Проценты отсчитываются от нуля, когда сводка появилась
    const percent = root.querySelector('[data-map-percent]')
    if (percent && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const target = Number(percent.dataset.mapPercent)
      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / 1100)
        percent.textContent = `${Math.round(target * (1 - Math.pow(1 - t, 3)))}%`
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  })
}
