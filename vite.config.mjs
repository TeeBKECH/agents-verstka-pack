import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import os from 'node:os'
import fs from 'fs'
import fg from 'fast-glob'
import pug from 'pug'
import prettier from 'prettier'
import autoprefixer from 'autoprefixer'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const ROOT = process.cwd()
const SRC_DIR = path.resolve(ROOT, 'src')
const ASSETS_DIR = path.join(SRC_DIR, 'assets')
const DATA_DIR = path.join(SRC_DIR, 'data')
const MIXINS_DIR = path.join(SRC_DIR, 'components', 'mixins')
const MIXINS_INDEX = path.join(MIXINS_DIR, '_all.pug')
const PAGES_GLOB = 'src/pages/**/*.pug'
const MAIN_ENTRY = path.resolve(SRC_DIR, 'scripts/main.js')

// Сборка для CMS (Битрикс, WordPress): npm run build:cms (vite build --mode cms).
// Имена без хешей, пути в CSS относительные, HTML-страницы не создаются.
// Папка — CMS_OUT_DIR в .env.cms.local (например ../cms/www/local/templates/site/assets), по умолчанию build-cms.

// Шрифты, которые нужно предзагрузить на страницах сборки: часть имени файла из src/assets/fonts.
// В CMS предзагрузку ставит шаблон сайта (header.php) по тем же файлам.
const PRELOAD_FONTS = []

/** Реальный порт после listen + все IPv4 — чтобы не гадать 5173/5174 и не брать 172.* Hyper‑V вслепую */
function logDevLanUrls() {
  return {
    name: 'log-dev-lan-urls',
    configureServer(server) {
      if (server.config.logLevel === 'error') return
      server.httpServer?.once('listening', () => {
        const raw = server.httpServer?.address()
        if (!raw || typeof raw === 'string') return
        const port = raw.port
        const rows = []
        for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
          if (!addrs) continue
          for (const a of addrs) {
            const v4 = a.family === 'IPv4' || a.family === 4
            if (!v4 || a.internal) continue
            rows.push({ name, address: a.address })
          }
        }
        if (!rows.length) return
        console.log('\n\x1b[36m  📱 С телефона тот же Wi‑Fi — скопируй URL (порт как у сервера):\x1b[0m')
        for (const { name, address } of rows) {
          console.log(`\x1b[32m     http://${address}:${port}/\x1b[0m  \x1b[90m(${name})\x1b[0m`)
        }
        console.log('')
      })
    },
  }
}

// Верхние мета-комментарии страницы:
// //- @title: ...
// //- @description: ...
// //- @page: имя страницы для data-page и scripts/pages/<имя>.js
function parseMetaFromPug(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const meta = {}
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^\/\/-\s*@([\w-]+)\s*:\s*(.+)$/)
    if (m) {
      meta[m[1]] = m[2].trim()
      continue
    }
    if (!trimmed.startsWith('//-')) break
  }
  return meta
}

function scanPages() {
  return fg.sync(PAGES_GLOB, { dot: false }).sort().map((file) => {
    const rel = path.relative(path.join(SRC_DIR, 'pages'), file).split(path.sep).join('/')
    const name = rel.replace(/\.pug$/, '') // about/index
    const meta = parseMetaFromPug(file)
    return {
      file,
      name,
      outName: `${name}.html`,
      href: `${name}.html`,
      title: meta.title || name,
      description: meta.description || '',
      meta,
    }
  })
}

// src/data/*.json → объект data в Pug: data/site.json → data.site, data/office-list.json → data.officeList
function loadData() {
  const data = {}
  for (const file of fg.sync('*.json', { cwd: DATA_DIR })) {
    const key = file.replace(/\.json$/, '').replace(/[-_.]+(\w)/g, (_, c) => c.toUpperCase())
    try {
      data[key] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
    } catch (e) {
      throw new Error(`[data] Ошибка в src/data/${file}: ${e.message}`)
    }
  }
  return data
}

// Pug-плагин: components/mixins/_all.pug не хранится на диске — собирается из всех файлов папки mixins.
// Новый миксин подключается сам, достаточно создать файл.
const mixinsIndexPlugin = {
  read(filename, loadOptions) {
    if (path.resolve(filename) === MIXINS_INDEX) {
      return fg
        .sync('**/*.pug', { cwd: MIXINS_DIR, ignore: ['_all.pug'] })
        .sort()
        .map((f) => `include ./${f}`)
        .join('\n')
    }
    return fs.readFileSync(filename, 'utf8')
  },
}

