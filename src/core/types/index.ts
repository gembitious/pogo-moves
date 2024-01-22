import { Locale } from '@core/types/i18n-config'
import { POKEMON_TYPE } from '@core/constants'

export interface NextPageStaticParams {
  lang: Locale
}

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
  dpe: number
  buffs?: number[] // [attack, defense]
  buffTarget?: 'self' | 'opponent'
  buffApplyChance?: number // 0 - 1
}

export interface FastMovePvE extends BasicMove {
  energyGain: number
  duration: number
  damageWindowStart: number
  damageWindowEnd: number
  dps: number
  dpe: number
  eps: number
}

export interface ChargedMovePvE extends BasicMove {
  energy: number
  duration: number
  damageWindowStart: number
  damageWindowEnd: number
  dpe: number
  dps: number
}

export type MoveMode = 'pve' | 'pvp'

export type PokemonType = keyof typeof POKEMON_TYPE

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
