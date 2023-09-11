import { pokemonType } from '@/constants'

interface BasicMove {
  id: string
  name: string
  nameEn: string
  type: PokemonType
  power: number
}

interface FastMove extends BasicMove {
  energyGain: number
  turn: number
}
interface ChargedMove extends BasicMove {
  energy: number
  buffs?: number[] // [attack, defense]
  buffTarget?: 'self' | 'opponent'
  buffApplyChance?: number
}

type PokemonType = keyof typeof pokemonType

interface Pokemon {
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
