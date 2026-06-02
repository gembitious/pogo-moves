// Sanity check for src/data/moves.json — runs in CI so a bad seasonal data
// edit fails the build instead of shipping a broken chart. Pure JSON checks
// (no TS imports) so it runs under plain `node`.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const moves = JSON.parse(readFileSync(resolve(__dirname, '../src/data/moves.json'), 'utf8'))

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

console.log(`checked ${moves.fast.length} fast + ${moves.charged.length} charged moves; errors: ${errors.length}`)
for (const e of errors) console.log('  ' + e)
process.exit(errors.length === 0 ? 0 : 1)
