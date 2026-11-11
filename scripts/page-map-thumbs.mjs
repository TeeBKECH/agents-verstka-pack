// Превью страниц для карты страниц (index.html): верх экрана макета 1440 → webp 480 × 300.
// Источник — design/pages.json (поле desktop.screen) или файлы design/screens/desktop/<номер>-*.{webp,png,jpg}.
// Результат — src/assets/img/page-map/<номер>.webp; карточка с тем же номером (n в sitemap.json) покажет превью.
//   npm run thumbs   (после обновления экранов макета)
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import sharp from 'sharp'

const OUT = 'src/assets/img/page-map'

function sources() {
  if (fs.existsSync('design/pages.json')) {
    const json = JSON.parse(fs.readFileSync('design/pages.json', 'utf8'))
    return (json.pages || json).map((p) => ({ n: p.n, file: p.desktop?.screen })).filter((p) => p.file)
  }
  return fg
    .sync('design/screens/desktop/*.{webp,png,jpg,jpeg}')
    .map((file) => ({ n: path.basename(file).match(/^(\d+)/)?.[1], file }))
    .filter((p) => p.n)
}

const list = sources()
if (!list.length) {
  console.log('Нет экранов макета: положите design/screens/desktop/<номер>-<имя>.webp или design/pages.json')
  process.exit(0)
}

fs.mkdirSync(OUT, { recursive: true })
for (const { n, file } of list) {
  if (!fs.existsSync(file)) {
    console.warn(`нет файла: ${file}`)
    continue
  }
  const meta = await sharp(file).metadata()
  const height = Math.min(meta.height, Math.round(meta.width / 1.6))
  const out = path.join(OUT, `${n}.webp`)
  await sharp(file).extract({ left: 0, top: 0, width: meta.width, height }).resize({ width: 480 }).webp({ quality: 72 }).toFile(out)
  console.log(`${n} → ${out}  ${Math.round(fs.statSync(out).size / 1024)} КБ`)
}
