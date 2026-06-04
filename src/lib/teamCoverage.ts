// Team type analysis — pure type math (instant, no sim). Reveals a team's shared
// defensive weaknesses (the thing that loses you a set) and its offensive STAB
// coverage gaps, from the canonical type chart we already ship.
import { POKEMON_TYPES, type PokemonType } from './types'
import { EFFECT_MULTIPLIER, getEffectiveness } from './typeEffectiveness'

// How much damage a defender of these type(s) takes from an attacking type.
export function defMultiplier(atk: PokemonType, defTypes: PokemonType[]): number {
  let m = 1
  for (const d of defTypes) m *= EFFECT_MULTIPLIER[getEffectiveness(atk, d)]
  return m
}

export interface DefenseRow {
  type: PokemonType // attacking type
  mults: number[] // per team member
  weak: number // members taking > 1×
  resist: number // members taking < 1×
}

// Per attacking type, how each member fares (+ how many are weak — the shared risk).
export function teamDefense(team: PokemonType[][]): DefenseRow[] {
  return POKEMON_TYPES.map((atk) => {
    const mults = team.map((types) => defMultiplier(atk, types))
    return {
      type: atk,
      mults,
      weak: mults.filter((m) => m > 1.001).length,
      resist: mults.filter((m) => m < 0.999).length,
    }
  })
}

// Offensive STAB coverage: which defending mono-types the team can hit
// super-effectively with at least one member's own (STAB) type.
export function teamOffense(team: PokemonType[][]): Record<PokemonType, boolean> {
  const stab = new Set(team.flat())
  return Object.fromEntries(
    POKEMON_TYPES.map((def) => [def, [...stab].some((atk) => getEffectiveness(atk, def) === 'super_effective')]),
  ) as Record<PokemonType, boolean>
}
