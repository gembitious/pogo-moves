// Refresh src/data/pokemon.json from the pvpoke gamemaster (roster, stats, moves,
// evolutions, shadow eligibility). pokemon.json is a verbatim mirror of pvpoke's
// pokemon[] — Korean names + sprites are layered on later by build-pokemon-index —
// so this just re-pulls the source and reports the drift.
//
//   node scripts/build-pokemon-data.mjs                  # compare only, print a report
//   node scripts/build-pokemon-data.mjs --write          # also write pokemon.json
//   node scripts/build-pokemon-data.mjs --source <path>  # use a local gamemaster json
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const SOURCE_URL = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.min.json'
const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../src/data/pokemon.json')
const args = process.argv.slice(2)
const write = args.includes('--write')
const sourceArg = args[args.indexOf('--source') + 1]

// Serialize like the pvpoke gamemaster: 4-space indent, arrays of primitives inline.
function fmt(v, indent = 0) {
  const pad = ' '.repeat(indent)
  const inner = ' '.repeat(indent + 4)
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    if (v.every((x) => x === null || typeof x !== 'object')) return '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']'
    return '[\n' + v.map((x) => inner + fmt(x, indent + 4)).join(',\n') + '\n' + pad + ']'
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v)
    if (keys.length === 0) return '{}'
    return '{\n' + keys.map((k) => inner + JSON.stringify(k) + ': ' + fmt(v[k], indent + 4)).join(',\n') + '\n' + pad + '}'
  }
  return JSON.stringify(v)
}

async function loadGameMaster() {
  if (sourceArg && !sourceArg.startsWith('--')) return JSON.parse(readFileSync(resolve(process.cwd(), sourceArg), 'utf8'))
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`pvpoke gamemaster fetch failed: ${res.status}`)
  return res.json()
}

async function main() {
  const gm = await loadGameMaster()
  const src = gm.pokemon ?? []
  if (!src.length) throw new Error('no pokemon[] found in gamemaster')
  const current = JSON.parse(readFileSync(outPath, 'utf8'))

  const curById = new Map(current.map((p) => [p.speciesId, p]))
  const srcById = new Map(src.map((p) => [p.speciesId, p]))
  const added = src.filter((p) => !curById.has(p.speciesId)).map((p) => p.speciesId)
  const removed = current.filter((p) => !srcById.has(p.speciesId)).map((p) => p.speciesId)
  const changed = []
  for (const p of src) {
    const c = curById.get(p.speciesId)
    if (c && JSON.stringify(c) !== JSON.stringify(p)) changed.push(p.speciesId)
  }

  const list = (a) => (a.length ? ' → ' + a.slice(0, 40).join(', ') + (a.length > 40 ? ` … (+${a.length - 40})` : '') : '')
  console.log(`pvpoke roster: ${src.length}, current: ${current.length}`)
  console.log(`added:   ${added.length}${list(added)}`)
  console.log(`removed: ${removed.length}${list(removed)}`)
  console.log(`changed: ${changed.length}${list(changed)}`)

  if (write) {
    // Match the existing file exactly (pvpoke ships CRLF, no trailing newline) so
    // the refresh diff is only real changes, not a line-ending reformat.
    writeFileSync(outPath, fmt(src).replace(/\n/g, '\r\n'))
    console.log('\nwrote src/data/pokemon.json — next: npm run build-pokemon-index')
  } else {
    console.log('\n(compare only — pass --write to update pokemon.json)')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
