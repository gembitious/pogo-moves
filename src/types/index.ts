import { pokemonType } from '@constants'

interface BasicMove {
  id: string
  name: string
  nameEn: string
  type: PokemonType
  power: number
}

export interface FastMove extends BasicMove {
  energyGain: number
  turn: number
  ept: number
  dpt: number
}

export interface ChargedMove extends BasicMove {
  energy: number
  buffs?: number[] // [attack, defense]
  buffTarget?: 'self' | 'opponent'
  buffApplyChance?: number
}

export type PokemonType = keyof typeof pokemonType

export interface Pokemon {
  dex: number
  id: string
  name: string
  nameEn: string
  types: string[]
  fastMoves: string[]
  chargedMoves: string[]
  eliteMoves: string[]
  released: boolean
}

export type Placement =
  | 'bottom-end'
  | 'bottom-start'
  | 'bottom'
  | 'left-end'
  | 'left-start'
  | 'left'
  | 'right-end'
  | 'right-start'
  | 'right'
  | 'top-end'
  | 'top-start'
  | 'top'
