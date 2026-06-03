// Season data pipeline: refresh src/data/moves.json RAW stats from the canonical
// Pokémon GO GAME_MASTER, while preserving the curated Korean names and roster.
//
//   node scripts/build-data.mjs                 # compare only, print a report
//   node scripts/build-data.mjs --write         # also write moves.json
//   node scripts/build-data.mjs --source <path> # use a local GAME_MASTER json
//
// Stats (the tedious, error-prone part) come from the GAME_MASTER. Names (which
// the GAME_MASTER has no Korean for) and the move roster come from the existing
// moves.json — so a season update is "run + review the diff", not hand-editing.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const SOURCE_URL = 'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'
const __dirname = dirname(fileURLToPath(import.meta.url))
const movesPath = resolve(__dirname, '../src/data/moves.json')
const namesPath = resolve(__dirname, 'data/move-names-ko.csv')
const pvpokePath = resolve(__dirname, 'data/pvpoke-moves.json')

const args = process.argv.slice(2)
const write = args.includes('--write')
const sourceArg = args[args.indexOf('--source') + 1]

const round3 = (n) => Math.round(n * 1000) / 1000

// English -> Korean move names (see scripts/data/move-names-ko.csv). Lets the
// pipeline give new moves a curated Korean name instead of only reporting them.
function loadKoNames() {
  const map = new Map()
  const text = readFileSync(namesPath, 'utf8').replace(/^﻿/, '')
  for (const line of text.split('\n')) {
    const j = line.indexOf(',')
    if (j < 0) continue
    const en = line.slice(0, j).trim()
    if (en) map.set(en, line.slice(j + 1).trim())
  }
  return map
}
const titleCase = (id) => id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
// look up Korean, falling back to the base name without a " (Variant)" suffix
const resolveKo = (ko, en) => ko.get(en) ?? ko.get(en.replace(/\s*\(.*\)$/, '')) ?? null
const gmType = (m) => String(m?.type ?? m?.pokemonType ?? '').replace('POKEMON_TYPE_', '').toLowerCase()

// pvpoke move archetypes (role classification: Nuke, Spam/Bait, Debuff, …) keyed by lowercased moveId.
function loadArchetypes() {
  const map = new Map()
  for (const m of JSON.parse(readFileSync(pvpokePath, 'utf8'))) if (m.archetype) map.set(m.moveId.toLowerCase(), m.archetype)
  return map
}

async function loadGameMaster() {
  if (sourceArg && !sourceArg.startsWith('--')) {
    return JSON.parse(readFileSync(resolve(process.cwd(), sourceArg), 'utf8'))
  }
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`GAME_MASTER fetch failed: ${res.status}`)
  return res.json()
}

// uniqueId/movementId keys, lowercased: e.g. "acid_fast", "acid_spray".
// Some moves (aura_wheel, dynamax_cannon, …) store a NUMERIC movementId/uniqueId
// in the source, so fall back to the name embedded in the templateId.
const nameFromTemplateId = (id) => id.replace(/^(COMBAT_)?V\d{4}_MOVE_/, '').toLowerCase()
const keyFor = (raw, id) => (typeof raw === 'string' ? raw.toLowerCase() : nameFromTemplateId(id))

function indexMoves(gm) {
  const pve = new Map()
  const pvp = new Map()
  for (const entry of gm) {
    const t = entry.data || entry
    const id = t.templateId || ''
    if (t.moveSettings && /^V\d{4}_MOVE_/.test(id)) {
      pve.set(keyFor(t.moveSettings.movementId, id), t.moveSettings)
    }
    if (t.combatMove && /^COMBAT_V\d{4}_MOVE_/.test(id)) {
      pvp.set(keyFor(t.combatMove.uniqueId, id), t.combatMove)
    }
  }
  return { pve, pvp }
}

// our move id -> GAME_MASTER key (a few moves are spelled differently in the source)
const ALIAS = {
  future_sight: 'futuresight',
  pyro_ball: 'pyroball',
}

// Techno Blast drive variants: our id suffix -> { source suffix, Korean drive label }.
// "douse" is the Water-type drive in the source (legacy constants.py: 아쿠아).
const DRIVE = {
  burn: { gm: 'burn', ko: '블레이즈' },
  chill: { gm: 'chill', ko: '프리즈' },
  douse: { gm: 'water', ko: '아쿠아' },
  shock: { gm: 'shock', ko: '라이트닝' },
}

