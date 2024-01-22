import { PokemonType } from '@core/types'

export const POKEMON_TYPE = {
  normal: 'normal',
  fire: 'fire',
  water: 'water',
  grass: 'grass',
  electric: 'electric',
  ice: 'ice',
  fighting: 'fighting',
  poison: 'poison',
  ground: 'ground',
  flying: 'flying',
  psychic: 'psychic',
  bug: 'bug',
  rock: 'rock',
  ghost: 'ghost',
  dragon: 'dragon',
  dark: 'dark',
  steel: 'steel',
  fairy: 'fairy',
}

export const POKEMON_TYPE_TEXT = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  grass: '풀',
  electric: '전기',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
}

export const TYPE_EFFECTIVENESS = {
  doublyEffective: 2.56,
  superEffective: 1.6,
  netural: 1,
  resisted: 0.625,
  doublyResisted: 0.0390625,
}

export const POKEMON_TYPE_EFFECTIVENESS: {
  [key in PokemonType]: {
    [key in PokemonType]: (typeof TYPE_EFFECTIVENESS)[keyof typeof TYPE_EFFECTIVENESS]
  }
} = {
  normal: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.resisted,
    ghost: TYPE_EFFECTIVENESS.doublyResisted,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  fire: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.resisted,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.superEffective,
    ice: TYPE_EFFECTIVENESS.superEffective,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.superEffective,
    rock: TYPE_EFFECTIVENESS.resisted,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.resisted,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.superEffective,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  water: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.superEffective,
    water: TYPE_EFFECTIVENESS.resisted,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.resisted,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.superEffective,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.superEffective,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.resisted,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.netural,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  electric: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.superEffective,
    electric: TYPE_EFFECTIVENESS.resisted,
    grass: TYPE_EFFECTIVENESS.resisted,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.doublyResisted,
    flying: TYPE_EFFECTIVENESS.superEffective,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.resisted,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.netural,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  grass: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.superEffective,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.resisted,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.resisted,
    ground: TYPE_EFFECTIVENESS.superEffective,
    flying: TYPE_EFFECTIVENESS.resisted,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.resisted,
    rock: TYPE_EFFECTIVENESS.superEffective,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.resisted,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  ice: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.resisted,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.superEffective,
    ice: TYPE_EFFECTIVENESS.resisted,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.superEffective,
    flying: TYPE_EFFECTIVENESS.superEffective,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.superEffective,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  fighting: {
    normal: TYPE_EFFECTIVENESS.superEffective,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.superEffective,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.resisted,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.resisted,
    psychic: TYPE_EFFECTIVENESS.resisted,
    bug: TYPE_EFFECTIVENESS.resisted,
    rock: TYPE_EFFECTIVENESS.superEffective,
    ghost: TYPE_EFFECTIVENESS.doublyResisted,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.superEffective,
    steel: TYPE_EFFECTIVENESS.superEffective,
    fairy: TYPE_EFFECTIVENESS.resisted,
  },
  poison: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.superEffective,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.resisted,
    ground: TYPE_EFFECTIVENESS.resisted,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.resisted,
    ghost: TYPE_EFFECTIVENESS.resisted,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.doublyResisted,
    fairy: TYPE_EFFECTIVENESS.superEffective,
  },
  ground: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.superEffective,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.superEffective,
    grass: TYPE_EFFECTIVENESS.resisted,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.superEffective,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.doublyResisted,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.resisted,
    rock: TYPE_EFFECTIVENESS.superEffective,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.superEffective,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  flying: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.resisted,
    grass: TYPE_EFFECTIVENESS.superEffective,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.superEffective,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.superEffective,
    rock: TYPE_EFFECTIVENESS.resisted,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  psychic: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.superEffective,
    poison: TYPE_EFFECTIVENESS.superEffective,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.resisted,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.doublyResisted,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  bug: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.superEffective,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.resisted,
    poison: TYPE_EFFECTIVENESS.resisted,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.resisted,
    psychic: TYPE_EFFECTIVENESS.superEffective,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.resisted,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.superEffective,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.resisted,
  },
  rock: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.superEffective,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.superEffective,
    fighting: TYPE_EFFECTIVENESS.resisted,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.resisted,
    flying: TYPE_EFFECTIVENESS.superEffective,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.superEffective,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  ghost: {
    normal: TYPE_EFFECTIVENESS.doublyResisted,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.superEffective,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.superEffective,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.resisted,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
  dragon: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.superEffective,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.doublyResisted,
  },
  dark: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.netural,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.resisted,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.superEffective,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.superEffective,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.resisted,
    steel: TYPE_EFFECTIVENESS.netural,
    fairy: TYPE_EFFECTIVENESS.resisted,
  },
  steel: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.resisted,
    electric: TYPE_EFFECTIVENESS.resisted,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.superEffective,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.netural,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.superEffective,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.netural,
    dark: TYPE_EFFECTIVENESS.netural,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.superEffective,
  },
  fairy: {
    normal: TYPE_EFFECTIVENESS.netural,
    fire: TYPE_EFFECTIVENESS.resisted,
    water: TYPE_EFFECTIVENESS.netural,
    electric: TYPE_EFFECTIVENESS.netural,
    grass: TYPE_EFFECTIVENESS.netural,
    ice: TYPE_EFFECTIVENESS.netural,
    fighting: TYPE_EFFECTIVENESS.netural,
    poison: TYPE_EFFECTIVENESS.resisted,
    ground: TYPE_EFFECTIVENESS.netural,
    flying: TYPE_EFFECTIVENESS.netural,
    psychic: TYPE_EFFECTIVENESS.netural,
    bug: TYPE_EFFECTIVENESS.netural,
    rock: TYPE_EFFECTIVENESS.netural,
    ghost: TYPE_EFFECTIVENESS.netural,
    dragon: TYPE_EFFECTIVENESS.superEffective,
    dark: TYPE_EFFECTIVENESS.superEffective,
    steel: TYPE_EFFECTIVENESS.resisted,
    fairy: TYPE_EFFECTIVENESS.netural,
  },
}
