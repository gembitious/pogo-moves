// Magnitude guard for the weekly data refresh — the last line of defence before
// auto-merge. check-data validates *shape*; this validates *volume*. An upstream
// outage or schema drift that silently drops most of the roster/rankings would
// otherwise pass every other check (types, tests, build) and ship to production.
//
// Compares the regenerated files in the working tree against the committed
// versions (HEAD), so it must run AFTER the build-* scripts and BEFORE committing.
//
//   node scripts/guard-data.mjs
//   DATA_GUARD_MAX_DROP=0.2 node scripts/guard-data.mjs   # allow a larger, deliberate drop
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// `||` not `??`: an empty env var (e.g. an unset workflow input) must fall back too.
const parsed = Number(process.env.DATA_GUARD_MAX_DROP || 0.05)
const MAX_DROP = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.05

const head = (p) => {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 }))
  } catch {
    return null // file not committed yet (first run) → nothing to compare against
  }
}
const now = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))
const count = (v) => (Array.isArray(v) ? v.length : Object.keys(v).length)

// [label, path, sizer, allowed fractional drop]
const CHECKS = [
  ['roster (pokemon.json)', 'src/data/pokemon.json', count, MAX_DROP],
  ['index (pokemon-index.json)', 'public/data/pokemon-index.json', count, MAX_DROP],
  ['rankings GL', 'public/data/rankings-gl.json', count, MAX_DROP],
  ['rankings UL', 'public/data/rankings-ul.json', count, MAX_DROP],
  ['rankings ML', 'public/data/rankings-ml.json', count, MAX_DROP],
  // build-data preserves the existing move roster, so these can only grow — any drop is a bug.
  ['fast moves', 'src/data/moves.json', (m) => m.fast.length, 0],
  ['charged moves', 'src/data/moves.json', (m) => m.charged.length, 0],
]

const failures = []
for (const [label, path, size, allow] of CHECKS) {
  const cur = size(now(path))
  const prev = head(path)
  const before = prev ? size(prev) : null
  let status = 'ok'
  if (cur === 0) {
    status = 'EMPTY'
    failures.push(`${label}: regenerated file is empty`)
  } else if (before != null && cur < before * (1 - allow)) {
    status = 'DROP'
    failures.push(`${label}: ${before} → ${cur} (−${((1 - cur / before) * 100).toFixed(1)}%, limit ${(allow * 100).toFixed(0)}%)`)
  }
  console.log(`${status.padEnd(6)} ${label.padEnd(28)} ${before ?? '-'} → ${cur}`)
}

if (failures.length) {
  console.error('\n❌ data guard failed — refusing to ship this refresh:')
  for (const f of failures) console.error('  - ' + f)
  console.error('\nIf the drop is deliberate, re-run with DATA_GUARD_MAX_DROP=<fraction> (e.g. 0.2).')
  process.exit(1)
}
console.log(`\n✅ data guard passed (max allowed drop ${(MAX_DROP * 100).toFixed(0)}%)`)
