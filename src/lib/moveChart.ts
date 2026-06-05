// Pure move → chart-point mapping, shared by the scatter and the list view.
import { chargedDpe, chargedPveDps, fastPvpDpt, fastPvpEpt, type ChargedMove, type FastMove } from './formulas'
import { fmt, localName, type Dictionary, type Locale } from './i18n'
import type { MoveCategory, MoveMode, PokemonType } from './types'

export interface Point {
  id: string
  label: string
  type: PokemonType
  power: number
  x: number
  y: number
  lines: string[]
}

function buffLines(pvp: ChargedMove['pvp'], dict: Dictionary): string[] {
  if (!pvp?.buffs) return []
  const chance = fmt(dict.move.buffChance, { chance: Math.round((pvp.buffApplyChance ?? 0) * 100) })
  const target = pvp.buffTarget === 'self' ? dict.move.self : dict.move.opponent
  const [atk, def] = pvp.buffs
  const parts: string[] = []
  const rank = (n: number) => (n > 0 ? fmt(dict.move.rankUp, { n }) : fmt(dict.move.rankDown, { n: Math.abs(n) }))
  if (atk !== 0) parts.push(`${dict.move.attack} ${rank(atk)}`)
  if (def !== 0) parts.push(`${dict.move.defense} ${rank(def)}`)
  return [`${chance} ${target} ${parts.join(', ')}`]
}

export function buildPoints(
  category: MoveCategory,
  mode: MoveMode,
  moves: FastMove[] | ChargedMove[],
  dict: Dictionary,
  locale: Locale,
): Point[] {
  const label = (m: { name: string; nameEn: string }) => localName(locale, m)
  if (category === 'fast') {
    return (moves as FastMove[])
      .filter((m) => m.pvp)
      .map((m) => {
        const p = m.pvp!
        const dpt = fastPvpDpt(p)
        const ept = fastPvpEpt(p)
        return {
          id: m.id,
          label: label(m),
          type: m.type,
          power: p.power,
          x: dpt,
          y: ept,
          lines: [
            `${dict.move.damage}: ${p.power}`,
            `${dict.move.turn}: ${p.turn}    DPT: ${dpt}`,
            `${dict.move.energy}: ${p.energyGain}    EPT: ${ept}`,
          ],
        }
      })
  }
  if (mode === 'pvp') {
    return (moves as ChargedMove[])
      .filter((m) => m.pvp)
      .map((m) => {
        const p = m.pvp!
        const dpe = chargedDpe(p)
        return {
          id: m.id,
          label: label(m),
          type: m.type,
          power: p.power,
          x: p.energy,
          y: dpe,
          lines: [`${dict.move.damage}: ${p.power}`, `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`, ...buffLines(p, dict)],
        }
      })
  }
  return (moves as ChargedMove[])
    .filter((m) => m.pve)
    .map((m) => {
      const p = m.pve!
      const dpe = chargedDpe(p)
      const dps = chargedPveDps(p)
      return {
        id: m.id,
        label: label(m),
        type: m.type,
        power: p.power,
        x: dps,
        y: dpe,
        lines: [`${dict.move.damage}: ${p.power}`, `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`, `DPS: ${dps}`],
      }
    })
}
