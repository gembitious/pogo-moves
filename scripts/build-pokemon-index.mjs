// Build slim, client-ready indexes for the move<->pokemon feature from
// src/data/pokemon.json (pvpoke roster). Outputs to public/data/ so the UI can
// lazy-fetch them instead of bundling the 1.3MB source.
//
//   node scripts/build-pokemon-index.mjs
//
//   public/data/pokemon-index.json : released non-shadow species (slim)
//   public/data/move-pokemon.json  : reverse index  moveId -> [speciesId]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

const P = JSON.parse(read('src/data/pokemon.json'))
const M = JSON.parse(read('src/data/moves.json'))
const moveIds = new Set([...M.fast, ...M.charged].map((m) => m.id))

// Korean species names by national dex (veekun species-i18n + manual overrides).
const ko = new Map()
for (const line of read('scripts/data/species-i18n.csv').split('\n').slice(1)) {
  const c = line.split(',')
  if (c[1] === '3') ko.set(c[0], c[2])
}
const koExtra = JSON.parse(read('scripts/data/species-ko-extra.json'))
const sprites = new Set(readdirSync(resolve(root, 'public/images/pokemon')).map((f) => f.replace(/\.png$/, '')))

// form label (speciesName parenthetical) -> Korean
const FORM_KO = {
  shadow: '섀도', mega: '메가', 'mega x': '메가 X', 'mega y': '메가 Y', primal: '원시',
  alolan: '알로라', galarian: '가라르', hisuian: '히스이', paldean: '팔데아',
  therian: '영물', origin: '오리진', incarnate: '화신', attack: '어택', defense: '디펜스', speed: '스피드',
}
// form label -> sprite filename suffix (where it differs)
const SPRITE_FORM = { alolan: 'alola', galarian: 'galarian', hisuian: 'hisuian', paldean: 'paldea' }

const formOf = (name) => name.match(/\(([^)]+)\)$/)?.[1] ?? null
const baseName = (name) => name.replace(/ \([^)]+\)$/, '')

function koOf(p) {
  const base = koExtra[p.dex] ?? ko.get(String(p.dex)) ?? baseName(p.speciesName)
  const form = formOf(p.speciesName)
  return form ? `${base} (${FORM_KO[form.toLowerCase()] ?? form})` : base
}
function spriteOf(p) {
  const form = formOf(p.speciesName)
  if (form) {
    const sf = SPRITE_FORM[form.toLowerCase()] ?? form.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (sprites.has(`${p.dex}_${sf}`)) return `images/pokemon/${p.dex}_${sf}.png`
  }
  return sprites.has(String(p.dex)) ? `images/pokemon/${p.dex}.png` : null
}
const normMoves = (arr) => [...new Set((arr ?? []).map((x) => x.toLowerCase()).filter((id) => moveIds.has(id)))]

const species = P.filter((p) => p.released && !p.speciesId.endsWith('_shadow'))
const list = species.map((p) => ({
  id: p.speciesId,
  dex: p.dex,
  name: koOf(p),
  nameEn: p.speciesName,
  types: p.types,
  atk: p.baseStats.atk,
  def: p.baseStats.def,
  hp: p.baseStats.hp,
  fast: normMoves(p.fastMoves),
  charged: normMoves(p.chargedMoves),
  sprite: spriteOf(p),
  family: p.family?.id ?? null,
}))

const reverse = {}
for (const p of list) for (const mid of [...p.fast, ...p.charged]) (reverse[mid] ??= []).push(p.id)

const outDir = resolve(root, 'public/data')
mkdirSync(outDir, { recursive: true })
const indexJson = JSON.stringify(list)
const reverseJson = JSON.stringify(reverse)
writeFileSync(resolve(outDir, 'pokemon-index.json'), indexJson + '\n')
writeFileSync(resolve(outDir, 'move-pokemon.json'), reverseJson + '\n')

// ---- report --------------------------------------------------------------
const kb = (s) => `${(s.length / 1024).toFixed(0)}KB`
const noSprite = list.filter((p) => !p.sprite)
const koGap = species.filter((p) => !(koExtra[p.dex] ?? ko.get(String(p.dex))))
console.log(`species (released, non-shadow): ${list.length}`)
console.log(`  with sprite: ${list.length - noSprite.length}, missing: ${noSprite.length}`)
console.log(`  no Korean base name: ${koGap.length}${koGap.length ? ' → dex ' + [...new Set(koGap.map((p) => p.dex))].join(',') : ''}`)
console.log(`reverse index: ${Object.keys(reverse).length} moves`)
console.log(`output sizes: pokemon-index ${kb(indexJson)}, move-pokemon ${kb(reverseJson)}`)