function gmKeyFor(move, category) {
  if (category === 'fast') {
    if (move.id.startsWith('hidden_power_')) return 'hidden_power_fast' // GO has one; pvpoke splits per type
    return `${move.id}_fast`
  }
  if (move.id.startsWith('techno_blast_')) {
    const drive = move.id.slice('techno_blast_'.length)
    return `techno_blast_${DRIVE[drive]?.gm ?? drive}`
  }
  return ALIAS[move.id] ?? move.id
}

// Drive-specific Korean name for a Techno Blast variant (e.g. 테크노버스터(아쿠아)); null otherwise.
function driveName(move) {
  if (!move.id.startsWith('techno_blast_')) return null
  const d = DRIVE[move.id.slice('techno_blast_'.length)]
  return d ? `테크노버스터(${d.ko})` : null
}

function buffsFrom(combat) {
  const b = combat.buffs
  if (!b) return null
  const self = 'attackerAttackStatStageChange' in b || 'attackerDefenseStatStageChange' in b
  const atk = (self ? b.attackerAttackStatStageChange : b.targetAttackStatStageChange) ?? 0
  const def = (self ? b.attackerDefenseStatStageChange : b.targetDefenseStatStageChange) ?? 0
  if (atk === 0 && def === 0) return null // some moves carry an empty [0,0] buff — ignore it
  return { buffs: [atk, def], buffTarget: self ? 'self' : 'opponent', buffApplyChance: b.buffActivationChance }
}

// True when a move buffs BOTH sides (e.g. obstruct: self +Def and opponent -Def),
// which the single-target {buffs, buffTarget} schema can't represent.
function hasDualBuff(combat) {
  const b = combat.buffs
  if (!b) return false
  const self = (b.attackerAttackStatStageChange ?? 0) !== 0 || (b.attackerDefenseStatStageChange ?? 0) !== 0
  const opp = (b.targetAttackStatStageChange ?? 0) !== 0 || (b.targetDefenseStatStageChange ?? 0) !== 0
  return self && opp
}

function buildPvp(combat, category) {
  if (!combat) return null
  if (category === 'fast') {
    return { power: combat.power ?? 0, turn: (combat.durationTurns ?? 0) + 1, energyGain: combat.energyDelta ?? 0 }
  }
  const out = { power: combat.power ?? 0, energy: -(combat.energyDelta ?? 0) }
  const buff = buffsFrom(combat)
  if (buff) Object.assign(out, buff)
  return out
}

function buildPve(m, category) {
  if (!m) return null
  const win = {
    duration: round3((m.durationMs ?? 0) / 1000),
    damageWindowStart: round3((m.damageWindowStartMs ?? 0) / 1000),
    damageWindowEnd: round3((m.damageWindowEndMs ?? 0) / 1000),
  }
  if (category === 'fast') {
    return { power: m.power ?? 0, energyGain: m.energyDelta ?? 0, ...win }
  }
  return { power: m.power ?? 0, energy: -(m.energyDelta ?? 0), ...win }
}

// field-by-field diff between two stat blocks
function diffBlock(label, oldB, newB, changes, id) {
  if (!oldB && !newB) return
  if (!oldB || !newB) {
    changes.push(`${id} ${label}: ${oldB ? 'removed' : 'added'} in source`)
    return
  }
  for (const k of new Set([...Object.keys(oldB), ...Object.keys(newB)])) {
    const a = JSON.stringify(oldB[k])
    const b = JSON.stringify(newB[k])
    if (a !== b) changes.push(`${id} ${label}.${k}: ${a} -> ${b}`)
  }
}