function createLocals(page, pages, { isProd, base }) {
  const assetBase = isProd ? `${base}assets/` : '/src/assets/'
  return {
    page: {
      ...page.meta,
      name: page.meta.page || page.name.replace(/\//g, '-'),
      title: page.title,
      description: page.description,
    },
    pages,
    data: loadData(),
    isProd,
    // Путь к файлу из src/assets: asset('img/hero/bg.jpg')
    asset: (p) => assetBase + String(p).replace(/^\/+/, ''),
    // Есть ли файл в src/assets — например, webp/avif-пара для картинки
    hasAsset: (p) => fs.existsSync(path.join(ASSETS_DIR, String(p).replace(/^\/+/, ''))),
  }
}

function renderPug(file, locals, pretty) {
  return pug.renderFile(file, {
    basedir: SRC_DIR,
    pretty,
    filename: file,
    plugins: [mixinsIndexPlugin],
    ...locals,
  })
}

// Простая инъекция в конец <body>
function injectToBody(html, injectString) {
  if (/<\/body\s*>/i.test(html)) return html.replace(/<\/body\s*>/i, `${injectString}\n</body>`)
  return html + injectString
}

// Простая инъекция в конец <head>
function injectToHead(html, injectString) {
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${injectString}\n</head>`)
  return injectString + '\n' + html
}

// MPA на Pug:
// - dev: страница компилируется по запросу, правка .pug или .json — перезагрузка страницы
// - build: HTML всех страниц с итоговыми css/js; для CMS-сборки HTML не нужен
function pugMpaPlugin({ prettifyOnProd = true, isCms = false } = {}) {
  let config
  let pages = scanPages()

  function resolvePageByUrlPath(urlPathname) {
    let p = decodeURIComponent(urlPathname)
    if (p === '/' || p === '') p = '/index.html'
    if (p.endsWith('/')) p = `${p}index.html`
    if (!p.endsWith('.html')) p = `${p}.html`
    const withoutSlash = p.replace(/^\//, '')
    return pages.find((pg) => pg.outName === withoutSlash)
  }

  return {
    name: 'pug-mpa',
    enforce: 'pre',

    configResolved(c) {
      config = c
    },

    configureServer(server) {
      const reload = () => server.ws.send({ type: 'full-reload' })
      const isWatched = (file) => file.endsWith('.pug') || file.startsWith(DATA_DIR)
      server.watcher.add(DATA_DIR)
      server.watcher.on('add', (file) => {
        if (file.endsWith('.pug')) pages = scanPages()
        if (isWatched(file)) reload()
      })
      server.watcher.on('unlink', (file) => {
        if (file.endsWith('.pug')) pages = scanPages()
        if (isWatched(file)) reload()
      })
      server.watcher.on('change', (file) => {
        if (file.startsWith(path.join(SRC_DIR, 'pages'))) pages = scanPages()
        if (isWatched(file)) reload()
      })

      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url) return next()
          const url = new URL(req.url, 'http://localhost')
          // Мета страниц читаем на каждый запрос: событие файловой системы может прийти
          // на середине записи файла, и закешированная мета окажется пустой
          if (/\.html$|\/$/.test(url.pathname) || !path.extname(url.pathname)) pages = scanPages()
          const page = resolvePageByUrlPath(url.pathname)
          if (!page) return next()

          let html = renderPug(page.file, createLocals(page, pages, { isProd: false, base: '/' }), true)
          html = injectToBody(
            html,
            [
              '<script type="module" src="/@vite/client"></script>',
              `<script type="module" src="${config.base || '/'}src/scripts/main.js"></script>`,
            ].join('\n'),
          )

          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
        } catch (e) {
          next(e)
        }
      })
    },

    async generateBundle(options, bundle) {
      if (isCms) return

      const chunks = Object.values(bundle)
      const entryChunk = chunks.find(
        (c) => c.type === 'chunk' && c.isEntry && (c.facadeModuleId === MAIN_ENTRY || c.name === 'app'),
      )
      if (!entryChunk) {
        this.error('[pug-mpa] Не найден entry chunk. Проверьте build.rollupOptions.input -> src/scripts/main.js')
      }

      const base = config.base || '/'
      const cssFiles = Array.from(entryChunk.viteMetadata?.importedCss || [])
      const fontFiles = chunks
        .filter((a) => a.type === 'asset' && /\.woff2$/.test(a.fileName))
        .filter((a) => PRELOAD_FONTS.some((name) => a.fileName.includes(name)))
        .map((a) => a.fileName)

      for (const page of pages) {
        try {
          let html = renderPug(page.file, createLocals(page, pages, { isProd: true, base }), false)

          const headTags = [
            ...fontFiles.map(
              (href) => `<link rel="preload" href="${base}${href}" as="font" type="font/woff2" crossorigin>`,
            ),
            ...cssFiles.map((href) => `<link rel="stylesheet" href="${base}${href}">`),
          ]
          if (headTags.length) html = injectToHead(html, headTags.join('\n'))
          html = injectToBody(html, `<script type="module" crossorigin src="${base}${entryChunk.fileName}"></script>`)

          if (prettifyOnProd) {
            try {
              html = await prettier.format(html, {
                parser: 'html',
                printWidth: 100,
                tabWidth: 2,
                useTabs: false,
                htmlWhitespaceSensitivity: 'ignore',
                bracketSameLine: false,
              })
            } catch (e) {
              this.warn(`[pug-mpa] prettify failed for ${page.outName}: ${e.message}`)
            }
          }

          this.emitFile({ type: 'asset', fileName: page.outName, source: html })
        } catch (err) {
          this.error(`[pug-mpa] Не удалось собрать ${page.outName}: ${err?.message || err}`)
        }
      }
    },
  }
}

// @/ в url() стилей → относительный путь от файла стиля (работает и в dev, и в сборке)
function cssAliasPlugin() {
  return {
    name: 'css-alias-resolver',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(s?css|sass)$/.test(id)) return null
      const resolved = code.replace(/url\(['"]@\/([^'"]+)['"]\)/g, (match, assetPath) => {
        let relativePath = path.relative(path.dirname(id), path.resolve(SRC_DIR, assetPath)).replace(/\\/g, '/')
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath
        return `url('${relativePath}')`
      })
      return resolved !== code ? resolved : null
    },
  }
}

// Папки src/assets, которые копируются в сборку как есть (картинки, видео…).
// Шрифты не копируем: их подключает CSS, Vite кладёт их в fonts/ сам.
function staticAssetTargets(dest) {
  if (!fs.existsSync(ASSETS_DIR)) return []
  return fs
    .readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'fonts')
    .filter((d) => fg.sync('**/*', { cwd: path.join(ASSETS_DIR, d.name), ignore: ['**/.gitkeep'] }).length)
    .map((d) => ({ src: `src/assets/${d.name}`, dest }))
}

export default defineConfig(({ command, mode }) => {
  const IS_CMS = mode === 'cms'
  const env = loadEnv(mode, ROOT, '')
  const CMS_OUT_DIR = path.resolve(ROOT, env.CMS_OUT_DIR || 'build-cms')
  const isProd = command === 'build'
  const devPort = Number(process.env.PORT) || 5173
  const prefix = IS_CMS ? '' : 'assets/'
  const hash = IS_CMS ? '' : '.[hash]'
  const copyTargets = staticAssetTargets(IS_CMS ? '.' : 'assets')

  return {
    plugins: [
      logDevLanUrls(),
      pugMpaPlugin({ prettifyOnProd: true, isCms: IS_CMS }),
      ...(copyTargets.length ? [viteStaticCopy({ targets: copyTargets })] : []),
      cssAliasPlugin(),
    ],

    root: ROOT,
    // CMS: относительные пути — сборка работает из любой папки шаблона
    base: IS_CMS ? './' : '/',
    publicDir: IS_CMS ? false : 'public',

    resolve: {
      alias: { '@': SRC_DIR },
      extensions: ['.js', '.scss', '.pug'],
    },

    css: {
      devSourcemap: !isProd,
      postcss: { plugins: [autoprefixer()] },
      // Переменные и миксины каждый SCSS-файл подключает сам: @use '../core' as *;
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import'],
        },
      },
    },

    server: {
      host: '0.0.0.0',
      port: devPort,
      open: '/index.html',
      strictPort: false,
      cors: true,
    },

    build: {
      outDir: IS_CMS ? CMS_OUT_DIR : 'build',
      // Папку вне проекта не очищаем: имена без хешей, файлы просто перезаписываются
      emptyOutDir: !IS_CMS || CMS_OUT_DIR.startsWith(ROOT + path.sep),
      sourcemap: false,
      cssCodeSplit: true,
      // Шрифты — всегда отдельными файлами: их предзагружают и кешируют
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/i.test(file) ? false : undefined),
      rollupOptions: {
        input: { app: MAIN_ENTRY },
        output: {
          entryFileNames: `${prefix}js/[name]${hash}.js`,
          chunkFileNames: `${prefix}js/[name]${hash}.js`,
          assetFileNames: (assetInfo) => {
            const ext = path.extname(assetInfo.names?.[0] || assetInfo.name || '').toLowerCase()
            if (ext === '.css') return `${prefix}css/[name]${hash}[extname]`
            if (/\.(woff2?|ttf|eot|otf)$/.test(ext)) return `${prefix}fonts/[name]${hash}[extname]`
            if (/\.(png|jpe?g|webp|avif|svg|gif)$/.test(ext)) return `${prefix}media/[name]${hash}[extname]`
            return `${prefix}[name]${hash}[extname]`
          },
        },
      },
    },
  }
})
