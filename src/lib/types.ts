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

// Black or white label text per type, chosen by background luminance, so text on
// light types (electric, ice, …) stays legible (the all-white default failed contrast).
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
export const TYPE_TEXT = Object.fromEntries(
  POKEMON_TYPES.map((t) => [t, luminance(TYPE_COLORS[t]) > 0.45 ? '#10171c' : '#ffffff']),
) as Record<PokemonType, string>

export type MoveCategory = 'fast' | 'charged'
export type MoveMode = 'pvp' | 'pve'