async function main() {
  const gm = await loadGameMaster()
  const { pve, pvp } = indexMoves(gm)
  const current = JSON.parse(readFileSync(movesPath, 'utf8'))
  const archetypes = loadArchetypes()

  const changes = []
  const unmapped = { fast: [], charged: [] }
  const result = { fast: [], charged: [] }

  for (const category of ['fast', 'charged']) {
    for (const move of current[category]) {
      const key = gmKeyFor(move, category)
      const c = pvp.get(key)
      const p = pve.get(key)
      if (!c && !p) {
        unmapped[category].push(move.id)
        result[category].push(move) // keep curated entry untouched
        continue
      }
      const fresh = {
        id: move.id,
        name: driveName(move) ?? move.name, // GAME_MASTER has no Korean; drive variants get a KO label
        nameEn: move.nameEn,
        type: move.type,
        ...(archetypes.get(move.id) ? { archetype: archetypes.get(move.id) } : {}),
        ...(move.unreleased ? { unreleased: true } : {}),
        pvp: buildPvp(c, category) ?? move.pvp,
        pve: buildPve(p, category) ?? move.pve,
      }
      // Keep curated buff fields for dual-side moves the schema can't express.
      if (c && fresh.pvp && hasDualBuff(c) && move.pvp) {
        for (const k of ['buffs', 'buffTarget', 'buffApplyChance']) {
          if (k in move.pvp) fresh.pvp[k] = move.pvp[k]
          else delete fresh.pvp[k]
        }
      }
      diffBlock('pvp', move.pvp, fresh.pvp, changes, move.id)
      diffBlock('pve', move.pve, fresh.pve, changes, move.id)
      result[category].push(fresh)
    }
  }

  // moves in the source but not in our roster — add the real ones (resolvable
  // Korean name + chartable stats), report the rest.
  const known = new Set()
  for (const category of ['fast', 'charged'])
    for (const move of current[category]) known.add(gmKeyFor(move, category))

  const koNames = loadKoNames()
  const SKIP_NEW = new Set(['struggle', 'rest', 'transform']) // utility moves we don't chart
  const added = []
  const skippedNew = []
  for (const key of new Set([...pvp.keys(), ...pve.keys()])) {
    if (known.has(key)) continue
    const c = pvp.get(key)
    const p = pve.get(key)
    const isFast = (c && c.durationTurns !== undefined) || (p && (p.energyDelta ?? 0) > 0)
    const category = isFast ? 'fast' : 'charged'
    const id = isFast ? key.replace(/_fast$/, '') : key
    if (SKIP_NEW.has(id)) {
      skippedNew.push(`${id} (skip-list)`)
      continue
    }
    const nameEn = titleCase(id)
    const name = resolveKo(koNames, nameEn)
    if (!name) {
      skippedNew.push(`${id} (no KO name)`)
      continue
    }
    const arch = archetypes.get(id)
    const entry = { id, name, nameEn, type: gmType(c ?? p), ...(arch ? { archetype: arch } : {}), pvp: buildPvp(c, category), pve: buildPve(p, category) }
    const ok =
      category === 'charged'
        ? entry.pvp?.energy > 0 || entry.pve?.energy > 0
        : entry.pvp?.turn > 0 || entry.pve?.duration > 0
    if (!ok) {
      skippedNew.push(`${id} (no chartable stats)`)
      continue
    }
    result[category].push(entry)
    added.push(`${id} → ${name}`)
  }
  result.fast.sort((a, b) => a.id.localeCompare(b.id))
  result.charged.sort((a, b) => a.id.localeCompare(b.id))

  // ---- report -----------------------------------------------------------
  console.log(`source moves: ${pvp.size} pvp + ${pve.size} pve`)
  console.log(`roster: ${current.fast.length} fast + ${current.charged.length} charged`)
  console.log(`\nstat changes vs current: ${changes.length}`)
  for (const c of changes.slice(0, 60)) console.log('  ' + c)
  if (changes.length > 60) console.log(`  ... and ${changes.length - 60} more`)
  console.log(`\nunmapped (kept as-is): ${unmapped.fast.length} fast, ${unmapped.charged.length} charged`)
  if (unmapped.charged.length) console.log('  charged: ' + unmapped.charged.join(', '))
  console.log(`\nnew moves added (with KO name): ${added.length}`)
  for (const a of added) console.log('  ' + a)
  console.log(`new moves skipped: ${skippedNew.length}`)
  for (const s of skippedNew) console.log('  ' + s)

  if (write) {
    writeFileSync(movesPath, JSON.stringify(result, null, 2) + '\n')
    console.log('\nwrote src/data/moves.json')
  } else {
    console.log('\n(compare only — pass --write to update moves.json)')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
