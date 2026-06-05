// PvP damage — the exact Pokémon GO formula (verbatim constants from pvpoke's
// DamageCalculator), so breakpoints land on the right integer. This is a single-hit
// calculation, NOT a battle sim.
import { getEffectiveness, type Effectiveness } from './typeEffectiveness'
import type { PokemonType } from './types'

// Niantic's exact float multipliers (pvpoke DamageMultiplier).
export const BONUS = 1.2999999523162841796875
export const STAB = 1.2000000476837158203125
export const SHADOW_ATK = 1.2
export const SHADOW_DEF = 0.83333331
// Keyed by the Effectiveness union (incl. the legacy `netural` spelling) so the
// compiler forces this table to stay in lockstep with typeEffectiveness.
const EFF: Record<Effectiveness, number> = {
  super_effective: 1.60000002384185791015625,
  netural: 1,
  resisted: 0.625,
  doubly_resisted: 0.390625,
}

// Final type effectiveness of a move against a defender's type(s).
export function typeMultiplier(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let m = 1
  for (const d of defenderTypes) m *= EFF[getEffectiveness(moveType, d)]
  return m
}

export interface DamageInput {
  power: number
  atk: number // attacker effective Attack stat
  def: number // defender effective Defense stat
  stab: boolean
  effectiveness: number // product over defender types (typeMultiplier)
}

// damage = ⌊ power × STAB × (atk/def) × eff × 0.5 × BONUS ⌋ + 1
export function pvpDamage({ power, atk, def, stab, effectiveness }: DamageInput): number {
  return Math.floor(power * (stab ? STAB : 1) * (atk / def) * effectiveness * 0.5 * BONUS) + 1
}

// Smallest attacker Attack stat that deals `targetDamage` (pvpoke's breakpoint solve).
export function breakpointAtk(power: number, def: number, stab: boolean, effectiveness: number, targetDamage: number): number {
  return ((targetDamage - 1) * def) / (power * (stab ? STAB : 1) * effectiveness * 0.5 * BONUS)
}
