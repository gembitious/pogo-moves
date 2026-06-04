// Slim pvpoke "overall" rankings (GL/UL/ML) into per-league client indexes:
//   public/data/rankings-{gl,ul,ml}.json  =  { [speciesId]: { score, moveset, matchups, counters } }
// Network fetch (pvpoke) → run manually or via the weekly workflow, then commit:
//   node scripts/build-rankings.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data')
const LEAGUES = { gl: 1500, ul: 2500, ml: 10000 }
const URL = (cap) => `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-${cap}.json`

mkdirSync(outDir, { recursive: true })
for (const [lg, cap] of Object.entries(LEAGUES)) {
  const res = await fetch(URL(cap))
  if (!res.ok) throw new Error(`rankings ${cap}: ${res.status}`)
  const out = {}
  for (const e of await res.json()) {
    out[e.speciesId] = {
      score: e.score,
      moveset: (e.moveset ?? []).map((m) => m.toLowerCase()), // match our lowercased move ids
      matchups: (e.matchups ?? []).map((x) => x.opponent), // best matchups (it beats these)
      counters: (e.counters ?? []).map((x) => x.opponent), // worst (these beat it)
    }
  }
  const json = JSON.stringify(out)
  writeFileSync(resolve(outDir, `rankings-${lg}.json`), json + '\n')
  console.log(`rankings-${lg}: ${Object.keys(out).length} entries, ${(json.length / 1024).toFixed(0)}KB`)
}
