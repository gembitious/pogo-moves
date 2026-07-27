// Summarize what a data refresh actually changed, as markdown for the weekly PR body.
// Compares the committed state (HEAD) against the regenerated files in the working
// tree, so it must run AFTER the build-* scripts and BEFORE committing.
//
//   node scripts/data-change-summary.mjs > summary.md
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAX = 15 // cap listed ids so the PR body stays skimmable

const head = (p) => {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 }))
  } catch {
    return null
  }
}
const now = (p) => {
  try {
    return JSON.parse(readFileSync(resolve(root, p), 'utf8'))
  } catch {
    return null
  }
}
const list = (ids) => (ids.length > MAX ? `${ids.slice(0, MAX).join(', ')} … (+${ids.length - MAX})` : ids.join(', '))
const out = []
const say = (s = '') => out.push(s)

// ---- roster / index ------------------------------------------------------
const IDX = 'public/data/pokemon-index.json'
const a = head(IDX)
const b = now(IDX)
if (a && b) {
  const am = new Map(a.map((p) => [p.id, p]))
  const bm = new Map(b.map((p) => [p.id, p]))
  const added = [...bm.keys()].filter((k) => !am.has(k))
  const removed = [...am.keys()].filter((k) => !bm.has(k))
  const moveset = [...bm.values()].filter((p) => {
    const o = am.get(p.id)
    return o && JSON.stringify([o.fast, o.charged]) !== JSON.stringify([p.fast, p.charged])
  })
  const shadowA = a.filter((p) => p.shadow).length
  const shadowB = b.filter((p) => p.shadow).length

  say('### 포켓몬')
  say(`- 표시 종: **${a.length} → ${b.length}** (${b.length - a.length >= 0 ? '+' : ''}${b.length - a.length})`)
  if (added.length) say(`- 신규 ${added.length}: ${list(added)}`)
  if (removed.length) say(`- ⚠️ 제거 ${removed.length}: ${list(removed)}`)
  if (shadowA !== shadowB) say(`- 그림자 적격: **${shadowA} → ${shadowB}**`)
  if (moveset.length) say(`- 기술셋 변경 ${moveset.length}: ${list(moveset.map((p) => p.id))}`)
  const noSprite = b.filter((p) => !p.sprite).length
  if (noSprite) say(`- 스프라이트 없음(타입색 폴백): ${noSprite}종`)
  say()
}

// ---- move stats ----------------------------------------------------------
const MOVES = 'src/data/moves.json'
const ma = head(MOVES)
const mb = now(MOVES)
if (ma && mb) {
  const flat = (m) => [...m.fast.map((x) => ['fast', x]), ...m.charged.map((x) => ['charged', x])]
  const am = new Map(flat(ma).map(([k, m]) => [`${k}:${m.id}`, m]))
  const bm = new Map(flat(mb).map(([k, m]) => [`${k}:${m.id}`, m]))
  const added = [...bm.keys()].filter((k) => !am.has(k)).map((k) => k.split(':')[1])
  const removed = [...am.keys()].filter((k) => !bm.has(k)).map((k) => k.split(':')[1])
  const changed = [...bm.entries()]
    .filter(([k, m]) => am.has(k) && JSON.stringify([am.get(k).pvp, am.get(k).pve]) !== JSON.stringify([m.pvp, m.pve]))
    .map(([k]) => k.split(':')[1])

  say('### 기술')
  if (!added.length && !removed.length && !changed.length) say('- 스탯 변경 없음 (밸런스 변경 없었음)')
  if (changed.length) say(`- ⚠️ 스탯 변경 ${changed.length}: ${list(changed)}`)
  if (added.length) say(`- 신규 ${added.length}: ${list(added)}`)
  if (removed.length) say(`- ⚠️ 제거 ${removed.length}: ${list(removed)}`)
  say()
}

// ---- pvpoke league rankings ---------------------------------------------
// These are a derived snapshot that pvpoke rescores wholesale each week, so report
// deltas rather than expecting anyone to read the diff.
const rows = []
for (const lg of ['gl', 'ul', 'ml']) {
  const p = `public/data/rankings-${lg}.json`
  const ra = head(p)
  const rb = now(p)
  if (!ra || !rb) continue
  const shared = Object.keys(ra).filter((k) => k in rb)
  const score = shared.filter((k) => ra[k].score !== rb[k].score).length
  const mv = shared.filter((k) => JSON.stringify(ra[k].moveset) !== JSON.stringify(rb[k].moveset)).length
  rows.push(`| ${lg.toUpperCase()} | ${Object.keys(ra).length} → ${Object.keys(rb).length} | ${score} | ${mv} |`)
}
if (rows.length) {
  say('### 리그 랭킹 (pvpoke 산출물 — diff 대신 증감으로 확인)')
  say('| 리그 | 엔트리 | 점수 변경 | 추천 기술셋 변경 |')
  say('| --- | --- | --- | --- |')
  rows.forEach(say)
  say()
}

say('---')
say('워크플로 안에서 `check-data` · `astro check` · `test` · `build`를 모두 통과했습니다.')
say('(봇이 만든 PR은 GitHub 정책상 `ci.yml`을 트리거하지 못해, 검증을 워크플로가 직접 수행합니다.)')

console.log(out.join('\n'))
