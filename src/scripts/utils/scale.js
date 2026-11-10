// Масштаб десктопа (desktop-scale) для расчётов в JS.
// getBoundingClientRect() — пиксели окна (с масштабом); offsetWidth, scrollLeft, значения CSS — пиксели макета.
// Перевод: пиксели окна / getPageZoom(el) = пиксели макета.
export function getPageZoom(el = document.querySelector('.main')) {
  if (!el) return 1
  const zoom = parseFloat(getComputedStyle(el).getPropertyValue('--page-zoom'))
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1
}
