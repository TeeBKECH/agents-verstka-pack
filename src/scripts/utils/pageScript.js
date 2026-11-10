// Скрипт страницы: <body data-page="contacts"> → scripts/pages/contacts.js (или pages/contacts/index.js).
// Имя берётся из атрибута, а не из адреса: в CMS адреса другие, атрибут ставит шаблон.
const pageModules = import.meta.glob('../pages/**/*.js')

export async function initPageScript() {
  const name = document.body.dataset.page
  if (!name) return

  const loader = pageModules[`../pages/${name}.js`] || pageModules[`../pages/${name}/index.js`]
  if (!loader) return

  const mod = await loader()
  await (mod.init || mod.default)?.()
}
