// Готовит картинки к сайту: рядом с каждым jpg/png в src/assets/img кладёт webp (и avif по флагу).
// Исходники не меняются. Повторный запуск пропускает файлы, у которых пара уже свежая.
//
//   npm run images                 webp для всех картинок
//   npm run images -- --avif       ещё и avif
//   npm run images -- --max=2400   ограничить ширину пар (исходник не трогается)
//   npm run images -- --force      пересобрать всё
//   npm run images -- img/hero     только папка (путь от src/assets)
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import sharp from 'sharp'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  return found ? Number(found.split('=')[1]) : fallback
}

const ROOT = path.resolve('src/assets')
const dirs = args.filter((a) => !a.startsWith('--'))
const patterns = (dirs.length ? dirs : ['img']).map((d) => `${d.replace(/\/$/, '')}/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}`)
const maxWidth = option('max', 0)
const formats = [
  { ext: 'webp', options: { quality: option('webp', 78), effort: 5 } },
  ...(flag('avif') ? [{ ext: 'avif', options: { quality: option('avif-quality', 55), effort: 5 } }] : []),
]

const kb = (bytes) => `${Math.round(bytes / 1024)} КБ`
const files = fg.sync(patterns, { cwd: ROOT, ignore: ['**/favicon/**'] }).sort()
let made = 0
let skipped = 0

for (const file of files) {
  const src = path.join(ROOT, file)
  const srcStat = fs.statSync(src)
  for (const { ext, options } of formats) {
    const out = src.replace(/\.(jpe?g|png)$/i, `.${ext}`)
    if (!flag('force') && fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcStat.mtimeMs) {
      skipped++
      continue
    }
    let pipeline = sharp(src).rotate()
    if (maxWidth) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
    await pipeline.toFormat(ext, options).toFile(out)
    made++
    console.log(`${file} → ${path.basename(out)}  ${kb(srcStat.size)} → ${kb(fs.statSync(out).size)}`)
  }
}

console.log(`\nГотово: создано ${made}, без изменений ${skipped}, картинок ${files.length}.`)
