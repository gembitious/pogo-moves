// Sanity check for the committed data files — runs in CI and inside the weekly
// refresh so a bad seasonal edit or a broken upstream pull fails the build instead
// of shipping. Pure JSON checks (no TS imports) so it runs under plain `node`.
//   src/data/moves.json            hand-curated + GAME_MASTER stats
//   src/data/pokemon.json          pvpoke roster (refreshed weekly → shape can drift)
//   public/data/rankings-*.json    pvpoke league rankings (refreshed weekly)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const load = (p) => JSON.parse(readFileSync(resolve(__dirname, '..', p), 'utf8'))
const moves = load('src/data/moves.json')
const roster = load('src/data/pokemon.json')

const TYPES = new Set([
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
])

const errors = []
const num = (v) => typeof v === 'number' && Number.isFinite(v)
const want = (cond, id, msg) => { if (!cond) errors.push(`${id}: ${msg}`) }

function checkCommon(m) {
  want(typeof m.id === 'string' && m.id.length > 0, m.id, 'missing id')
  want(typeof m.name === 'string' && m.name.length > 0, m.id, 'missing name')
  want(typeof m.nameEn === 'string' && m.nameEn.length > 0, m.id, 'missing nameEn')
  want(TYPES.has(m.type), m.id, `invalid type "${m.type}"`)
  want(m.pvp || m.pve, m.id, 'has neither pvp nor pve stats')
}

for (const m of moves.fast) {
  checkCommon(m)
  if (m.pvp) want(num(m.pvp.power) && m.pvp.turn > 0 && num(m.pvp.energyGain), m.id, 'bad fast pvp stats')
  if (m.pve) want(num(m.pve.power) && m.pve.duration > 0 && m.pve.energyGain > 0, m.id, 'bad fast pve stats')
}
for (const m of moves.charged) {
  checkCommon(m)
  if (m.pvp) want(num(m.pvp.power) && m.pvp.energy > 0, m.id, 'bad charged pvp stats')
  if (m.pve) want(num(m.pve.power) && m.pve.energy > 0 && m.pve.duration > 0, m.id, 'bad charged pve stats')
}

// ---- roster (pvpoke) — the fields build-pokemon-index and the UI actually consume
want(Array.isArray(roster) && roster.length > 0, 'roster', 'pokemon.json must be a non-empty array')
const seen = new Set()
for (const p of Array.isArray(roster) ? roster : []) {
  const id = typeof p?.speciesId === 'string' ? p.speciesId : '?'
  want(id !== '?' && id.length > 0, id, 'missing speciesId')
  want(!seen.has(id), id, 'duplicate speciesId')
  seen.add(id)
  want(typeof p.speciesName === 'string' && p.speciesName.length > 0, id, 'missing speciesName')
  want(Number.isInteger(p.dex) && p.dex > 0, id, `bad dex ${p.dex}`)
  const s = p.baseStats
  want(s && num(s.atk) && num(s.def) && num(s.hp) && s.atk > 0 && s.def > 0 && s.hp > 0, id, 'bad baseStats')
  want(
    Array.isArray(p.types) && p.types.length > 0 && p.types.every((t) => t === 'none' || TYPES.has(t)),
    id,
    `bad types ${JSON.stringify(p.types)}`,
  )
  want(Array.isArray(p.fastMoves) && Array.isArray(p.chargedMoves), id, 'fastMoves/chargedMoves must be arrays')
  want(p.released == null || typeof p.released === 'boolean', id, 'released must be boolean')
}

// ---- league rankings (pvpoke) — what the pokemon page reads per league
for (const lg of ['gl', 'ul', 'ml']) {
  const r = load(`public/data/rankings-${lg}.json`)
  want(r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length > 0, `rankings-${lg}`, 'must be a non-empty object')
  for (const [id, e] of Object.entries(r ?? {})) {
    want(
      e && num(e.score) && Array.isArray(e.moveset) && Array.isArray(e.matchups) && Array.isArray(e.counters),
      `rankings-${lg}:${id}`,
      'bad entry (score/moveset/matchups/counters)',
    )
  }
}

const rosterN = Array.isArray(roster) ? roster.length : 0
console.log(`checked ${moves.fast.length} fast + ${moves.charged.length} charged moves, ${rosterN} roster entries, 3 ranking files; errors: ${errors.length}`)
const SHOW = 30 // a schema drift can fail every entry — don't flood the log
for (const e of errors.slice(0, SHOW)) console.log('  ' + e)
if (errors.length > SHOW) console.log(`  … and ${errors.length - SHOW} more`)
process.exit(errors.length === 0 ? 0 : 1)
