// Pokémon types in canonical display order (matches the legacy POKEMON_TYPE order).
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

// Chip / point colors per type (preserved verbatim from the legacy palette).
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#9a9da2',
  fire: '#f7a54f',
  water: '#589dd4',
  grass: '#60bd64',
  electric: '#edd53d',
  ice: '#81cec4',
  fighting: '#d94156',
  poison: '#a368ac',
  ground: '#d78555',
  flying: '#9eb3de',
  psychic: '#f37b7a',
  bug: '#9dc13b',
  rock: '#cec18c',
  ghost: '#6b70b4',
  dragon: '#2472ba',
  dark: '#5e606d',
  steel: '#5496a4',
  fairy: '#db9ac5',
}

export type MoveCategory = 'fast' | 'charged'
export type MoveMode = 'pvp' | 'pve'
