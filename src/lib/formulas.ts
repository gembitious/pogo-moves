// Derived move stats, computed from RAW stats instead of being stored.
//
// The legacy data files baked dpt/ept/dpe/dps/eps into JSON by hand; the
// migration proved every one of those equals the formula below, so they are
// now derived on the fly and there is a single source of truth per move.
import type { PokemonType } from './types'

export interface FastPvpStats {
  power: number
  turn: number
  energyGain: number
}

export interface FastPveStats {
  power: number
  energyGain: number
  duration: number
  damageWindowStart: number
  damageWindowEnd: number
}

export interface ChargedPvpStats {
  power: number
  energy: number
  buffs?: [number, number] // [attack, defense]
  buffTarget?: 'self' | 'opponent'
  buffApplyChance?: number // 0 - 1
}

export interface ChargedPveStats {
  power: number
  energy: number
  duration: number
  damageWindowStart: number
  damageWindowEnd: number
}

export interface RawMove<Pvp, Pve> {
  id: string
  name: string
  nameEn: string
  type: PokemonType
  unreleased?: boolean
  pvp: Pvp | null
  pve: Pve | null
}

export type FastMove = RawMove<FastPvpStats, FastPveStats>
export type ChargedMove = RawMove<ChargedPvpStats, ChargedPveStats>

export const round2 = (n: number) => Math.round(n * 100) / 100

// Per-turn damage / energy (a PvP "turn" is a 0.5s window).
export const fastPvpDpt = (m: FastPvpStats) => round2(m.power / m.turn)
export const fastPvpEpt = (m: FastPvpStats) => round2(m.energyGain / m.turn)

export const fastPveDps = (m: FastPveStats) => round2(m.power / m.duration)
export const fastPveEps = (m: FastPveStats) => round2(m.energyGain / m.duration)
export const fastPveDpe = (m: FastPveStats) => round2(m.power / m.energyGain)

export const chargedDpe = (m: { power: number; energy: number }) => round2(m.power / m.energy)
export const chargedPveDps = (m: ChargedPveStats) => round2(m.power / m.duration)
