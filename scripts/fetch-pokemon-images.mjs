// Download Pokémon sprites straight from PokeMiners/pogo_assets — no local clone.
// Discovers the sprite folder via the GitHub tree API, then fetches each sprite
// from raw.githubusercontent.com, renamed to {dex}.png / {dex}_{form}.png.
//
//   node scripts/fetch-pokemon-images.mjs           # download only what's missing
//   node scripts/fetch-pokemon-images.mjs --dry     # discover + report, no download
//   node scripts/fetch-pokemon-images.mjs --all     # (re)download everything
//   GH_TOKEN=<token> node scripts/fetch-pokemon-images.mjs   # 5000/hr instead of 60/hr
//
// After fetching, regenerate the index: npm run build-pokemon-index
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spriteDest } from './lib/pokeminers-sprites.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const destDir = resolve(__dirname, '../public/images/pokemon')
const REPO = process.env.POGO_ASSETS_REPO || 'PokeMiners/pogo_assets'
const BRANCH = process.env.POGO_ASSETS_BRANCH || 'master'
const dry = process.argv.includes('--dry')
const force = process.argv.includes('--all') || process.argv.includes('--force')

const ghHeaders = { 'User-Agent': 'pogo-moves', Accept: 'application/vnd.github+json' }
if (process.env.GH_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GH_TOKEN}`

async function api(url) {
  const r = await fetch(url, { headers: ghHeaders })
  if (r.status === 403 && r.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('GitHub API rate limit hit — set GH_TOKEN for 5000/hr (export GH_TOKEN=<token>).')
  }
  if (!r.ok) throw new Error(`GitHub API ${r.status}: ${url}`)
  return r.json()
}

// Resolve the recursive tree under Images/ (smaller, avoids whole-repo truncation).
async function spriteTree() {
  const root = await api(`https://api.github.com/repos/${REPO}/git/trees/${BRANCH}`)
  const images = root.tree.find((n) => n.path === 'Images' && n.type === 'tree')
  const sha = images ? images.sha : BRANCH
  const prefix = images ? 'Images/' : ''
  const t = await api(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`)
  if (t.truncated) console.warn('warning: tree truncated — some sprites may be missed.')
  return t.tree.map((n) => ({ ...n, path: prefix + n.path }))
}

async function main() {
  console.log(`discovering sprites in ${REPO}@${BRANCH} …`)
  const tree = await spriteTree()
  const wanted = new Map() // dest filename -> repo path
  for (const node of tree) {
    if (node.type !== 'blob') continue
    const dest = spriteDest(node.path.split('/').pop())
    if (dest) wanted.set(dest, node.path)
  }
  console.log(`found ${wanted.size} sprite files`)
  if (wanted.size === 0) throw new Error('no pm####.icon.png sprites found — PokeMiners layout may have changed.')

  mkdirSync(destDir, { recursive: true })
  const have = new Set(readdirSync(destDir))
  const targets = [...wanted].filter(([dest]) => force || !have.has(dest))
  console.log(`${targets.length} to ${dry ? 'fetch (dry run)' : 'download'} (${wanted.size - targets.length} already present)`)
  if (dry) {
    console.log('  sample:', targets.slice(0, 12).map(([d]) => d).join(', '))
    return
  }

  let got = 0
  let fail = 0
  for (const [dest, path] of targets) {
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path.split('/').map(encodeURIComponent).join('/')}`
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'pogo-moves' } })
      if (!r.ok) {
        fail++
        continue
      }
      writeFileSync(resolve(destDir, dest), Buffer.from(await r.arrayBuffer()))
      if (++got % 50 === 0) console.log(`  …${got}`)
    } catch {
      fail++
    }
  }
  console.log(`done: ${got} downloaded, ${fail} failed, ${have.size} already present`)
  console.log('next: npm run build-pokemon-index')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
