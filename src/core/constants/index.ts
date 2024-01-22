import { ChargedMove, ChargedMovePvE, FastMove, FastMovePvE } from '@core/types'
import { isChargedMove, isChargedMovePvE, isFastMove, isFastMovePvE } from '@core/utils'
import chargedMoves from '@data/charged_moves.json'
import pveChargedMoves from '@data/charged_moves_pve.json'
import fastMoves from '@data/fast_moves.json'
import pveFastMoves from '@data/fast_moves_pve.json'
import { POKEMON_TYPE, POKEMON_TYPE_TEXT, TYPE_EFFECTIVENESS } from './pokemonType'

export const unreleasedMove = ['roar_of_time', 'spacial_rend']

export const getFastMoveData = (moves: object[]) => {
  const result: FastMove[] = []
  moves.map((move) => {
    if (isFastMove(move)) result.push(move)
  })
  return result
}

export const getChargedMoveData = (moves: object[]) => {
  const result: ChargedMove[] = []
  moves.map((move) => {
    if (isChargedMove(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}
export const getFastMovePvEData = (moves: object[]) => {
  const result: FastMovePvE[] = []
  moves.map((move) => {
    if (isFastMovePvE(move)) result.push(move)
  })
  return result
}

export const getChargedMovePvEData = (moves: object[]) => {
  const result: ChargedMovePvE[] = []
  moves.map((move) => {
    if (isChargedMovePvE(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}

export const fastMoveData: FastMove[] = getFastMoveData(fastMoves)
export const chargedMoveData: ChargedMove[] = getChargedMoveData(chargedMoves)
export const pveFastMoveData: FastMovePvE[] = getFastMovePvEData(pveFastMoves)
export const pveChargedMoveData: ChargedMovePvE[] = getChargedMovePvEData(pveChargedMoves)

export { POKEMON_TYPE, POKEMON_TYPE_TEXT, TYPE_EFFECTIVENESS }
