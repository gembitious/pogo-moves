// PvP IV ranking — pure math (no battle sim, no external data). For a species'
// base stats and a league CP cap, rank all 4096 IV spreads by "stat product"
// (bulk = Atk×Def×⌊HP⌋ at the highest level that stays under the cap). This is the
// same standard computation pvpoke / pvpivs do; we just do it ourselves.
import { CPM } from './cpm'
import type { League } from './rankings'

export const CP_CAPS: Record<League, number> = { gl: 1500, ul: 2500, ml: 10000 }
const DEFAULT_MAX_LEVEL = 50 // meta standard (best-buddy L51 excluded)

export interface IvSpread {
  ivA: number
  ivD: number
  ivS: number
  level: number
  cp: number
  hp: number
  atk: number // effective Attack stat (drives CMP ties)
  statProduct: number
  rank: number // 1-based, by stat product (desc)
  percent: number // statProduct / best × 100
}

export function cpOf(bA: number, bD: number, bS: number, ivA: number, ivD: number, ivS: number, m: number): number {
  const a = bA + ivA
  const d = bD + ivD
  const s = bS + ivS
  return Math.max(10, Math.floor((a * Math.sqrt(d) * Math.sqrt(s) * m * m) / 10))
}

// Largest level index whose CP stays within the cap (CP is monotonic in level).
function maxLevelIndex(bA: number, bD: number, bS: number, ivA: number, ivD: number, ivS: number, cap: number, maxIdx: number): number {
  let lo = 0
  let hi = maxIdx
  let ans = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cpOf(bA, bD, bS, ivA, ivD, ivS, CPM[mid]) <= cap) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

export function rankSpreads(bA: number, bD: number, bS: number, league: League, maxLevel = DEFAULT_MAX_LEVEL): IvSpread[] {
  const cap = CP_CAPS[league]
  const maxIdx = Math.min(CPM.length - 1, Math.round((maxLevel - 1) * 2))
  const list: IvSpread[] = []
  for (let ivA = 0; ivA <= 15; ivA++) {
    for (let ivD = 0; ivD <= 15; ivD++) {
      for (let ivS = 0; ivS <= 15; ivS++) {
        const i = maxLevelIndex(bA, bD, bS, ivA, ivD, ivS, cap, maxIdx)
        const m = CPM[i]
        const atk = (bA + ivA) * m
        const def = (bD + ivD) * m
        const hp = Math.floor((bS + ivS) * m)
        list.push({
          ivA,
          ivD,
          ivS,
          level: 1 + i * 0.5,
          cp: cpOf(bA, bD, bS, ivA, ivD, ivS, m),
          hp,
          atk,
          statProduct: atk * def * hp,
          rank: 0,
          percent: 0,
        })
      }
    }
  }
  list.sort((a, b) => b.statProduct - a.statProduct)
  const best = list[0].statProduct
  for (let i = 0; i < list.length; i++) {
    list[i].rank = i + 1
    list[i].percent = (list[i].statProduct / best) * 100
  }
  return list
}

export const findSpread = (list: IvSpread[], ivA: number, ivD: number, ivS: number): IvSpread | undefined =>
  list.find((s) => s.ivA === ivA && s.ivD === ivD && s.ivS === ivS)

// CMP (charge-move priority): on a same-turn charged move, the higher Attack stat
// goes first. Compare a spread's Attack to the reference (usually rank 1).
export const cmpVs = (a: IvSpread, ref: IvSpread): 'win' | 'tie' | 'lose' =>
  a.atk > ref.atk ? 'win' : a.atk === ref.atk ? 'tie' : 'lose'

// In-game search string: each top spread maps to a (CP, HP) pair; join the distinct
// pairs with "," (OR) so pasting it filters storage down to candidates for those IVs.
export function searchString(top: IvSpread[]): string {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const s of top) {
    const k = `${s.cp}&${s.hp}`
    if (!seen.has(k)) {
      seen.add(k)
      parts.push(k)
    }
  }
  return parts.join(',')
}
