// Type effectiveness derived from the canonical attacking relations, rather
// than the 419-line hand-written 18x18 matrix it replaces (which had already
// needed one bug-fix commit). Pokémon GO has no immunities: a main-series ×0
// becomes a double resist, so single-type effectiveness is one of four values.
import { POKEMON_TYPES, type PokemonType } from './types'

export type Effectiveness = 'super_effective' | 'netural' | 'resisted' | 'doubly_resisted'

// Multipliers (kept for reference / future dual-type math).
export const EFFECT_MULTIPLIER: Record<Effectiveness, number> = {
  super_effective: 1.6,
  netural: 1, // legacy spelling, kept to match the /images/types/type_netural.png asset
  resisted: 0.625,
  doubly_resisted: 0.390625,
}

interface Relation {
  strong: PokemonType[] // super effective against
  weak: PokemonType[] // not very effective against
  immune: PokemonType[] // ×0 in the main series -> double resist in GO
}

// attacker -> how it fares against each defending type
const RELATIONS: Record<PokemonType, Relation> = {
  normal: { strong: [], weak: ['rock', 'steel'], immune: ['ghost'] },
  fire: { strong: ['grass', 'ice', 'bug', 'steel'], weak: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { strong: ['fire', 'ground', 'rock'], weak: ['water', 'grass', 'dragon'], immune: [] },
  grass: {
    strong: ['water', 'ground', 'rock'],
    weak: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    immune: [],
  },
  electric: { strong: ['water', 'flying'], weak: ['grass', 'electric', 'dragon'], immune: ['ground'] },
  ice: { strong: ['grass', 'ground', 'flying', 'dragon'], weak: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: {
    strong: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weak: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    immune: ['ghost'],
  },
  poison: { strong: ['grass', 'fairy'], weak: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { strong: ['fire', 'electric', 'poison', 'rock', 'steel'], weak: ['grass', 'bug'], immune: ['flying'] },
  flying: { strong: ['grass', 'fighting', 'bug'], weak: ['electric', 'rock', 'steel'], immune: [] },
  psychic: { strong: ['fighting', 'poison'], weak: ['psychic', 'steel'], immune: ['dark'] },
  bug: {
    strong: ['grass', 'psychic', 'dark'],
    weak: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    immune: [],
  },
  rock: { strong: ['fire', 'ice', 'flying', 'bug'], weak: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { strong: ['psychic', 'ghost'], weak: ['dark'], immune: ['normal'] },
  dragon: { strong: ['dragon'], weak: ['steel'], immune: ['fairy'] },
  dark: { strong: ['psychic', 'ghost'], weak: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { strong: ['ice', 'rock', 'fairy'], weak: ['fire', 'water', 'electric', 'steel'], immune: [] },
  fairy: { strong: ['fighting', 'dragon', 'dark'], weak: ['fire', 'poison', 'steel'], immune: [] },
}

export function getEffectiveness(attacker: PokemonType, defender: PokemonType): Effectiveness {
  const rel = RELATIONS[attacker]
  if (rel.immune.includes(defender)) return 'doubly_resisted'
  if (rel.strong.includes(defender)) return 'super_effective'
  if (rel.weak.includes(defender)) return 'resisted'
  return 'netural'
}

// Full attacker x defender matrix, computed once at module load.
export const TYPE_MATRIX: Record<PokemonType, Record<PokemonType, Effectiveness>> = Object.fromEntries(
  POKEMON_TYPES.map((attacker) => [
    attacker,
    Object.fromEntries(POKEMON_TYPES.map((defender) => [defender, getEffectiveness(attacker, defender)])),
  ]),
) as Record<PokemonType, Record<PokemonType, Effectiveness>>
