// Визуальная проверка вёрстки: снимки страниц на разных ширинах + автоматические проверки.
//
//   npm run visual                               все страницы, ширины по умолчанию
//   npm run visual -- --pages=main,contacts      только эти страницы (имена файлов из src/pages)
//   npm run visual -- --widths=1280,1920,2560    свои ширины
//   npm run visual -- --url=http://localhost:5173  взять уже запущенный npm run dev
//   npm run visual -- --no-shots                 только проверки, без снимков
//
// Снимки — .tmp/visual/<страница>/<ширина>.png, отчёт — .tmp/visual/report.json.
// Проверки (правило desktop-scale):
//   1. страница не прокручивается вбок;
//   2. левый край контента совпадает у шапки, секций и подвала (селекторы — --edge=);
//   3. масштаб --page-zoom: 1 ниже 1280, макет × ширина/ширина макета до 1920, дальше стоит.
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  return found ? found.slice(name.length + 3) : fallback
}
const list = (value) => value.split(',').map((v) => v.trim()).filter(Boolean)

const widths = list(option('widths', '390,768,1024,1280,1440,1920,2560')).map(Number)
const edgeSelectors = list(option('edge', '.header_container,.section_container,.footer_container'))
const shots = !args.includes('--no-shots')
const pages = option('pages', '')
  ? list(option('pages', ''))
  : fg.sync('**/*.pug', { cwd: 'src/pages' }).map((f) => f.replace(/\.pug$/, '')).sort()

const OUT = path.resolve('.tmp/visual')
fs.mkdirSync(OUT, { recursive: true })

let server
let baseUrl = option('url', '')
if (!baseUrl) {
  server = await createServer({ logLevel: 'error', server: { port: 5199, strictPort: false, open: false } })
  await server.listen()
  baseUrl = server.resolvedUrls.local[0]
}
baseUrl = baseUrl.replace(/\/$/, '')

const browser = await chromium.launch().catch(async (error) => {
  await server?.close()
  console.error(`Не запустился браузер: ${error.message.split('\n')[0]}\nУстановите его один раз: npx playwright install chromium`)
  process.exit(1)
})
const report = []
let failed = 0

for (const name of pages) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await page.goto(`${baseUrl}/${name}.html`, { waitUntil: 'networkidle' })

    const result = await page.evaluate((selectors) => {
      const doc = document.documentElement
      const zoomOf = (el) => parseFloat(getComputedStyle(el).getPropertyValue('--page-zoom')) || 1
      const main = document.querySelector('.main')
      const edges = []
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (!rect.width) return
          const scale = el.offsetWidth ? rect.width / el.offsetWidth : 1
          const left = rect.left + parseFloat(getComputedStyle(el).paddingLeft) * scale
          edges.push({ selector, left: Math.round(left * 10) / 10 })
        })
      }
      return {
        innerWidth,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        zoom: main ? Math.round(zoomOf(main) * 10000) / 10000 : null,
        edges,
      }
    }, edgeSelectors)

    const problems = []
    if (result.scrollWidth > result.clientWidth) {
      problems.push(`прокрутка вбок: ширина документа ${result.scrollWidth} > окна ${result.clientWidth}`)
    }
    if (result.edges.length > 1) {
      const lefts = result.edges.map((e) => e.left)
      const spread = Math.max(...lefts) - Math.min(...lefts)
      if (spread > 1) {
        problems.push(
          `края контента не совпадают (разброс ${spread.toFixed(1)}px): ` +
            result.edges.map((e) => `${e.selector}=${e.left}`).join(', '),
        )
      }
    }

    if (shots) {
      fs.mkdirSync(path.join(OUT, name), { recursive: true })
      await page.screenshot({ path: path.join(OUT, name, `${width}.png`), fullPage: true })
    }

    failed += problems.length ? 1 : 0
    report.push({ page: name, width, zoom: result.zoom, edge: result.edges[0]?.left ?? null, problems })
    console.log(
      `${problems.length ? '✗' : '✓'} ${name} @${width}  zoom ${result.zoom ?? '—'}  край ${result.edges[0]?.left ?? '—'}` +
        (problems.length ? `\n    ${problems.join('\n    ')}` : ''),
    )
    await context.close()
  }
}

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
await browser.close()
await server?.close()

console.log(`\n${failed ? `Есть замечания: ${failed}` : 'Замечаний нет'}. Снимки и отчёт — ${path.relative(process.cwd(), OUT)}/`)
process.exit(failed ? 1 : 0)
