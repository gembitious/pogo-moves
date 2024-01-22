import { ChargedMove, ChargedMovePvE, FastMove, FastMovePvE } from '@core/types'
import {
  getChargedMoveData,
  getChargedMovePvEData,
  getFastMoveData,
  getFastMovePvEData,
} from '@core/utils'
import chargedMoves from '@data/charged_moves.json'
import pveChargedMoves from '@data/charged_moves_pve.json'
import fastMoves from '@data/fast_moves.json'
import pveFastMoves from '@data/fast_moves_pve.json'
import { POKEMON_TYPE, POKEMON_TYPE_TEXT, TYPE_EFFECTIVENESS } from './pokemonType'

export const unreleasedMove = ['roar_of_time', 'spacial_rend']

export const fastMoveData: FastMove[] = getFastMoveData(fastMoves)
export const chargedMoveData: ChargedMove[] = getChargedMoveData(chargedMoves)
export const pveFastMoveData: FastMovePvE[] = getFastMovePvEData(pveFastMoves)
export const pveChargedMoveData: ChargedMovePvE[] = getChargedMovePvEData(pveChargedMoves)

export { POKEMON_TYPE, POKEMON_TYPE_TEXT, TYPE_EFFECTIVENESS }
